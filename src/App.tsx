import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { ComparisonPanel } from "./components/ComparisonPanel";
import { EmptyResults } from "./components/EmptyResults";
import { FlightRow } from "./components/FlightRow";
import { Header } from "./components/Header";
import { SearchControls } from "./components/SearchControls";
import { TripSummary } from "./components/TripSummary";
import { createBookingFromQuery, searchLiveFlights } from "./lib/flightSearch";
import type { EquivalentFlight, FlightSearchQuery, OriginalBooking, SearchPreferences } from "./types";

type SortMode = "best" | "lowest-cost" | "earliest";

function createInitialQuery(): FlightSearchQuery {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return {
    origin: "LAX",
    destination: "CPH",
    departureDate: date.toISOString().slice(0, 10),
    departureTime: "12:00",
    passengerCount: 1,
    airline: "SAS",
    flightNumber: "SK 931",
    bookingReference: "ABC123",
    originalFare: 2269,
    checkedBags: 2,
  };
}

export default function App() {
  const [preferences, setPreferences] = useState<SearchPreferences>({ flexibilityDays: 2, preferredCabin: "Business", maximumConnections: 1 });
  const [query, setQuery] = useState<FlightSearchQuery>(createInitialQuery);
  const [booking, setBooking] = useState<OriginalBooking>(() => createBookingFromQuery(query, preferences));
  const [matches, setMatches] = useState<EquivalentFlight[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>(matches[0]?.id);
  const [isSearching, setIsSearching] = useState(false);
  const [tripExpanded, setTripExpanded] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>("best");
  const [copied, setCopied] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string>();
  const [resultSource, setResultSource] = useState<"demo" | "duffel" | undefined>();

  const sortedMatches = useMemo(() => [...matches].sort((a, b) => {
    if (sortMode === "lowest-cost") return a.estimatedExchangeCost - b.estimatedExchangeCost;
    if (sortMode === "earliest") return new Date(a.departure).getTime() - new Date(b.departure).getTime();
    return b.equivalenceScore - a.equivalenceScore;
  }), [matches, sortMode]);

  const selectedFlight = matches.find((flight) => flight.id === selectedId);

  const updateQuery = (next: FlightSearchQuery) => {
    setQuery(next);
    setBooking(createBookingFromQuery(next, preferences));
  };

  const updatePreferences = (next: SearchPreferences) => {
    setPreferences(next);
    setBooking(createBookingFromQuery(query, next));
  };

  const runSearch = async () => {
    setIsSearching(true);
    setHasSearched(true);
    setSearchError(undefined);
    setBooking(createBookingFromQuery(query, preferences));
    setResultSource(undefined);
    try {
      const hostResult = await window.openai?.callTool?.("search_equivalent_flights", { query, preferences });
      const next = hostResult?.structuredContent?.matches as EquivalentFlight[] | undefined;
      const hostBooking = hostResult?.structuredContent?.originalBooking as OriginalBooking | undefined;
      if (next) {
        setMatches(next);
        if (hostBooking) setBooking(hostBooking);
        setSelectedId(next[0]?.id);
        setResultSource("duffel");
      } else {
        const result = await searchLiveFlights(query, preferences);
        setBooking(result.booking);
        setMatches(result.matches);
        setSelectedId(result.matches[0]?.id);
        setResultSource(result.provider);
      }
    } catch (error) {
      setMatches([]);
      setSelectedId(undefined);
      setSearchError(error instanceof Error ? error.message : "The airline search could not be completed.");
    } finally {
      window.setTimeout(() => setIsSearching(false), 350);
    }
  };

  const copyRequest = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <>
      <Header />
      <main className="app-shell">
        <TripSummary booking={booking} query={query} expanded={tripExpanded} onQueryChange={updateQuery} onToggle={() => setTripExpanded((value) => !value)} />
        <SearchControls preferences={preferences} onChange={updatePreferences} onSearch={runSearch} isSearching={isSearching} canSearch={query.origin.length === 3 && query.destination.length === 3 && Boolean(query.departureDate && query.departureTime && query.airline && query.flightNumber)} />
        {searchError && <div className="search-notice" role="alert"><strong>Live search unavailable</strong><span>{searchError}</span></div>}
        <div className="workspace" id="results">
          <section className="results" aria-labelledby="results-title">
            <div className="results__header">
              <div><h1 id="results-title">Best replacement {resultSource && <span className={`source-badge source-badge--${resultSource}`}>{resultSource === "duffel" ? "Live offers" : "Demo"}</span>}</h1><p>Ranked by match quality · Based on routing, timing, and fare conditions</p></div>
              <label className="sort-control"><SlidersHorizontal size={17} /><span>Sort</span><select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}><option value="best">Best match</option><option value="lowest-cost">Lowest exchange cost</option><option value="earliest">Earliest departure</option></select></label>
            </div>
            {sortedMatches.length ? sortedMatches.map((flight, index) => <FlightRow key={flight.id} flight={flight} rank={index + 1} selected={flight.id === selectedId} onSelect={() => setSelectedId(flight.id)} />) : <EmptyResults hasSearched={hasSearched} />}
          </section>
          <ComparisonPanel booking={booking} flight={selectedFlight} copied={copied} onCopy={copyRequest} />
        </div>
        <footer><span className="footer-mark">✓</span> We’ll help you every step of the way. If the airline can’t rebook you for free, we’ll help you compare other options.</footer>
      </main>
    </>
  );
}
