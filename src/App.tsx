import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { ComparisonPanel } from "./components/ComparisonPanel";
import { EmptyResults } from "./components/EmptyResults";
import { FlightRow } from "./components/FlightRow";
import { Header } from "./components/Header";
import { SearchControls } from "./components/SearchControls";
import { TripSummary } from "./components/TripSummary";
import { mockOffers, originalBooking } from "./data/mockFlights";
import { findEquivalentFlights } from "./lib/matchingEngine";
import type { EquivalentFlight, SearchPreferences } from "./types";

type SortMode = "best" | "lowest-cost" | "earliest";

export default function App() {
  const [preferences, setPreferences] = useState<SearchPreferences>({ flexibilityDays: 2, preferredCabin: "Business", maximumConnections: 1 });
  const [matches, setMatches] = useState<EquivalentFlight[]>(() => findEquivalentFlights(originalBooking, mockOffers, preferences));
  const [selectedId, setSelectedId] = useState(matches[0]?.id);
  const [isSearching, setIsSearching] = useState(false);
  const [tripExpanded, setTripExpanded] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("best");
  const [copied, setCopied] = useState(false);
  const [hasSearched, setHasSearched] = useState(true);

  const sortedMatches = useMemo(() => [...matches].sort((a, b) => {
    if (sortMode === "lowest-cost") return a.estimatedExchangeCost - b.estimatedExchangeCost;
    if (sortMode === "earliest") return new Date(a.departure).getTime() - new Date(b.departure).getTime();
    return b.equivalenceScore - a.equivalenceScore;
  }), [matches, sortMode]);

  const selectedFlight = matches.find((flight) => flight.id === selectedId);

  const runSearch = async () => {
    setIsSearching(true);
    setHasSearched(true);
    try {
      const hostResult = await window.openai?.callTool?.("search_equivalent_flights", { preferences });
      const next = hostResult?.structuredContent?.matches as EquivalentFlight[] | undefined;
      const results = next ?? findEquivalentFlights(originalBooking, mockOffers, preferences);
      setMatches(results);
      setSelectedId(results[0]?.id);
    } catch {
      const results = findEquivalentFlights(originalBooking, mockOffers, preferences);
      setMatches(results);
      setSelectedId(results[0]?.id);
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
        <TripSummary booking={originalBooking} expanded={tripExpanded} onToggle={() => setTripExpanded((value) => !value)} />
        <SearchControls preferences={preferences} onChange={setPreferences} onSearch={runSearch} isSearching={isSearching} />
        <div className="workspace" id="results">
          <section className="results" aria-labelledby="results-title">
            <div className="results__header">
              <div><h1 id="results-title">Best replacement</h1><p>Ranked by match quality · Based on routing, timing, and fare conditions</p></div>
              <label className="sort-control"><SlidersHorizontal size={17} /><span>Sort</span><select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}><option value="best">Best match</option><option value="lowest-cost">Lowest exchange cost</option><option value="earliest">Earliest departure</option></select></label>
            </div>
            {sortedMatches.length ? sortedMatches.map((flight, index) => <FlightRow key={flight.id} flight={flight} rank={index + 1} selected={flight.id === selectedId} onSelect={() => setSelectedId(flight.id)} />) : <EmptyResults hasSearched={hasSearched} />}
          </section>
          <ComparisonPanel booking={originalBooking} flight={selectedFlight} copied={copied} onCopy={copyRequest} />
        </div>
        <footer><span className="footer-mark">✓</span> We’ll help you every step of the way. If the airline can’t rebook you for free, we’ll help you compare other options.</footer>
      </main>
    </>
  );
}
