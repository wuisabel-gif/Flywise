import { ChevronDown, Plane, XCircle } from "lucide-react";
import { formatDate, formatTime } from "../lib/format";
import { airportChoices, findAirport } from "../data/airports";
import type { FlightSearchQuery, OriginalBooking } from "../types";

interface Props {
  booking: OriginalBooking;
  query: FlightSearchQuery;
  expanded: boolean;
  onToggle: () => void;
  onQueryChange: (next: FlightSearchQuery) => void;
}

export function TripSummary({ booking, query, expanded, onToggle, onQueryChange }: Props) {
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
        <small>{booking.airline} · {booking.flightNumber}<br />{booking.cabin} · {booking.passengerCount} passenger{booking.passengerCount === 1 ? "" : "s"}</small>
      </div>
      <button className="button button--quiet trip-summary__toggle" onClick={onToggle} aria-expanded={expanded}>
        {expanded ? "Hide original trip form" : "Edit original trip"} <ChevronDown size={16} className={expanded ? "rotate" : ""} />
      </button>
      {expanded && (
        <div className="original-trip-form" aria-label="Original flight details">
          <label>From<input aria-label="Original departure airport" list="trip-airports" maxLength={3} value={query.origin} onChange={(event) => onQueryChange({ ...query, origin: event.target.value.toUpperCase() })} /></label>
          <label>Destination<input aria-label="Original destination airport" list="trip-airports" maxLength={3} value={query.destination} onChange={(event) => onQueryChange({ ...query, destination: event.target.value.toUpperCase() })} /></label>
          <label>Departure date<input aria-label="Original departure date" type="date" value={query.departureDate} onChange={(event) => onQueryChange({ ...query, departureDate: event.target.value })} /></label>
          <label>Departure time<input aria-label="Original departure time" type="time" value={query.departureTime} onChange={(event) => onQueryChange({ ...query, departureTime: event.target.value })} /></label>
          <label>Airline<input aria-label="Original airline" value={query.airline} onChange={(event) => onQueryChange({ ...query, airline: event.target.value })} placeholder="American Airlines" /></label>
          <label>Flight number<input aria-label="Original flight number" value={query.flightNumber} onChange={(event) => onQueryChange({ ...query, flightNumber: event.target.value.toUpperCase() })} placeholder="AA 123" /></label>
          <label>Booking reference<input aria-label="Booking reference" value={query.bookingReference} onChange={(event) => onQueryChange({ ...query, bookingReference: event.target.value.toUpperCase() })} placeholder="ABC123" /></label>
          <label>Original fare (USD)<input aria-label="Original fare" type="number" min={0} value={query.originalFare} onChange={(event) => onQueryChange({ ...query, originalFare: Number(event.target.value) })} /></label>
          <label>Checked bags<select aria-label="Checked bags" value={query.checkedBags} onChange={(event) => onQueryChange({ ...query, checkedBags: Number(event.target.value) })}>{[0, 1, 2, 3, 4].map((count) => <option key={count}>{count}</option>)}</select></label>
          <label>Passengers<select aria-label="Passengers" value={query.passengerCount} onChange={(event) => onQueryChange({ ...query, passengerCount: Number(event.target.value) })}>{[1, 2, 3, 4, 5, 6].map((count) => <option key={count}>{count}</option>)}</select></label>
          <datalist id="trip-airports">{airportChoices.map((airport) => <option key={airport.code} value={airport.code}>{airport.city} — {airport.name}</option>)}</datalist>
        </div>
      )}
    </section>
  );
}
