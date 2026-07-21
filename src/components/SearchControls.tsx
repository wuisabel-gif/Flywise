import { Info, Search, ShieldCheck } from "lucide-react";
import type { Cabin, SearchPreferences } from "../types";

interface Props {
  preferences: SearchPreferences;
  onChange: (next: SearchPreferences) => void;
  onSearch: () => void;
  isSearching: boolean;
}

export function SearchControls({ preferences, onChange, onSearch, isSearching }: Props) {
  return (
    <section className="search-controls" aria-label="Replacement flight preferences">
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
        <button className="button button--primary" onClick={onSearch} disabled={isSearching}>
          <Search size={18} /> {isSearching ? "Matching flights…" : "Find equivalent flights"}
        </button>
        <p><ShieldCheck size={16} /> We’ll protect your original fare</p>
      </div>
    </section>
  );
}
