import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { getMyPayoutSettings, updateMyPayoutSettings, type PayoutSettings } from "../api/payout";
import { ApiError } from "../api/apiError";
import "../pages/AuthForms.css";
import "./ContactUsPage.css";

const OWNER_ROLES = ["landlord", "agent", "hotel_manager", "admin"];

export function OwnerPayoutSettingsPage() {
  const { user } = useAuth();
  const location = useLocation();

  const [payoutMethod, setPayoutMethod] = useState<PayoutSettings["payoutMethod"]>("");
  const [payoutMomoNumber, setPayoutMomoNumber] = useState("");
  const [payoutBankName, setPayoutBankName] = useState("");
  const [payoutBankAccountNumber, setPayoutBankAccountNumber] = useState("");
  const [payoutBankAccountName, setPayoutBankAccountName] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const isOwnerRole = user ? OWNER_ROLES.includes(user.role) : false;

  useEffect(() => {
    if (!user || !isOwnerRole) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;

    getMyPayoutSettings()
      .then((data) => {
        if (cancelled) return;
        setPayoutMethod(data.payoutMethod || "");
        setPayoutMomoNumber(data.payoutMomoNumber || "");
        setPayoutBankName(data.payoutBankName || "");
        setPayoutBankAccountNumber(data.payoutBankAccountNumber || "");
        setPayoutBankAccountName(data.payoutBankAccountName || "");
      })
      .catch(() => {
        if (!cancelled) setFormError("Couldn't load your payout settings right now.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, isOwnerRole]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setSavedMessage(null);
    setIsSaving(true);
    try {
      await updateMyPayoutSettings({
        payoutMethod,
        payoutMomoNumber,
        payoutBankName,
        payoutBankAccountNumber,
        payoutBankAccountName,
      });
      setSavedMessage("Saved — this is where your 95% share of confirmed payments will be sent.");
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="contact-us-page">
      <Navbar />

      <div className="contact-us-container">
        {!user && (
          <p className="contact-us-status">
            Log in to manage your payout settings.{" "}
            <Link to="/login" state={{ redirectTo: location.pathname }} className="contact-us-status__link">
              Log in
            </Link>
          </p>
        )}

        {user && !isOwnerRole && (
          <p className="contact-us-status">
            Payout Settings is available for landlord, agent, and hotel manager accounts. Your
            account role is <strong>{user.role}</strong>.
          </p>
        )}

        {user && isOwnerRole && isLoading && <p className="contact-us-status">Loading…</p>}

        {user && isOwnerRole && !isLoading && (
          <form className="auth-form contact-us-form" onSubmit={handleSubmit}>
            <h1>Payout Settings</h1>
            <p className="auth-form__intro">
              When a seeker pays for a confirmed booking, Rooma keeps a 5% platform fee — the rest
              (95%) comes here. Choose how you'd like to receive it.
            </p>

            <div className="auth-form__fields">
              <div className="field">
                <label htmlFor="payoutMethod">Payout method</label>
                <select
                  id="payoutMethod"
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value as PayoutSettings["payoutMethod"])}
                >
                  <option value="">Not set</option>
                  <option value="mtn_momo">MTN Mobile Money</option>
                  <option value="telecel_cash">Telecel Cash</option>
                  <option value="bank">Bank Account</option>
                </select>
              </div>

              {(payoutMethod === "mtn_momo" || payoutMethod === "telecel_cash") && (
                <div className="field">
                  <label htmlFor="payoutMomoNumber">
                    {payoutMethod === "mtn_momo" ? "MTN" : "Telecel"} Mobile Money Number
                  </label>
                  <input
                    id="payoutMomoNumber"
                    type="tel"
                    value={payoutMomoNumber}
                    onChange={(e) => setPayoutMomoNumber(e.target.value)}
                    placeholder="0244000000"
                  />
                </div>
              )}

              {payoutMethod === "bank" && (
                <>
                  <div className="field">
                    <label htmlFor="payoutBankName">Bank name</label>
                    <input
                      id="payoutBankName"
                      value={payoutBankName}
                      onChange={(e) => setPayoutBankName(e.target.value)}
                      placeholder="e.g. GCB Bank"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="payoutBankAccountNumber">Account number</label>
                    <input
                      id="payoutBankAccountNumber"
                      value={payoutBankAccountNumber}
                      onChange={(e) => setPayoutBankAccountNumber(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="payoutBankAccountName">Account name</label>
                    <input
                      id="payoutBankAccountName"
                      value={payoutBankAccountName}
                      onChange={(e) => setPayoutBankAccountName(e.target.value)}
                      placeholder="Name on the account"
                    />
                  </div>
                </>
              )}
            </div>

            {formError && <div className="form-error">{formError}</div>}
            {savedMessage && <div className="contact-us-success">{savedMessage}</div>}

            <button className="btn-primary" type="submit" disabled={isSaving}>
              {isSaving ? "Saving…" : "Save Payout Settings"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
