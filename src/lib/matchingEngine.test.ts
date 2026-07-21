import { describe, expect, it } from "vitest";
import { mockOffers, originalBooking } from "../data/mockFlights";
import { findEquivalentFlights, generateAgentRequest } from "./matchingEngine";

const preferences = { flexibilityDays: 2 as const, preferredCabin: "Business" as const, maximumConnections: 1 };

describe("matching engine", () => {
  it("ranks the protected nonstop option first", () => {
    const matches = findEquivalentFlights(originalBooking, mockOffers, preferences);
    expect(matches[0].id).toBe("offer-sk932");
    expect(matches[0].equivalenceScore).toBeGreaterThanOrEqual(90);
    expect(matches[0].estimatedExchangeCost).toBe(0);
  });

  it("filters offers outside the flexibility window", () => {
    const farAway = { ...mockOffers[0], id: "far", departure: "2026-05-15T12:25:00-07:00" };
    expect(findEquivalentFlights(originalBooking, [farAway], preferences)).toHaveLength(0);
  });

  it("creates a useful agent request", () => {
    const match = findEquivalentFlights(originalBooking, mockOffers, preferences)[0];
    expect(generateAgentRequest(originalBooking, match)).toContain("involuntary reaccommodation");
    expect(generateAgentRequest(originalBooking, match)).toContain("ABC123");
  });
});
