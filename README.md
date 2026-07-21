# Flywise

Live website: <https://wuisabel-gif.github.io/Flywise/>

Flywise is a TypeScript MVP for disruption recovery. It ranks replacement flights by practical equivalence to a traveler's original ticket instead of treating the current public fare as the whole answer.

The repository includes:

- A polished React/Vite passenger workspace.
- A transparent scoring engine for schedule, exchange cost, cabin, baggage, routing, and rebooking likelihood.
- Editable airport/city, date, passenger, cabin, and flexibility search.
- A secure Duffel adapter for real-time offers from its airline network, including American Airlines and hundreds of other carriers.
- Demo inventory that is clearly labeled and never substituted for another route after a live-search failure.
- An MCP Apps server with data-first search tools and a separate render tool for ChatGPT.
- Unit tests for ranking, flexibility filtering, and agent-request generation.

## Local development

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173`.

### Enable live airline search

1. Copy `.env.example` to `.env` and add a Duffel test or live access token.
2. Run the API with `npm run dev:server`.
3. Run the frontend with `VITE_FLYWISE_API_URL=http://127.0.0.1:3000 npm run dev`.

The token is read only by the Express server and is never included in browser JavaScript. Flywise creates a Duffel offer request and normalizes the returned operating carrier, flights, routing, cabin, baggage, public price, and conditions before ranking the options.

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

GitHub Pages hosts only the frontend. Deploy `render.yaml` as a Render Blueprint (or deploy the same Node server elsewhere), set its `DUFFEL_ACCESS_TOKEN`, then add the backend URL as the GitHub repository variable `FLYWISE_API_URL`. The Pages workflow injects that URL at build time.

Duffel publicly lists American Airlines and 300+ other airlines. Delta does not appear in Duffel's current public airline directory; full Delta shopping requires a separate approved Delta/GDS partnership. The provider boundary in `server/duffel.ts` is intentionally isolated so another authorized provider can be added without changing the Flywise UI or scoring engine.

Flywise remains a decision assistant, not a universal ticket-exchange system. Search results are live public offers, but an existing ticket's exchange cost still depends on the issuing carrier, fare rules, waiver policy, booking-class inventory, interline agreements, and servicing authority. The UI therefore requires airline confirmation instead of presenting an unverified exchange price.

The visual specification is stored at `design/flywise-concept.png`.
