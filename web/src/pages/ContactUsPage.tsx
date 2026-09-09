import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { getMyContact, updateMyContact } from "../api/contact";
import { ApiError } from "../api/apiError";
import "../pages/AuthForms.css";
import "./ContactUsPage.css";

const OWNER_ROLES = ["landlord", "agent", "hotel_manager", "admin"];

export function ContactUsPage() {
  const { user } = useAuth();
  const location = useLocation();

  const [businessName, setBusinessName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactWhatsapp, setContactWhatsapp] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const isOwnerRole = user ? OWNER_ROLES.includes(user.role) : false;

  useEffect(() => {
    if (!user || !isOwnerRole) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;

    getMyContact()
      .then((data) => {
        if (cancelled) return;
        setBusinessName(data.businessName ?? "");
        setContactPhone(data.contactPhone ?? "");
        setContactEmail(data.contactEmail ?? "");
        setContactWhatsapp(data.contactWhatsapp ?? "");
      })
      .catch(() => {
        if (!cancelled) setFormError("Couldn't load your contact info right now.");
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
    setFieldErrors({});
    setSavedMessage(null);

    setIsSaving(true);
    try {
      await updateMyContact({ businessName, contactPhone, contactEmail, contactWhatsapp });
      setSavedMessage("Saved — this will now show on all your listings.");
    } catch (err) {
      if (err instanceof ApiError && err.issues && err.issues.length > 0) {
        const errs: Record<string, string> = {};
        for (const issue of err.issues) errs[issue.field] = issue.message;
        setFieldErrors(errs);
      } else {
        setFormError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      }
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
            Log in to manage your contact info.{" "}
            <Link to="/login" state={{ redirectTo: location.pathname }} className="contact-us-status__link">
              Log in
            </Link>
          </p>
        )}

        {user && !isOwnerRole && (
          <p className="contact-us-status">
            Contact Us is available for landlord, agent, and hotel manager accounts. Your account
            role is <strong>{user.role}</strong>.
          </p>
        )}

        {user && isOwnerRole && isLoading && <p className="contact-us-status">Loading…</p>}

        {user && isOwnerRole && !isLoading && (
          <form className="auth-form contact-us-form" onSubmit={handleSubmit}>
            <h1>Contact Us</h1>
            <p className="auth-form__intro">
              These details appear on every listing you post, so seekers can reach you directly.
              Leave a field blank to hide it.
            </p>

            <div className="auth-form__fields">
              <div className="field">
                <label htmlFor="businessName">Business / display name</label>
                <input
                  id="businessName"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Owusu Properties"
                />
                {fieldErrors.businessName && <span className="field__error">{fieldErrors.businessName}</span>}
              </div>

              <div className="field">
                <label htmlFor="contactPhone">Contact phone</label>
                <input
                  id="contactPhone"
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="0244000000"
                />
                {fieldErrors.contactPhone && <span className="field__error">{fieldErrors.contactPhone}</span>}
              </div>

              <div className="field">
                <label htmlFor="contactEmail">Contact email</label>
                <input
                  id="contactEmail"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="you@business.com"
                />
                {fieldErrors.contactEmail && <span className="field__error">{fieldErrors.contactEmail}</span>}
              </div>

              <div className="field">
                <label htmlFor="contactWhatsapp">WhatsApp number</label>
                <input
                  id="contactWhatsapp"
                  type="tel"
                  value={contactWhatsapp}
                  onChange={(e) => setContactWhatsapp(e.target.value)}
                  placeholder="0244000000"
                />
                <span className="field__hint">Used to generate a "Chat on WhatsApp" link on your listings</span>
                {fieldErrors.contactWhatsapp && <span className="field__error">{fieldErrors.contactWhatsapp}</span>}
              </div>
            </div>

            {formError && <div className="form-error">{formError}</div>}
            {savedMessage && <div className="contact-us-success">{savedMessage}</div>}

            <button className="btn-primary" type="submit" disabled={isSaving}>
              {isSaving ? "Saving…" : "Save Contact Info"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
