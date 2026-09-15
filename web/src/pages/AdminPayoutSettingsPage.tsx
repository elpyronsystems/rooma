import { useEffect, useState, type FormEvent } from "react";
import { AdminLayout } from "../components/AdminLayout";
import { useAuth } from "../context/AuthContext";
import { getPlatformPayoutSettings, updatePlatformPayoutSettings, type PayoutSettings } from "../api/payout";
import { ApiError } from "../api/apiError";
import "../pages/AuthForms.css";
import "./AdminUsersPage.css";
import "./ContactUsPage.css";

export function AdminPayoutSettingsPage() {
  const { user } = useAuth();

  const [payoutMethod, setPayoutMethod] = useState<PayoutSettings["payoutMethod"]>("");
  const [payoutMomoNumber, setPayoutMomoNumber] = useState("");
  const [payoutBankName, setPayoutBankName] = useState("");
  const [payoutBankAccountNumber, setPayoutBankAccountNumber] = useState("");
  const [payoutBankAccountName, setPayoutBankAccountName] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      setIsLoading(false);
      return;
    }
    let cancelled = false;

    getPlatformPayoutSettings()
      .then((data) => {
        if (cancelled) return;
        setPayoutMethod(data.payoutMethod || "");
        setPayoutMomoNumber(data.payoutMomoNumber || "");
        setPayoutBankName(data.payoutBankName || "");
        setPayoutBankAccountNumber(data.payoutBankAccountNumber || "");
        setPayoutBankAccountName(data.payoutBankAccountName || "");
      })
      .catch(() => {
        if (!cancelled) setFormError("Couldn't load the platform payout settings right now.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setSavedMessage(null);
    setIsSaving(true);
    try {
      await updatePlatformPayoutSettings({
        payoutMethod,
        payoutMomoNumber,
        payoutBankName,
        payoutBankAccountNumber,
        payoutBankAccountName,
      });
      setSavedMessage("Saved — this is where Rooma's 5% commission will be sent.");
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!user || user.role !== "admin") {
    return (
      <AdminLayout>
        <p className="admin-status">This area is for admin accounts only.</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {isLoading && <p className="admin-status">Loading…</p>}

      {!isLoading && (
        <form className="auth-form" onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
          <h1 style={{ fontSize: "1.3rem" }}>Platform Payout Settings</h1>
          <p className="auth-form__intro">
            Rooma keeps a 5% fee from every payment made through the platform. Set where that
            commission gets sent.
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

          <button className="btn-primary" type="submit" disabled={isSaving} style={{ width: "auto", padding: "0.7rem 1.5rem" }}>
            {isSaving ? "Saving…" : "Save Settings"}
          </button>
        </form>
      )}
    </AdminLayout>
  );
}
