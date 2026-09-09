import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { BookingStatusBadge } from "../components/BookingStatusBadge";
import { useAuth } from "../context/AuthContext";
import { getMyBookings } from "../api/bookings";
import type { Booking } from "../api/types";
import "./CategoryListingsPage.css";
import "./BookingsPage.css";

function formatDate(dateStr?: string): string | null {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function MyBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;

    getMyBookings()
      .then((data) => {
        if (!cancelled) setBookings(data);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Couldn't load your bookings right now.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <div className="bookings-page">
      <Navbar />

      <section className="category-hero">
        <div className="category-hero__overlay" />
        <div className="category-hero__content">
          <h1>My Bookings</h1>
          <p>Track the status of every request you've made.</p>
        </div>
      </section>

      <div className="bookings-list-page">
        {!user && (
          <p className="category-status">
            Log in to see your bookings.{" "}
            <Link to="/login" state={{ redirectTo: "/bookings" }} className="category-status__reset">
              Log in
            </Link>
          </p>
        )}

        {user && isLoading && <p className="category-status">Loading your bookings…</p>}

        {user && !isLoading && loadError && (
          <p className="category-status category-status--error">{loadError}</p>
        )}

        {user && !isLoading && !loadError && bookings.length === 0 && (
          <p className="category-status">
            You haven't made any booking requests yet.{" "}
            <Link to="/explore" className="category-status__reset">
              Browse listings
            </Link>
          </p>
        )}

        {user && !isLoading && !loadError && bookings.length > 0 && (
          <div className="bookings-table">
            {bookings.map((b) => (
              <div className="booking-row" key={b.id}>
                <div className="booking-row__main">
                  <Link to={`/listings/${b.listingId}`} className="booking-row__title">
                    {b.listing?.title ?? "Listing"}
                  </Link>
                  <p className="booking-row__location">{b.listing?.address || "Location not specified"}</p>
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
