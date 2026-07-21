# Flywise

Live website: <https://wuisabel-gif.github.io/Flywise/>

Flywise is a TypeScript MVP for disruption recovery. It ranks replacement flights by practical equivalence to a traveler's original ticket instead of treating the current public fare as the whole answer.

The repository includes:

- A polished React/Vite passenger workspace.
- A transparent scoring engine for schedule, exchange cost, cabin, baggage, routing, and rebooking likelihood.
- Mock inventory behind provider-shaped data types, ready to replace with Duffel, Amadeus, or an airline/NDC adapter.
- An MCP Apps server with data-first search tools and a separate render tool for ChatGPT.
- Unit tests for ranking, flexibility filtering, and agent-request generation.

## Local development

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173`.

To build the widget and run the MCP server:

```bash
npm run build
npm run dev:server
```

The health route is `http://127.0.0.1:3000/health` and the MCP endpoint is `http://127.0.0.1:3000/mcp`.

## Connect in ChatGPT Developer Mode

1. Build and start the MCP server.
2. Expose port 3000 through an HTTPS tunnel, such as `ngrok http 3000`.
3. In ChatGPT, enable Developer Mode under **Settings → Apps & Connectors → Advanced settings**.
4. Create a new app and use the public tunnel URL ending in `/mcp`.
5. Refresh the app after changing tool descriptors, metadata, or the widget template.

## MCP tools

- `search_equivalent_flights` — data-only, ranked equivalent options.
- `render_rebooking_results` — renders the interactive Flywise widget after search.
- `compare_fare_conditions` — explains a selected offer's scoring and warnings.
- `generate_airline_agent_request` — produces a concise involuntary-reaccommodation request.

All tools are read-only and idempotent. Exchange costs are explicitly estimates until an airline confirms them.

## Production boundary

This MVP is a decision assistant, not a universal ticket-exchange system. Live production results depend on the issuing carrier, fare rules, waiver policy, booking-class inventory, interline agreements, and servicing authority. Replace `src/data/mockFlights.ts` with provider adapters and retain the existing normalized `FlightOffer` boundary.

The visual specification is stored at `design/flywise-concept.png`.
