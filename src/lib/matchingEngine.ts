import type {
  Cabin,
  EquivalentFlight,
  FlightOffer,
  MatchBreakdown,
  OriginalBooking,
  SearchPreferences,
} from "../types";

const cabinRank: Record<Cabin, number> = {
  Economy: 0,
  "Premium economy": 1,
  Business: 2,
  First: 3,
};

const clamp = (value: number) => Math.max(0, Math.min(100, value));
const hoursBetween = (a: string, b: string) => Math.abs(new Date(a).getTime() - new Date(b).getTime()) / 3_600_000;

export function scoreOffer(
  booking: OriginalBooking,
  offer: FlightOffer,
  preferences: SearchPreferences,
): EquivalentFlight {
  const departureDelta = hoursBetween(booking.departure, offer.departure);
  const arrivalDelta = hoursBetween(booking.arrival, offer.arrival);
  const schedule = clamp(100 - departureDelta * 7 - arrivalDelta * 3);
  const exchangeCost = clamp(100 - (offer.estimatedExchangeCost / Math.max(booking.paidAmount, 1)) * 240);
  const cabinDifference = cabinRank[offer.cabin] - cabinRank[preferences.preferredCabin];
  const cabin = cabinDifference >= 0 ? 100 : clamp(100 + cabinDifference * 38);
  const baggage = offer.checkedBags >= booking.checkedBags ? 100 : offer.checkedBags * 45;
  const routing = offer.connections <= booking.connections ? 100 : clamp(100 - (offer.connections - booking.connections) * 28);
  const confidenceScores: Record<FlightOffer["exchangeConfidence"], number> = { high: 100, medium: 78, low: 52 };
  const confidenceBase = confidenceScores[offer.exchangeConfidence];
  const rebookingLikelihood = booking.disruptionType === "cancelled" ? confidenceBase : confidenceBase - 12;

  const breakdown: MatchBreakdown = {
    schedule,
    exchangeCost,
    cabin,
    baggage,
    routing,
    rebookingLikelihood,
  };

  const equivalenceScore = Math.round(
    schedule * 0.3 +
      exchangeCost * 0.25 +
      cabin * 0.15 +
      baggage * 0.1 +
      routing * 0.1 +
      rebookingLikelihood * 0.1,
  );

  const reasons = [
    offer.connections === booking.connections
      ? offer.connections === 0 ? "Same nonstop routing" : "Same number of connections"
      : `${offer.connections} connection${offer.connections === 1 ? "" : "s"}`,
    departureDelta <= 2 ? "Departs within 2 hours of original" : `Departs ${Math.round(departureDelta)} hours from original`,
    offer.arrival <= booking.arrival ? "Arrives no later than original" : `Arrives ${Math.round(arrivalDelta)} hours later`,
    offer.cabin === booking.cabin ? `Same cabin (${offer.cabin})` : `${offer.cabin} cabin`,
    offer.checkedBags >= booking.checkedBags
      ? `Keeps ${booking.checkedBags} checked bags`
      : "Reduced checked baggage",
  ];

  const warnings = [
    "Airline confirmation required",
    ...(offer.exchangeConfidence !== "high" ? ["Exchange cost is an estimate"] : []),
    ...(offer.cabin !== booking.cabin ? ["Cabin differs from the original ticket"] : []),
  ];

  return { ...offer, equivalenceScore, breakdown, reasons, warnings };
}

export function findEquivalentFlights(
  booking: OriginalBooking,
  offers: FlightOffer[],
  preferences: SearchPreferences,
): EquivalentFlight[] {
  const maximumHours = preferences.flexibilityDays * 24;
  return offers
    .filter((offer) => hoursBetween(booking.departure, offer.departure) <= maximumHours)
    .filter((offer) => offer.connections <= preferences.maximumConnections)
    .map((offer) => scoreOffer(booking, offer, preferences))
    .sort((a, b) => b.equivalenceScore - a.equivalenceScore);
}

export function generateAgentRequest(booking: OriginalBooking, offer: EquivalentFlight): string {
  const departure = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  }).format(new Date(offer.departure));

  return `Hello, I was booked on ${booking.airline} flight ${booking.flightNumber} from ${booking.origin} to ${booking.destination}, which has been cancelled by the airline. Please check involuntary reaccommodation on ${offer.airline} ${offer.flightNumbers.join(" / ")} departing ${departure}. This option preserves my ${booking.cabin.toLowerCase()} cabin and ${booking.checkedBags} checked bags. My booking reference is ${booking.bookingReference}. Please confirm any fare or tax difference before making changes. Thank you.`;
}
