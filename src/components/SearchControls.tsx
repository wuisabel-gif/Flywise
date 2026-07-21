import { Info, Search, ShieldCheck } from "lucide-react";
import { airportChoices } from "../data/airports";
import type { Cabin, FlightSearchQuery, SearchPreferences } from "../types";

interface Props {
  preferences: SearchPreferences;
  query: FlightSearchQuery;
  onChange: (next: SearchPreferences) => void;
  onQueryChange: (next: FlightSearchQuery) => void;
  onSearch: () => void;
  isSearching: boolean;
}

export function SearchControls({ preferences, query, onChange, onQueryChange, onSearch, isSearching }: Props) {
  return (
    <section className="search-controls" aria-label="Replacement flight preferences">
      <div className="route-search">
        <div className="control-group">
          <label htmlFor="origin">From</label>
          <input id="origin" list="airports" maxLength={3} value={query.origin} onChange={(event) => onQueryChange({ ...query, origin: event.target.value.toUpperCase() })} placeholder="LAX" />
        </div>
        <div className="control-group">
          <label htmlFor="destination">To</label>
          <input id="destination" list="airports" maxLength={3} value={query.destination} onChange={(event) => onQueryChange({ ...query, destination: event.target.value.toUpperCase() })} placeholder="JFK" />
        </div>
        <div className="control-group">
          <label htmlFor="departure-date">Original departure date</label>
          <input id="departure-date" type="date" value={query.departureDate} onChange={(event) => onQueryChange({ ...query, departureDate: event.target.value })} />
        </div>
        <div className="control-group">
          <label htmlFor="passengers">Passengers</label>
          <select id="passengers" value={query.passengerCount} onChange={(event) => onQueryChange({ ...query, passengerCount: Number(event.target.value) })}>
            {[1, 2, 3, 4, 5, 6].map((count) => <option key={count} value={count}>{count}</option>)}
          </select>
        </div>
        <datalist id="airports">{airportChoices.map((airport) => <option key={airport.code} value={airport.code}>{airport.city} — {airport.name}</option>)}</datalist>
      </div>
      <div className="control-group">
        <label htmlFor="reason">Disruption reason <Info size={15} /></label>
        <select id="reason" defaultValue="cancelled"><option value="cancelled">Cancelled by airline</option><option value="delayed">Significantly delayed</option><option value="schedule">Schedule changed</option></select>
      </div>
      <fieldset className="control-group control-group--flex">
        <legend>Departure flexibility <Info size={15} /></legend>
        <div className="segmented">
          {([1, 2, 3] as const).map((day) => (
            <button key={day} className={preferences.flexibilityDays === day ? "active" : ""} onClick={() => onChange({ ...preferences, flexibilityDays: day })}>
              ± {day} day{day > 1 ? "s" : ""}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="control-group">
        <label htmlFor="cabin">Cabin preference <Info size={15} /></label>
        <select id="cabin" value={preferences.preferredCabin} onChange={(event) => onChange({ ...preferences, preferredCabin: event.target.value as Cabin })}>
          <option>Economy</option><option>Premium economy</option><option>Business</option><option>First</option>
        </select>
      </div>
      <div className="search-action">
        <button className="button button--primary" onClick={onSearch} disabled={isSearching || query.origin.length !== 3 || query.destination.length !== 3 || !query.departureDate}>
          <Search size={18} /> {isSearching ? "Matching flights…" : "Find equivalent flights"}
        </button>
        <p><ShieldCheck size={16} /> Searches multiple airlines securely</p>
      </div>
    </section>
  );
}
