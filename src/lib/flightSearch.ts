import { findAirport } from "../data/airports";
import type { FlightSearchQuery, FlightSearchResponse, OriginalBooking, SearchPreferences } from "../types";

const apiBaseUrl = ((import.meta as ImportMeta & { env?: { VITE_FLYWISE_API_URL?: string } }).env?.VITE_FLYWISE_API_URL)?.replace(/\/$/, "") ?? "";

export function createBookingFromQuery(query: FlightSearchQuery, preferences: SearchPreferences): OriginalBooking {
  const origin = findAirport(query.origin);
  const destination = findAirport(query.destination);
  const departure = `${query.departureDate}T12:00:00`;
  const arrival = new Date(`${query.departureDate}T12:00:00Z`);
  arrival.setUTCDate(arrival.getUTCDate() + 1);

  return {
    id: `search-${query.origin}-${query.destination}-${query.departureDate}`,
    origin: query.origin.toUpperCase(),
    originCity: origin?.city ?? query.origin.toUpperCase(),
    destination: query.destination.toUpperCase(),
    destinationCity: destination?.city ?? query.destination.toUpperCase(),
    departure,
    arrival: arrival.toISOString().replace(".000Z", ""),
    airline: "Original airline",
    flightNumber: "Your flight",
    cabin: preferences.preferredCabin,
    checkedBags: preferences.preferredCabin === "Business" || preferences.preferredCabin === "First" ? 2 : 1,
    connections: 0,
    paidAmount: 1,
    passengerCount: query.passengerCount,
    disruptionType: "cancelled",
    bookingReference: "Add reference",
  };
}

export async function searchLiveFlights(query: FlightSearchQuery, preferences: SearchPreferences): Promise<FlightSearchResponse> {
  if (!apiBaseUrl) {
    throw new Error("Live airline search is not configured on this website yet. Add VITE_FLYWISE_API_URL after deploying the Flywise server.");
  }

  const response = await fetch(`${apiBaseUrl}/api/flights/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, preferences }),
  });
  const body = await response.json() as FlightSearchResponse & { error?: string };
  if (!response.ok) throw new Error(body.error ?? "The airline search could not be completed.");
  return body;
}
