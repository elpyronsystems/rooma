import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { getOwnerBookings } from "../api/bookings";
import { getBookingPayment, type Payment } from "../api/payments";
import type { Booking } from "../api/types";
import "./CategoryListingsPage.css";
import "./BookingsPage.css";

function formatDate(dateStr?: string): string | null {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

const OWNER_ROLES = ["landlord", "agent", "hotel_manager", "admin"];

export function OwnerPaymentsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Record<string, Payment | null>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const isOwnerRole = user ? OWNER_ROLES.includes(user.role) : false;

  useEffect(() => {
    if (!user || !isOwnerRole) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;

    getOwnerBookings()
      .then(async (data) => {
        if (cancelled) return;
        setBookings(data);

        const confirmed = data.filter((b) => b.status === "confirmed" || b.status === "completed");
        const entries = await Promise.all(
          confirmed.map(async (b) => {
            try {
              const payment = await getBookingPayment(b.id);
              return [b.id, payment] as const;
            } catch {
              return [b.id, null] as const;
            }
          })
        );
        if (!cancelled) setPayments(Object.fromEntries(entries));
      })
      .catch(() => {
        if (!cancelled) setLoadError("Couldn't load confirmed payments right now.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, isOwnerRole]);

  const confirmed = bookings.filter((b) => b.status === "confirmed" || b.status === "completed");
  const totalByCurrency = confirmed.reduce<Record<string, number>>((acc, b) => {
    acc[b.currency] = (acc[b.currency] ?? 0) + parseFloat(b.totalAmount);
    return acc;
  }, {});

  const paidCount = confirmed.filter((b) => payments[b.id]?.status === "successful").length;

  return (
    <div className="bookings-page">
      <Navbar />

      <section className="category-hero">
        <div className="category-hero__overlay" />
        <div className="category-hero__content">
          <h1>Confirmed Payments</h1>
          <p>Revenue from confirmed bookings across your listings.</p>
        </div>
      </section>

      <div className="bookings-list-page">
        <div className="payments-banner">
          Rooma takes a 5% platform fee on payments actually made through the site — the rest is
          yours. Until a guest pays online, this page just tracks what's owed.
        </div>

        {!user && (
          <p className="category-status">
            Log in to see confirmed payments.{" "}
            <Link to="/login" state={{ redirectTo: "/owner/payments" }} className="category-status__reset">
              Log in
            </Link>
          </p>
        )}

        {user && !isOwnerRole && (
          <p className="category-status">
            This page is for landlords, agents, and hotel managers. Your account role is{" "}
            <strong>{user.role}</strong>.
          </p>
        )}

        {user && isOwnerRole && isLoading && <p className="category-status">Loading confirmed payments…</p>}

        {user && isOwnerRole && !isLoading && loadError && (
          <p className="category-status category-status--error">{loadError}</p>
        )}

        {user && isOwnerRole && !isLoading && !loadError && confirmed.length === 0 && (
          <p className="category-status">No confirmed bookings yet.</p>
        )}

        {user && isOwnerRole && !isLoading && !loadError && confirmed.length > 0 && (
          <>
            <p className="bookings-summary">
              {Object.entries(totalByCurrency)
                .map(([currency, total]) => `${currency} ${total.toLocaleString()}`)
                .join(" · ")}{" "}
              across {confirmed.length} confirmed booking{confirmed.length !== 1 ? "s" : ""} · {paidCount} paid
            </p>

            <div className="bookings-table">
              {confirmed.map((b) => {
                const payment = payments[b.id];
                const isPaid = payment?.status === "successful";
                return (
                  <div className="booking-row booking-row--stacked" key={b.id}>
                    <div className="booking-row__top">
                      <div className="booking-row__main">
                        <Link to={`/listings/${b.listingId}`} className="booking-row__title">
                          {b.listing?.title ?? "Listing"}
                        </Link>
                        <p className="booking-row__location">
                          {b.user?.fullName ?? "A guest"} · {b.user?.phoneNumber ?? ""}
                        </p>
                        {(b.checkIn || b.checkOut) && (
                          <p className="booking-row__dates">
                            {formatDate(b.checkIn) ?? "—"} → {formatDate(b.checkOut) ?? "—"}
                          </p>
                        )}
                      </div>
                      <div className="booking-row__side">
                        <span className={`payment-status-pill${isPaid ? " payment-status-pill--paid" : ""}`}>
                          {isPaid ? "Paid" : "Awaiting payment"}
                        </span>
                        <p className="booking-row__amount">
                          {b.currency} {parseFloat(b.totalAmount).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {isPaid && payment && (
                      <div className="payment-fee-breakdown">
                        <span>
                          Platform fee ({parseFloat(payment.platformFeePercent).toFixed(0)}%): {payment.currency}{" "}
                          {parseFloat(payment.platformFeeAmount).toLocaleString()}
                        </span>
                        <span className="payment-fee-breakdown__net">
                          Your payout: {payment.currency} {parseFloat(payment.netAmount).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
