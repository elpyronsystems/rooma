import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { BookingStatusBadge } from "../components/BookingStatusBadge";
import { useAuth } from "../context/AuthContext";
import { getOwnerBookings, confirmBooking, rejectBooking } from "../api/bookings";
import { ApiError } from "../api/apiError";
import type { Booking } from "../api/types";
import "./CategoryListingsPage.css";
import "./BookingsPage.css";

function formatDate(dateStr?: string): string | null {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

const OWNER_ROLES = ["landlord", "agent", "hotel_manager", "admin"];

export function OwnerBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const isOwnerRole = user ? OWNER_ROLES.includes(user.role) : false;

  useEffect(() => {
    if (!user || !isOwnerRole) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;

    getOwnerBookings()
      .then((data) => {
        if (!cancelled) setBookings(data);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Couldn't load booking requests right now.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, isOwnerRole]);

  async function handleConfirm(id: string) {
    setActionError(null);
    setActioningId(id);
    try {
      const updated = await confirmBooking(id);
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: updated.status } : b)));
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Couldn't confirm this booking.");
    } finally {
      setActioningId(null);
    }
  }

  async function handleReject(id: string) {
    setActionError(null);
    setActioningId(id);
    try {
      const updated = await rejectBooking(id);
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: updated.status } : b)));
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Couldn't reject this booking.");
    } finally {
      setActioningId(null);
    }
  }

  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  return (
    <div className="bookings-page">
      <Navbar />

      <section className="category-hero">
        <div className="category-hero__overlay" />
        <div className="category-hero__content">
          <h1>Booking Requests</h1>
          <p>Confirm or reject requests made against your listings.</p>
        </div>
      </section>

      <div className="bookings-list-page">
        {!user && (
          <p className="category-status">
            Log in to manage your listings' bookings.{" "}
            <Link to="/login" state={{ redirectTo: "/owner/bookings" }} className="category-status__reset">
              Log in
            </Link>
          </p>
        )}

        {user && !isOwnerRole && (
          <p className="category-status">
            This dashboard is for landlords, agents, and hotel managers. Your account role is{" "}
            <strong>{user.role}</strong>.
          </p>
        )}

        {user && isOwnerRole && isLoading && <p className="category-status">Loading booking requests…</p>}

        {user && isOwnerRole && !isLoading && loadError && (
          <p className="category-status category-status--error">{loadError}</p>
        )}

        {user && isOwnerRole && !isLoading && !loadError && bookings.length === 0 && (
          <p className="category-status">No booking requests yet for your listings.</p>
        )}

        {user && isOwnerRole && !isLoading && !loadError && bookings.length > 0 && (
          <>
            <p className="bookings-summary">
              {pendingCount} pending request{pendingCount !== 1 ? "s" : ""} out of {bookings.length} total
            </p>
            {actionError && <p className="category-status category-status--error">{actionError}</p>}

            <div className="bookings-table">
              {bookings.map((b) => (
                <div className="booking-row" key={b.id}>
                  <div className="booking-row__main">
                    <Link to={`/listings/${b.listingId}`} className="booking-row__title">
                      {b.listing?.title ?? "Listing"}
                    </Link>
                    <p className="booking-row__location">
                      Requested by {b.user?.fullName ?? "a user"} · {b.user?.phoneNumber ?? ""}
                    </p>
                    {b.roomType && <p className="booking-row__roomtype">{b.roomType.name}</p>}
                    {(b.checkIn || b.checkOut) && (
                      <p className="booking-row__dates">
                        {formatDate(b.checkIn) ?? "—"} → {formatDate(b.checkOut) ?? "—"}
                      </p>
                    )}
                  </div>
                  <div className="booking-row__side">
                    <BookingStatusBadge status={b.status} />
                    <p className="booking-row__amount">
                      {b.currency} {parseFloat(b.totalAmount).toLocaleString()}
                    </p>
                    {b.status === "pending" && (
                      <div className="booking-row__actions">
                        <button
                          className="booking-row__confirm"
                          type="button"
                          disabled={actioningId === b.id}
                          onClick={() => handleConfirm(b.id)}
                        >
                          Confirm
                        </button>
                        <button
                          className="booking-row__reject"
                          type="button"
                          disabled={actioningId === b.id}
                          onClick={() => handleReject(b.id)}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
