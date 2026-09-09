import { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createBooking } from "../api/bookings";
import { ApiError } from "../api/apiError";
import type { Listing } from "../api/types";
import "./BookingPanel.css";

interface BookingPanelProps {
  listing: Listing;
}

const NON_BOOKING_ROLES = ["landlord", "agent", "hotel_manager"];

function nightsBetween(checkIn: string, checkOut: string): number {
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);
  const diff = (outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.round(diff));
}

export function BookingPanel({ listing }: BookingPanelProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const cannotBook = user ? NON_BOOKING_ROLES.includes(user.role) : false;

  const hasRoomTypes = listing.type === "hotel" && (listing.roomTypes?.length ?? 0) > 0;
  const usesDates = listing.type === "hotel" || listing.type === "hostel" || listing.type === "rental";

  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState(listing.roomTypes?.[0]?.id ?? "");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedRoomType = listing.roomTypes?.find((rt) => rt.id === selectedRoomTypeId);
  const unitPrice = selectedRoomType ? parseFloat(selectedRoomType.pricePerNight) : parseFloat(listing.price);

  const nights = useMemo(() => {
    if (!usesDates || !checkIn || !checkOut) return listing.type === "hotel" ? 0 : 1;
    return nightsBetween(checkIn, checkOut) || 0;
  }, [checkIn, checkOut, usesDates, listing.type]);

  const total = listing.type === "hotel" ? unitPrice * Math.max(nights, 0) : unitPrice;
  const canSubmit = listing.type !== "hotel" || (checkIn && checkOut && nights > 0);

  async function handleBook() {
    setError(null);
    setSuccessMessage(null);

    if (cannotBook) {
      setError("Landlord, agent, and hotel manager accounts can't book listings.");
      return;
    }

    if (!user) {
      navigate("/login", { state: { redirectTo: location.pathname } });
      return;
    }

    if (usesDates && listing.type === "hotel" && (!checkIn || !checkOut)) {
      setError("Select both check-in and check-out dates.");
      return;
    }

    setIsSubmitting(true);
    try {
      const booking = await createBooking({
        listingId: listing.id,
        roomTypeId: hasRoomTypes ? selectedRoomTypeId : undefined,
        checkIn: usesDates && checkIn ? checkIn : undefined,
        checkOut: usesDates && checkOut ? checkOut : undefined,
        totalAmount: total,
        currency: listing.currency,
      });
      setSuccessMessage(
        `Booking request sent — status: ${booking.status}. The listing owner will confirm shortly.`
      );
    } catch (err) {
      // A 409 here is the backend's double-booking conflict check —
      // its message is already specific and user-facing, so just show it.
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="booking-panel">
      <p className="booking-panel__price">
        {listing.currency} {unitPrice.toLocaleString()}
        {listing.type === "hotel" && <span> / night</span>}
        {listing.type === "rental" && <span> / month</span>}
      </p>
      {listing.priceNegotiable && <p className="booking-panel__negotiable">Price is negotiable</p>}

      {cannotBook ? (
        <p className="booking-panel__hint booking-panel__hint--notice">
          Landlord, agent, and hotel manager accounts can't book listings — bookings are made by
          seekers. Log in with a seeker account to book.
        </p>
      ) : (
        <>
          {hasRoomTypes && (
        <div className="booking-panel__field">
          <label>Room type</label>
          <select value={selectedRoomTypeId} onChange={(e) => setSelectedRoomTypeId(e.target.value)}>
            {listing.roomTypes!.map((rt) => (
              <option key={rt.id} value={rt.id}>
                {rt.name} — {listing.currency} {parseFloat(rt.pricePerNight).toLocaleString()}/night
              </option>
            ))}
          </select>
        </div>
      )}

      {usesDates && (
        <div className="booking-panel__dates">
          <div className="booking-panel__field">
            <label>Check in</label>
            <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
          </div>
          <div className="booking-panel__field">
            <label>Check out</label>
            <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
          </div>
        </div>
      )}

      {listing.type === "hotel" && nights > 0 && (
        <p className="booking-panel__breakdown">
          {listing.currency} {unitPrice.toLocaleString()} × {nights} night{nights > 1 ? "s" : ""}
        </p>
      )}

      <div className="booking-panel__total">
        <span>Total</span>
        <span>
          {listing.currency} {total.toLocaleString()}
        </span>
      </div>

      {error && <div className="booking-panel__error">{error}</div>}
      {successMessage && <div className="booking-panel__success">{successMessage}</div>}

      <button
        className="booking-panel__submit"
        type="button"
        onClick={handleBook}
        disabled={isSubmitting || !canSubmit || !!successMessage}
      >
        {isSubmitting
          ? "Sending request…"
          : listing.type === "sale"
          ? "Request Viewing"
          : "Book Now"}
      </button>

      {!user && <p className="booking-panel__hint">You'll be asked to log in before confirming.</p>}
        </>
      )}
    </div>
  );
}
