export type Cabin = "Economy" | "Premium economy" | "Business" | "First";
export type DisruptionType = "cancelled" | "delayed" | "schedule_change";

export interface OriginalBooking {
  id: string;
  origin: string;
  originCity: string;
  destination: string;
  destinationCity: string;
  departure: string;
  arrival: string;
  airline: string;
  flightNumber: string;
  cabin: Cabin;
  checkedBags: number;
  connections: number;
  paidAmount: number;
  passengerCount: number;
  disruptionType: DisruptionType;
  bookingReference: string;
}

export interface FlightOffer {
  id: string;
  airline: string;
  airlineCode: string;
  flightNumbers: string[];
  origin: string;
  destination: string;
  departure: string;
  arrival: string;
  durationMinutes: number;
  connections: number;
  connectionAirports: string[];
  cabin: Cabin;
  checkedBags: number;
  publicPrice: number;
  currency?: string;
  estimatedExchangeCost: number;
  exchangeEstimateAvailable?: boolean;
  exchangeConfidence: "high" | "medium" | "low";
  aircraft: string[];
  refundable: boolean;
  originTimeZone?: string;
  destinationTimeZone?: string;
  source?: "demo" | "duffel";
}

export interface MatchBreakdown {
  schedule: number;
  exchangeCost: number;
  cabin: number;
  baggage: number;
  routing: number;
  rebookingLikelihood: number;
}

export interface EquivalentFlight extends FlightOffer {
  equivalenceScore: number;
  breakdown: MatchBreakdown;
  reasons: string[];
  warnings: string[];
}

export interface SearchPreferences {
  flexibilityDays: 1 | 2 | 3;
  preferredCabin: Cabin;
  maximumConnections: number;
}

export interface FlightSearchQuery {
  origin: string;
  destination: string;
  departureDate: string;
  passengerCount: number;
}

export interface FlightSearchResponse {
  booking: OriginalBooking;
  matches: EquivalentFlight[];
  provider: "duffel";
}
