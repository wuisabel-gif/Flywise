import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { z } from "zod";
import { mockOffers, originalBooking } from "../src/data/mockFlights.js";
import { findEquivalentFlights, generateAgentRequest } from "../src/lib/matchingEngine.js";
import type { Cabin, SearchPreferences } from "../src/types.js";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(currentDirectory, "..");
const distDirectory = path.join(rootDirectory, "dist");
const templateUri = "ui://flywise/rebooking-results-v1.html";

const preferencesSchema = z.object({
  flexibilityDays: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(2),
  preferredCabin: z.enum(["Economy", "Premium economy", "Business", "First"]).default("Business"),
  maximumConnections: z.number().int().min(0).max(3).default(1),
});

function getMatches(preferences: SearchPreferences) {
  return findEquivalentFlights(originalBooking, mockOffers, preferences);
}

function loadWidgetHtml() {
  try {
    const js = readFileSync(path.join(distDirectory, "assets/flywise-widget.js"), "utf8");
    const css = readFileSync(path.join(distDirectory, "assets/flywise-widget.css"), "utf8");
    return `<div id="root"></div><style>${css}</style><script type="module">${js}</script>`;
  } catch {
    return `<main style="font-family:system-ui;padding:24px"><h2>Flywise widget is not built yet.</h2><p>Run <code>npm run build</code>, then restart the MCP server.</p></main>`;
  }
}

function createFlywiseServer() {
  const server = new McpServer(
    { name: "flywise", version: "0.1.0" },
    {
      instructions: "Use search_equivalent_flights before rendering results. Always describe exchange costs as estimates unless airline confirmation is available. Flywise recommendations do not guarantee ticketing eligibility.",
    },
  );

  registerAppResource(
    server,
    "Flywise rebooking results",
    templateUri,
    { description: "Interactive ranked flight-rebooking comparison" },
    async () => ({
      contents: [{
        uri: templateUri,
        mimeType: RESOURCE_MIME_TYPE,
        text: loadWidgetHtml(),
        _meta: {
          ui: {
            prefersBorder: false,
            csp: {
              connectDomains: [],
              resourceDomains: ["https://fonts.googleapis.com", "https://fonts.gstatic.com"],
            },
          },
          "openai/widgetDescription": "Flywise compares ranked replacement flights, estimated exchange costs, and fare-equivalence reasons after an airline disruption.",
        },
      }],
    }),
  );

  registerAppTool(
    server,
    "search_equivalent_flights",
    {
      title: "Search equivalent replacement flights",
      description: "Use this when a traveler needs ranked replacement flights after a cancellation, delay, or schedule change. Returns transparent match scores and estimated—not guaranteed—exchange costs.",
      inputSchema: { preferences: preferencesSchema.optional() },
      outputSchema: {
        originalBooking: z.record(z.string(), z.unknown()),
        matches: z.array(z.record(z.string(), z.unknown())),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true },
      _meta: {},
    },
    async ({ preferences }) => {
      const parsed: SearchPreferences = {
        flexibilityDays: preferences?.flexibilityDays ?? 2,
        preferredCabin: (preferences?.preferredCabin ?? "Business") as Cabin,
        maximumConnections: preferences?.maximumConnections ?? 1,
      };
      const matches = getMatches(parsed);
      return {
        structuredContent: { originalBooking, matches },
        content: [{ type: "text", text: `Found ${matches.length} replacement options. The best match is ${matches[0]?.airline ?? "unavailable"} at ${matches[0]?.equivalenceScore ?? 0}%, with an estimated exchange cost of $${matches[0]?.estimatedExchangeCost ?? 0}. Airline confirmation is required.` }],
      };
    },
  );

  registerAppTool(
    server,
    "render_rebooking_results",
    {
      title: "Show Flywise comparison",
      description: "Use this after search_equivalent_flights to render an interactive comparison. Pass the offer IDs returned by the search tool.",
      inputSchema: { offerIds: z.array(z.string()).min(1).max(4) },
      outputSchema: {
        originalBooking: z.record(z.string(), z.unknown()),
        matches: z.array(z.record(z.string(), z.unknown())),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true },
      _meta: {
        ui: { resourceUri: templateUri },
        "openai/outputTemplate": templateUri,
        "openai/toolInvocation/invoking": "Comparing replacement flights…",
        "openai/toolInvocation/invoked": "Replacement comparison ready",
      },
    },
    async ({ offerIds }) => {
      const allMatches = getMatches({ flexibilityDays: 3, preferredCabin: "Business", maximumConnections: 1 });
      const matches = offerIds.map((id) => allMatches.find((match) => match.id === id)).filter((match) => match !== undefined);
      return {
        structuredContent: { originalBooking, matches },
        content: [{ type: "text", text: `Showing ${matches.length} Flywise replacement options. Costs remain estimates until the airline confirms the exchange.` }],
      };
    },
  );

  registerAppTool(
    server,
    "compare_fare_conditions",
    {
      title: "Compare fare conditions",
      description: "Use this when a traveler asks how a specific replacement differs from the original cabin, baggage, routing, timing, or flexibility.",
      inputSchema: { offerId: z.string() },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true },
      _meta: {},
    },
    async ({ offerId }) => {
      const match = getMatches({ flexibilityDays: 3, preferredCabin: "Business", maximumConnections: 1 }).find((item) => item.id === offerId);
      if (!match) return { isError: true, content: [{ type: "text", text: "That offer is no longer available in this search." }] };
      return { structuredContent: { offerId, reasons: match.reasons, warnings: match.warnings, breakdown: match.breakdown }, content: [{ type: "text", text: `${match.airline} scores ${match.equivalenceScore}%. ${match.reasons.join("; ")}. ${match.warnings.join("; ")}.` }] };
    },
  );

  registerAppTool(
    server,
    "generate_airline_agent_request",
    {
      title: "Generate airline agent request",
      description: "Use this when a traveler wants concise wording to ask an airline agent for involuntary reaccommodation on a selected replacement flight.",
      inputSchema: { offerId: z.string() },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true },
      _meta: {},
    },
    async ({ offerId }) => {
      const match = getMatches({ flexibilityDays: 3, preferredCabin: "Business", maximumConnections: 1 }).find((item) => item.id === offerId);
      if (!match) return { isError: true, content: [{ type: "text", text: "That offer is no longer available in this search." }] };
      const request = generateAgentRequest(originalBooking, match);
      return { structuredContent: { request, offerId }, content: [{ type: "text", text: request }] };
    },
  );

  return server;
}

const app = createMcpExpressApp();
app.use(express.json({ limit: "1mb" }));
app.get("/health", (_request, response) => response.json({ status: "ok", app: "flywise" }));
app.use("/", express.static(distDirectory));

app.post("/mcp", async (request, response) => {
  const server = createFlywiseServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  response.on("close", () => { void transport.close(); void server.close(); });
  try {
    await server.connect(transport);
    await transport.handleRequest(request, response, request.body);
  } catch (error) {
    console.error("MCP request failed", error);
    if (!response.headersSent) response.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: "Internal server error" }, id: null });
  }
});

app.all("/mcp", (_request, response) => response.status(405).json({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed" }, id: null }));

const port = Number.parseInt(process.env.PORT ?? "3000", 10);
app.listen(port, "127.0.0.1", () => console.log(`Flywise MCP server listening at http://127.0.0.1:${port}/mcp`));
