export interface AirportChoice {
  code: string;
  city: string;
  name: string;
  timeZone: string;
}

export const airportChoices: AirportChoice[] = [
  { code: "ATL", city: "Atlanta", name: "Hartsfield–Jackson", timeZone: "America/New_York" },
  { code: "BOS", city: "Boston", name: "Logan", timeZone: "America/New_York" },
  { code: "CHI", city: "Chicago", name: "All airports", timeZone: "America/Chicago" },
  { code: "CPH", city: "Copenhagen", name: "Copenhagen Airport", timeZone: "Europe/Copenhagen" },
  { code: "DFW", city: "Dallas", name: "Dallas/Fort Worth", timeZone: "America/Chicago" },
  { code: "JFK", city: "New York", name: "John F. Kennedy", timeZone: "America/New_York" },
  { code: "LAS", city: "Las Vegas", name: "Harry Reid", timeZone: "America/Los_Angeles" },
  { code: "LAX", city: "Los Angeles", name: "Los Angeles International", timeZone: "America/Los_Angeles" },
  { code: "LHR", city: "London", name: "Heathrow", timeZone: "Europe/London" },
  { code: "LON", city: "London", name: "All airports", timeZone: "Europe/London" },
  { code: "MIA", city: "Miami", name: "Miami International", timeZone: "America/New_York" },
  { code: "NYC", city: "New York", name: "All airports", timeZone: "America/New_York" },
  { code: "ORD", city: "Chicago", name: "O'Hare", timeZone: "America/Chicago" },
  { code: "PAR", city: "Paris", name: "All airports", timeZone: "Europe/Paris" },
  { code: "SEA", city: "Seattle", name: "Seattle–Tacoma", timeZone: "America/Los_Angeles" },
  { code: "SFO", city: "San Francisco", name: "San Francisco International", timeZone: "America/Los_Angeles" },
  { code: "WAS", city: "Washington, D.C.", name: "All airports", timeZone: "America/New_York" },
];

export function findAirport(code: string) {
  return airportChoices.find((airport) => airport.code === code.toUpperCase());
}
