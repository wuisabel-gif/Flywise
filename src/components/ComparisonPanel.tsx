import { Check, Clipboard, ShieldAlert } from "lucide-react";
import { formatDuration, formatTime } from "../lib/format";
import { generateAgentRequest } from "../lib/matchingEngine";
import type { EquivalentFlight, OriginalBooking } from "../types";

interface Props { booking: OriginalBooking; flight: EquivalentFlight | undefined; copied: boolean; onCopy: (text: string) => void }

export function ComparisonPanel({ booking, flight, copied, onCopy }: Props) {
  if (!flight) return <aside className="comparison comparison--empty"><p>Select a replacement to see why it matches.</p></aside>;
  const request = generateAgentRequest(booking, flight);
  return (
    <aside className="comparison" aria-label="Selected flight comparison">
      <div className="comparison__heading"><div><small>Selected flight</small><strong>{flight.airline} <span>{flight.flightNumbers[0]}</span></strong></div><b>{flight.equivalenceScore}% match</b></div>
      <div className="comparison__route">
        <div><strong>{formatTime(flight.departure, flight.originTimeZone ?? "UTC")}</strong><span>{flight.origin}</span></div>
        <div><small>{formatDuration(flight.durationMinutes)}</small><i /><small>{flight.connections === 0 ? "Nonstop" : `${flight.connections} stop`}</small></div>
        <div><strong>{formatTime(flight.arrival, flight.destinationTimeZone ?? "UTC")}</strong><span>{flight.destination} <sup>+1</sup></span></div>
      </div>
      <div className="comparison__section"><h3>Why it matches</h3><ul>{flight.reasons.slice(0, 5).map((reason) => <li key={reason}><Check size={16} /> {reason}</li>)}</ul></div>
      <div className="comparison__section agent-request">
        <div><h3>Generated airline-agent request</h3><button onClick={() => onCopy(request)}><Clipboard size={15} /> {copied ? "Copied" : "Copy agent request"}</button></div>
        <p>{request}</p>
      </div>
      <div className="advisory" id="advisory"><ShieldAlert /><div><strong>Airline confirmation required</strong><p>Final rebooking is subject to airline approval. Exchange costs are estimates.</p></div></div>
    </aside>
  );
}
