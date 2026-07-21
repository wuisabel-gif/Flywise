import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import cors from "cors";
import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { z } from "zod";
import { mockOffers, originalBooking } from "../src/data/mockFlights.js";
import { findAirport } from "../src/data/airports.js";
import { findEquivalentFlights, generateAgentRequest } from "../src/lib/matchingEngine.js";
import { searchDuffelOffers } from "./duffel.js";
import type { Cabin, FlightSearchQuery, OriginalBooking, SearchPreferences } from "../src/types.js";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(currentDirectory, "..");
const distDirectory = path.join(rootDirectory, "dist");
const templateUri = "ui://flywise/rebooking-results-v1.html";

const preferencesSchema = z.object({
  flexibilityDays: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(2),
  preferredCabin: z.enum(["Economy", "Premium economy", "Business", "First"]).default("Business"),
  maximumConnections: z.number().int().min(0).max(3).default(1),
});
const searchQuerySchema = z.object({
  origin: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  destination: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  passengerCount: z.number().int().min(1).max(9).default(1),
});

function createSearchBooking(query: FlightSearchQuery, preferences: SearchPreferences): OriginalBooking {
  const arrival = new Date(`${query.departureDate}T12:00:00Z`);
  arrival.setUTCDate(arrival.getUTCDate() + 1);
  return {
    ...originalBooking,
    id: `search-${query.origin}-${query.destination}-${query.departureDate}`,
    origin: query.origin,
    originCity: findAirport(query.origin)?.city ?? query.origin,
    destination: query.destination,
    destinationCity: findAirport(query.destination)?.city ?? query.destination,
    departure: `${query.departureDate}T12:00:00`,
    arrival: arrival.toISOString().replace(".000Z", ""),
    airline: "Original airline",
    flightNumber: "Your flight",
    cabin: preferences.preferredCabin,
    checkedBags: preferences.preferredCabin === "Business" || preferences.preferredCabin === "First" ? 2 : 1,
    passengerCount: query.passengerCount,
    paidAmount: 1,
    bookingReference: "Add reference",
  };
}

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
      inputSchema: { query: searchQuerySchema.optional(), preferences: preferencesSchema.optional() },
      outputSchema: {
        originalBooking: z.record(z.string(), z.unknown()),
        matches: z.array(z.record(z.string(), z.unknown())),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true, idempotentHint: true },
      _meta: {},
    },
    async ({ query, preferences }) => {
      const parsed: SearchPreferences = {
        flexibilityDays: preferences?.flexibilityDays ?? 2,
        preferredCabin: (preferences?.preferredCabin ?? "Business") as Cabin,
        maximumConnections: preferences?.maximumConnections ?? 1,
      };
      const booking = query ? createSearchBooking(query, parsed) : originalBooking;
      const offers = query ? await searchDuffelOffers(query, parsed.preferredCabin, parsed.maximumConnections) : mockOffers;
      const matches = findEquivalentFlights(booking, offers, parsed);
      const exchangeSummary = matches[0]?.exchangeEstimateAvailable === false
        ? "The exchange cost requires airline confirmation"
        : `The estimated exchange cost is $${matches[0]?.estimatedExchangeCost ?? 0}`;
      return {
        structuredContent: { originalBooking: booking, matches },
        content: [{ type: "text", text: `Found ${matches.length} replacement options. The best match is ${matches[0]?.airline ?? "unavailable"} at ${matches[0]?.equivalenceScore ?? 0}%. ${exchangeSummary}. Airline confirmation is required.` }],
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
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(",") ?? ["https://wuisabel-gif.github.io", "http://127.0.0.1:5173", "http://localhost:5173"] }));
app.get("/health", (_request, response) => response.json({ status: "ok", app: "flywise" }));
app.post("/api/flights/search", async (request, response) => {
  const parsed = z.object({ query: searchQuerySchema, preferences: preferencesSchema }).safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Enter valid three-letter origin and destination codes, a departure date, and 1–9 passengers." });
    return;
  }
  try {
    const { query, preferences } = parsed.data;
    const booking = createSearchBooking(query, preferences as SearchPreferences);
    const offers = await searchDuffelOffers(query, preferences.preferredCabin as Cabin, preferences.maximumConnections);
    const matches = findEquivalentFlights(booking, offers, preferences as SearchPreferences);
    response.json({ booking, matches, provider: "duffel" });
  } catch (error) {
    console.error("Flight search failed", error);
    response.status(503).json({ error: error instanceof Error ? error.message : "The live airline search is temporarily unavailable." });
  }
});
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
app.listen(port, "0.0.0.0", () => console.log(`Flywise server listening on port ${port}`));
