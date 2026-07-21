import { ChevronDown, Plane, XCircle } from "lucide-react";
import { formatDate, formatTime } from "../lib/format";
import { findAirport } from "../data/airports";
import type { OriginalBooking } from "../types";

interface Props { booking: OriginalBooking; expanded: boolean; onToggle: () => void }

export function TripSummary({ booking, expanded, onToggle }: Props) {
  const originTimeZone = findAirport(booking.origin)?.timeZone ?? "UTC";
  const destinationTimeZone = findAirport(booking.destination)?.timeZone ?? "UTC";
  return (
    <section className="trip-summary" aria-labelledby="original-trip-title">
      <h2 id="original-trip-title">Original trip</h2>
      <div className="trip-summary__airport">
        <strong>{booking.origin}</strong>
        <span>{booking.originCity}</span>
        <small>{formatDate(booking.departure, originTimeZone)} · {formatTime(booking.departure, originTimeZone)}</small>
      </div>
      <div className="trip-summary__route" aria-label="Flight route"><span /><Plane size={17} /><span /></div>
      <div className="trip-summary__airport">
        <strong>{booking.destination}</strong>
        <span>{booking.destinationCity}</span>
        <small>{formatDate(booking.arrival, destinationTimeZone)} · {formatTime(booking.arrival, destinationTimeZone)}</small>
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
