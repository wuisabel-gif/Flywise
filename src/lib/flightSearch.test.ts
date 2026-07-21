import { describe, expect, it } from "vitest";
import { createBookingFromQuery } from "./flightSearch";

describe("createBookingFromQuery", () => {
  it("keeps the user's original flight and ticket details", () => {
    const booking = createBookingFromQuery({
      origin: "ATL",
      destination: "MIA",
      departureDate: "2026-09-12",
      departureTime: "08:35",
      passengerCount: 2,
      airline: "Delta Air Lines",
      flightNumber: "DL 1442",
      bookingReference: "FLY123",
      originalFare: 640,
      checkedBags: 1,
    }, { flexibilityDays: 2, preferredCabin: "Economy", maximumConnections: 1 });

    expect(booking).toMatchObject({
      origin: "ATL",
      destination: "MIA",
      departure: "2026-09-12T08:35:00",
      airline: "Delta Air Lines",
      flightNumber: "DL 1442",
      bookingReference: "FLY123",
      paidAmount: 640,
      checkedBags: 1,
      passengerCount: 2,
    });
  });
});
