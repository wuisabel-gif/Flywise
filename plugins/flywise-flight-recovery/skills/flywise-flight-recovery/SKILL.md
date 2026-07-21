---
name: flywise-flight-recovery
description: Find and compare equivalent replacement flights after airline cancellations, significant delays, or schedule changes. Use when a traveler needs disruption recovery, wants to preserve cabin or baggage benefits, wants to minimize additional cost, needs alternatives to an original itinerary, or wants wording for an airline reaccommodation request.
---

# Flywise Flight Recovery

Guide a traveler from a disrupted original itinerary to realistic replacement options using the Flywise MCP tools. Treat Flywise as a decision assistant, not as proof that an airline will exchange or ticket an offer.

## Recover a disrupted trip

1. Establish that the request concerns a cancellation, significant delay, or schedule change. If it is a voluntary change, say that airline fare rules and change fees may apply.
2. Collect the minimum missing information:
   - origin and destination airport codes
   - original departure date and approximate time
   - original airline and flight number
   - passenger count
   - cabin, checked bags, and amount paid when known
   - maximum connections and date flexibility
3. Do not require a booking reference to search. Treat a supplied booking reference as sensitive and avoid repeating it unnecessarily.
4. Call `search_equivalent_flights` with the collected original trip and preferences.
5. Present up to four useful options. Include the equivalence score, schedule, routing, cabin, baggage, public price, and important warnings.
6. Clearly label exchange cost as estimated or requiring airline confirmation. Never imply that a public fare is the amount the traveler must pay to exchange the original ticket.
7. Call `render_rebooking_results` when an interactive comparison would improve the decision.
8. Call `compare_fare_conditions` when the traveler wants details about one returned offer.
9. Call `generate_airline_agent_request` only after the traveler selects an offer or explicitly asks for wording to contact the airline.

## Handle missing tools or live inventory

- If Flywise tools are unavailable, explain that the local Flywise MCP server must be running; do not invent live offers.
- If the live provider returns no offers, suggest modest changes to date flexibility, nearby airports, cabin, or connection limits before concluding that no itinerary exists.
- Identify demo inventory as demo data. Never present it as live availability for a different route or date.
- Do not claim coverage for an airline unless the connected provider returns its offer.

## Apply safety boundaries

- Keep all plugin actions read-only. Do not book, cancel, exchange, pay, or contact an airline on the traveler's behalf.
- Require airline or ticketing-agent confirmation for exchange eligibility, waiver application, interline acceptance, and final cost.
- Distinguish facts returned by tools from inferences about likely reaccommodation.
- Ask before transmitting a booking reference, ticket number, loyalty number, payment data, or identity document to any external service.

Read [equivalence-and-safety.md](references/equivalence-and-safety.md) when explaining scores, comparing an unusual itinerary, or handling eligibility and cost uncertainty.
