import { ArrowRight, BriefcaseBusiness, Clock3, Route, Shuffle, Armchair } from "lucide-react";
import { formatDuration, formatMoney, formatTime } from "../lib/format";
import type { EquivalentFlight } from "../types";

interface Props { flight: EquivalentFlight; rank: number; selected: boolean; onSelect: () => void }

export function FlightRow({ flight, rank, selected, onSelect }: Props) {
  return (
    <article className={`flight-row ${selected ? "flight-row--selected" : ""}`} aria-label={`${flight.airline} replacement option`}>
      <div className="flight-row__main">
        <span className="rank">{rank}</span>
        <div className="flight-row__itinerary">
          <div><strong>{formatTime(flight.departure, flight.originTimeZone ?? "UTC")}</strong><span>{flight.origin}</span></div>
          <div className="route-line"><small>{formatDuration(flight.durationMinutes)}</small><span><i /><ArrowRight size={16} /></span><small>{flight.connections === 0 ? "Nonstop" : `${flight.connections} stop`}</small></div>
          <div><strong>{formatTime(flight.arrival, flight.destinationTimeZone ?? "UTC")}</strong><span>{flight.destination} <sup>+1</sup></span></div>
          <div className="carrier"><b>{flight.airlineCode}</b><span>{flight.airline}<small>{flight.flightNumbers.join(" · ")} · {flight.aircraft.join(" · ")}</small></span></div>
        </div>
        <div className="score"><strong>{flight.equivalenceScore}% match</strong></div>
        <div className="price"><small>Estimated exchange cost</small><strong className="price--saving">{flight.exchangeEstimateAvailable === false ? "Confirm" : formatMoney(flight.estimatedExchangeCost, flight.currency)}</strong><span>{flight.exchangeEstimateAvailable === false ? "Ask the ticketing airline" : "Taxes & fees may apply"}</span></div>
        <div className="price"><small>Public price</small><strong>{formatMoney(flight.publicPrice, flight.currency)}</strong><span>per passenger</span></div>
        <button className={`button ${selected ? "button--primary" : "button--outline"}`} onClick={onSelect}>{selected ? "Selected" : "Select this flight"}</button>
      </div>
      <div className="flight-row__facts">
        <span><Armchair /><small>Cabin<strong>{flight.cabin}</strong></small></span>
        <span><BriefcaseBusiness /><small>Baggage<strong>{flight.checkedBags} checked bags</strong></small></span>
        <span><Route /><small>Routing<strong>{flight.connections === 0 ? "Nonstop" : `via ${flight.connectionAirports.join(", ")}`}</strong></small></span>
        <span><Shuffle /><small>Changes<strong>{flight.refundable ? "Flexible" : "Restrictions apply"}</strong></small></span>
        <span><Clock3 /><small>Duration<strong>{formatDuration(flight.durationMinutes)}</strong></small></span>
      </div>
    </article>
  );
}
