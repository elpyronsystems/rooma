import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { BookingStatusBadge } from "../components/BookingStatusBadge";
import { useAuth } from "../context/AuthContext";
import { getMyBookings } from "../api/bookings";
import {
  initiatePayment,
  verifyPayment,
  type PaymentProvider,
  type ManualTransferInstructions,
} from "../api/payments";
import { ApiError } from "../api/apiError";
import type { Booking } from "../api/types";
import "./CategoryListingsPage.css";
import "../pages/AuthForms.css";
import "./BookingsPage.css";

function formatDate(dateStr?: string): string | null {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

const PROVIDER_OPTIONS: { value: PaymentProvider; label: string }[] = [
  { value: "mtn_momo", label: "MTN Mobile Money" },
  { value: "telecel_cash", label: "Telecel Cash" },
  { value: "bank", label: "Bank Transfer" },
];

type PayPanelState =
  | { stage: "choosing" }
  | { stage: "polling"; reference: string }
  | { stage: "manual"; instructions: ManualTransferInstructions }
  | { stage: "success" }
  | { stage: "failed" };

export function PaymentsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [openBookingId, setOpenBookingId] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>("mtn_momo");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [panelState, setPanelState] = useState<PayPanelState>({ stage: "choosing" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const pollTimer = useRef<number | null>(null);

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
        if (!cancelled) setLoadError("Couldn't load your payments right now.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    return () => {
      if (pollTimer.current) window.clearInterval(pollTimer.current);
    };
  }, []);

  const payable = bookings.filter((b) => b.status === "confirmed" || b.status === "completed");

  function openPanel(bookingId: string) {
    setOpenBookingId(bookingId);
    setPanelState({ stage: "choosing" });
    setPayError(null);
    setPhoneNumber("");
  }

  function closePanel() {
    if (pollTimer.current) window.clearInterval(pollTimer.current);
    setOpenBookingId(null);
  }

  function startPolling(reference: string) {
    setPanelState({ stage: "polling", reference });
    pollTimer.current = window.setInterval(async () => {
      try {
        const payment = await verifyPayment(reference);
        if (payment.status === "successful") {
          if (pollTimer.current) window.clearInterval(pollTimer.current);
          setPanelState({ stage: "success" });
        } else if (payment.status === "failed") {
          if (pollTimer.current) window.clearInterval(pollTimer.current);
          setPanelState({ stage: "failed" });
        }
      } catch {
        // A single failed poll isn't fatal — just try again next tick.
      }
    }, 4000);
  }

  async function handlePay(bookingId: string) {
    setPayError(null);
    if ((selectedProvider === "mtn_momo" || selectedProvider === "telecel_cash") && !phoneNumber.trim()) {
      setPayError("Enter the phone number to receive the payment prompt on.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await initiatePayment(bookingId, selectedProvider, phoneNumber.trim() || undefined);

      if (result.requiresManualTransfer && result.instructions) {
        setPanelState({ stage: "manual", instructions: result.instructions });
      } else if (result.requiresPolling) {
        startPolling(result.reference);
      }
    } catch (err) {
      setPayError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bookings-page">
      <Navbar />

      <section className="category-hero">
        <div className="category-hero__overlay" />
        <div className="category-hero__content">
          <h1>Payments</h1>
          <p>Amounts due for your confirmed bookings.</p>
        </div>
      </section>

      <div className="bookings-list-page">
        {!user && (
          <p className="category-status">
            Log in to see your payments.{" "}
            <Link to="/login" state={{ redirectTo: "/payments" }} className="category-status__reset">
              Log in
            </Link>
          </p>
        )}

        {user && isLoading && <p className="category-status">Loading your payments…</p>}

        {user && !isLoading && loadError && (
          <p className="category-status category-status--error">{loadError}</p>
        )}

        {user && !isLoading && !loadError && payable.length === 0 && (
          <p className="category-status">No confirmed bookings awaiting payment yet.</p>
        )}

        {user && !isLoading && !loadError && payable.length > 0 && (
          <div className="bookings-table">
            {payable.map((b) => (
              <div className="booking-row booking-row--stacked" key={b.id}>
                <div className="booking-row__top">
                  <div className="booking-row__main">
                    <Link to={`/listings/${b.listingId}`} className="booking-row__title">
                      {b.listing?.title ?? "Listing"}
                    </Link>
                    <p className="booking-row__location">{b.listing?.address || "Location not specified"}</p>
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

                {openBookingId === b.id ? (
                  <div className="payment-pay-panel">
                    {panelState.stage === "choosing" && (
                      <>
                        <div className="payment-pay-panel__providers">
                          {PROVIDER_OPTIONS.map((opt) => (
                            <label key={opt.value} className="payment-pay-panel__option">
                              <input
                                type="radio"
                                name={`provider-${b.id}`}
                                checked={selectedProvider === opt.value}
                                onChange={() => setSelectedProvider(opt.value)}
                              />
                              {opt.label}
                            </label>
                          ))}
                        </div>

                        {(selectedProvider === "mtn_momo" || selectedProvider === "telecel_cash") && (
                          <div className="field" style={{ marginTop: "0.9rem" }}>
                            <label htmlFor={`phone-${b.id}`}>Phone number for the payment prompt</label>
                            <input
                              id={`phone-${b.id}`}
                              type="tel"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              placeholder="0244000000"
                            />
                          </div>
                        )}

                        {payError && <div className="form-error">{payError}</div>}

                        <div className="payment-pay-panel__actions">
                          <button
                            type="button"
                            className="btn-primary payment-pay-panel__submit"
                            disabled={isSubmitting}
                            onClick={() => handlePay(b.id)}
                          >
                            {isSubmitting ? "Sending…" : "Pay Now"}
                          </button>
                          <button type="button" className="payment-pay-panel__cancel" onClick={closePanel}>
                            Cancel
                          </button>
                        </div>
                      </>
                    )}

                    {panelState.stage === "polling" && (
                      <div className="payment-pay-panel__status">
                        <p>
                          Check your phone — a {selectedProvider === "mtn_momo" ? "MTN" : "Telecel"} prompt
                          was sent to approve {b.currency} {parseFloat(b.totalAmount).toLocaleString()}.
                        </p>
                        <p className="payment-pay-panel__status-hint">Waiting for confirmation…</p>
                      </div>
                    )}

                    {panelState.stage === "manual" && (
                      <div className="payment-pay-panel__status">
                        <p>Make two bank transfers to complete this payment:</p>
                        <div className="payment-manual-instructions">
                          <div>
                            <strong>
                              {panelState.instructions.currency} {panelState.instructions.ownerAmount.toLocaleString()}
                            </strong>{" "}
                            to the owner
                            <br />
                            {panelState.instructions.ownerBankName || "Bank not set by owner yet"}
                            {panelState.instructions.ownerAccountNumber && (
                              <> · {panelState.instructions.ownerAccountNumber}</>
                            )}
                            {panelState.instructions.ownerAccountName && (
                              <> · {panelState.instructions.ownerAccountName}</>
                            )}
                          </div>
                          <div style={{ marginTop: "0.75rem" }}>
                            <strong>
                              {panelState.instructions.currency}{" "}
                              {panelState.instructions.platformAmount.toLocaleString()}
                            </strong>{" "}
                            to Rooma
                            <br />
                            {panelState.instructions.platformBankName || "Not set yet"}
                            {panelState.instructions.platformAccountNumber && (
                              <> · {panelState.instructions.platformAccountNumber}</>
                            )}
                            {panelState.instructions.platformAccountName && (
                              <> · {panelState.instructions.platformAccountName}</>
                            )}
                          </div>
                        </div>
                        <p className="payment-pay-panel__status-hint">
                          Once received, we'll confirm your payment on our end.
                        </p>
                      </div>
                    )}

                    {panelState.stage === "success" && (
                      <div className="payment-pay-panel__status payment-pay-panel__status--success">
                        Payment received. You're all set!
                      </div>
                    )}

                    {panelState.stage === "failed" && (
                      <div className="payment-pay-panel__status payment-pay-panel__status--failed">
                        This payment wasn't approved.{" "}
                        <button type="button" className="payment-pay-panel__cancel" onClick={() => openPanel(b.id)}>
                          Try again
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button type="button" className="payment-pay-trigger" onClick={() => openPanel(b.id)}>
                    Pay Now
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
