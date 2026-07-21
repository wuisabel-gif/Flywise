import { ChevronDown, Plane, XCircle } from "lucide-react";
import { formatDate, formatTime } from "../lib/format";
import type { OriginalBooking } from "../types";

interface Props { booking: OriginalBooking; expanded: boolean; onToggle: () => void }

export function TripSummary({ booking, expanded, onToggle }: Props) {
  return (
    <section className="trip-summary" aria-labelledby="original-trip-title">
      <h2 id="original-trip-title">Original trip</h2>
      <div className="trip-summary__airport">
        <strong>{booking.origin}</strong>
        <span>{booking.originCity}</span>
        <small>{formatDate(booking.departure, "America/Los_Angeles")} · {formatTime(booking.departure, "America/Los_Angeles")}</small>
      </div>
      <div className="trip-summary__route" aria-label="Flight route"><span /><Plane size={17} /><span /></div>
      <div className="trip-summary__airport">
        <strong>{booking.destination}</strong>
        <span>{booking.destinationCity}</span>
        <small>{formatDate(booking.arrival, "Europe/Copenhagen")} · {formatTime(booking.arrival, "Europe/Copenhagen")}</small>
      </div>
      <div className="trip-summary__status">
        <span><XCircle size={17} /> Cancelled by airline</span>
        <small>{booking.airline} · {booking.flightNumber}<br />{booking.cabin} · {booking.passengerCount} passenger</small>
      </div>
      <button className="button button--quiet trip-summary__toggle" onClick={onToggle} aria-expanded={expanded}>
        View trip details <ChevronDown size={16} className={expanded ? "rotate" : ""} />
      </button>
      {expanded && (
        <dl className="trip-details">
          <div><dt>Booking reference</dt><dd>{booking.bookingReference}</dd></div>
          <div><dt>Original fare</dt><dd>${booking.paidAmount.toLocaleString()}</dd></div>
          <div><dt>Checked bags</dt><dd>{booking.checkedBags}</dd></div>
        </dl>
      )}
    </section>
  );
}
