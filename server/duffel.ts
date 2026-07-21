import type { Cabin, FlightOffer, FlightSearchQuery } from "../src/types.js";

interface DuffelPlace { iata_code?: string; time_zone?: string }
interface DuffelCarrier { iata_code?: string; name?: string }
interface DuffelSegmentPassenger { cabin_class?: string; baggages?: Array<{ type?: string; quantity?: number }> }
interface DuffelSegment {
  departing_at: string;
  arriving_at: string;
  duration?: string;
  origin: DuffelPlace;
  destination: DuffelPlace;
  operating_carrier?: DuffelCarrier;
  marketing_carrier?: DuffelCarrier;
  operating_carrier_flight_number?: string;
  marketing_carrier_flight_number?: string;
  aircraft?: { name?: string };
  passengers?: DuffelSegmentPassenger[];
}
interface DuffelOffer {
  id: string;
  total_amount: string;
  total_currency: string;
  owner?: DuffelCarrier;
  slices: Array<{ duration?: string; segments: DuffelSegment[] }>;
  conditions?: { change_before_departure?: { allowed?: boolean } };
}

const cabinNames: Record<string, Cabin> = {
  economy: "Economy",
  premium_economy: "Premium economy",
  business: "Business",
  first: "First",
};

function parseDuration(value?: string) {
  if (!value) return 0;
  const match = value.match(/^PT(?:(\d+)H)?(?:(\d+)M)?$/);
  return match ? Number(match[1] ?? 0) * 60 + Number(match[2] ?? 0) : 0;
}

function normalizeOffer(offer: DuffelOffer): FlightOffer | undefined {
  const slice = offer.slices[0];
  const segments = slice?.segments ?? [];
  const first = segments[0];
  const last = segments.at(-1);
  if (!first || !last) return undefined;
  const carrier = first.operating_carrier ?? first.marketing_carrier ?? offer.owner;
  const passenger = first.passengers?.[0];
  const checkedBags = passenger?.baggages?.find((bag) => bag.type === "checked")?.quantity ?? 0;

  return {
    id: offer.id,
    airline: carrier?.name ?? offer.owner?.name ?? "Airline",
    airlineCode: carrier?.iata_code ?? offer.owner?.iata_code ?? "--",
    flightNumbers: segments.map((segment) => {
      const code = segment.marketing_carrier?.iata_code ?? segment.operating_carrier?.iata_code ?? "";
      return `${code} ${segment.marketing_carrier_flight_number ?? segment.operating_carrier_flight_number ?? ""}`.trim();
    }),
    origin: first.origin.iata_code ?? "",
    destination: last.destination.iata_code ?? "",
    departure: first.departing_at,
    arrival: last.arriving_at,
    durationMinutes: parseDuration(slice.duration) || segments.reduce((total, segment) => total + parseDuration(segment.duration), 0),
    connections: Math.max(0, segments.length - 1),
    connectionAirports: segments.slice(0, -1).map((segment) => segment.destination.iata_code ?? "").filter(Boolean),
    cabin: cabinNames[passenger?.cabin_class ?? ""] ?? "Economy",
    checkedBags,
    publicPrice: Number.parseFloat(offer.total_amount),
    currency: offer.total_currency,
    estimatedExchangeCost: 0,
    exchangeEstimateAvailable: false,
    exchangeConfidence: "low",
    aircraft: segments.map((segment) => segment.aircraft?.name ?? "Aircraft not listed"),
    refundable: offer.conditions?.change_before_departure?.allowed ?? false,
    originTimeZone: first.origin.time_zone,
    destinationTimeZone: last.destination.time_zone,
    source: "duffel",
  };
}

export async function searchDuffelOffers(query: FlightSearchQuery, cabin: Cabin, maximumConnections: number): Promise<FlightOffer[]> {
  const token = process.env.DUFFEL_ACCESS_TOKEN;
  if (!token) throw new Error("DUFFEL_ACCESS_TOKEN is not configured on the Flywise server.");

  const response = await fetch("https://api.duffel.com/air/offer_requests?return_offers=true&supplier_timeout=20000", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "Duffel-Version": "v2",
    },
    body: JSON.stringify({
      data: {
        slices: [{ origin: query.origin, destination: query.destination, departure_date: query.departureDate }],
        passengers: Array.from({ length: query.passengerCount }, () => ({ type: "adult" })),
        cabin_class: cabin.toLowerCase().replace(" ", "_"),
        max_connections: maximumConnections,
      },
    }),
  });

  const body = await response.json() as { data?: { offers?: DuffelOffer[] }; errors?: Array<{ message?: string }> };
  if (!response.ok) throw new Error(body.errors?.[0]?.message ?? `Duffel search failed (${response.status}).`);
  return (body.data?.offers ?? []).map(normalizeOffer).filter((offer): offer is FlightOffer => offer !== undefined).slice(0, 30);
}
