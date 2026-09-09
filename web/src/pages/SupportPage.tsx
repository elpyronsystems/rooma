import { useMemo, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { FaqAccordion } from "../components/FaqAccordion";
import { submitSupportMessage, type SupportCategory } from "../api/support";
import { ApiError } from "../api/apiError";
import "../pages/AuthForms.css";
import "./SupportPage.css";

interface SupportCategoryCard {
  key: SupportCategory;
  title: string;
  description: string;
  bullets: string[];
  color: string;
  ctaLabel: string;
  icon: JSX.Element;
}

const CATEGORY_CARDS: SupportCategoryCard[] = [
  {
    key: "finding_accommodation",
    title: "Finding a Place",
    description: "Need help finding the right hostel, hotel, rental home, or property?",
    bullets: [
      "Searching and filtering listings",
      "Finding accommodation near a university",
      "Understanding listing details & availability",
      "Saving and managing your favourite listings",
    ],
    color: "#2563eb",
    ctaLabel: "Explore Help Centre",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" strokeWidth="2">
        <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
      </svg>
    ),
  },
  {
    key: "booking",
    title: "Bookings & Payments",
    description: "Having an issue with a booking or payment?",
    bullets: [
      "Booking requests and confirmations",
      "Payment issues",
      "Receipts and transaction records",
      "Cancellations and booking-related concerns",
    ],
    color: "#16a34a",
    ctaLabel: "Get Booking Support",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" strokeWidth="2">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4" />
      </svg>
    ),
  },
  {
    key: "property_listing",
    title: "Property Owners & Managers",
    description: "Do you manage a hostel, hotel, rental property, or real estate listing?",
    bullets: [
      "Creating and managing listings",
      "Updating availability and pricing",
      "Managing booking requests and enquiries",
      "Property verification & dashboard support",
    ],
    color: "#7c3aed",
    ctaLabel: "Get Provider Support",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" strokeWidth="2">
        <path d="M3 21h18M5 21V10l7-6 7 6v11M9 21v-6h6v6" />
      </svg>
    ),
  },
  {
    key: "my_account",
    title: "Account & Security",
    description: "Need assistance with your Rooma account?",
    bullets: [
      "Signing in or resetting your password",
      "Phone number or account verification",
      "Account access issues",
      "Reporting suspicious activity",
      "Privacy and security concerns",
    ],
    color: "#ea580c",
    ctaLabel: "Get Account Support",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" strokeWidth="2">
        <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4Z" />
      </svg>
    ),
  },
];

const CATEGORY_OPTIONS: { value: SupportCategory; label: string }[] = [
  { value: "finding_accommodation", label: "Finding Accommodation" },
  { value: "booking", label: "Booking" },
  { value: "payment", label: "Payment" },
  { value: "my_account", label: "My Account" },
  { value: "property_listing", label: "Property Listing" },
  { value: "verification", label: "Verification" },
  { value: "report_a_problem", label: "Report a Problem" },
  { value: "other", label: "Other" },
];

const FAQ_ITEMS = [
  {
    question: "Is Rooma responsible for the properties listed on the platform?",
    answer:
      "Rooma provides a platform for discovering and connecting with accommodation and property providers. Users should carefully review listing information and follow the appropriate booking or enquiry process before making a decision.",
  },
  {
    question: "How do I book a hotel or accommodation?",
    answer:
      "Select your preferred listing, review the available details and follow the booking process provided. Depending on the listing, confirmation may be required from the property manager or provider.",
  },
  {
    question: "Can I list my hostel, hotel, house, or property on Rooma?",
    answer:
      "Yes. Property owners, managers, landlords, agents, and other authorized providers can create and manage listings through Rooma, subject to the platform's verification and listing requirements.",
  },
  {
    question: "How do I report incorrect or suspicious information?",
    answer:
      "You can use the Report Listing option on the relevant property or contact our support team with details of the issue.",
  },
  {
    question: "I made a payment but have not received confirmation. What should I do?",
    answer:
      "Please contact support and provide your transaction reference and booking details. Our team will review the transaction and assist you.",
  },
];

export function SupportPage() {
  const formRef = useRef<HTMLDivElement>(null);

  const [searchTerm, setSearchTerm] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [category, setCategory] = useState<SupportCategory>("finding_accommodation");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const filteredFaqs = useMemo(() => {
    if (!searchTerm.trim()) return FAQ_ITEMS;
    const q = searchTerm.trim().toLowerCase();
    return FAQ_ITEMS.filter(
      (item) => item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q)
    );
  }, [searchTerm]);

  function scrollToForm(preselect: SupportCategory) {
    setCategory(preselect);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setSuccessMessage(null);

    setIsSubmitting(true);
    try {
      const response = await submitSupportMessage({
        fullName,
        email,
        phoneNumber: phoneNumber || undefined,
        category,
        subject,
        message,
      });
      setSuccessMessage(response.message);
      setFullName("");
      setEmail("");
      setPhoneNumber("");
      setSubject("");
      setMessage("");
    } catch (err) {
      if (err instanceof ApiError && err.issues && err.issues.length > 0) {
        const errs: Record<string, string> = {};
        for (const issue of err.issues) errs[issue.field] = issue.message;
        setFieldErrors(errs);
      } else {
        setFormError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="support-page">
      <Navbar />

      <section className="support-hero">
        <div className="support-hero__text">
          <span className="support-hero__eyebrow">SUPPORT &amp; CONTACT</span>
          <h1>
            How can we <span className="support-hero__accent">help you</span> today?
          </h1>
          <p>
            Whether you're looking for a place to stay, managing a property, making a booking, or
            experiencing an issue with your Rooma account, our support team is here to help.
          </p>
          <div className="support-hero__search">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              placeholder="Search for help (e.g. booking, payment, listing, account…)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="support-hero__art" aria-hidden="true">
          <div className="support-hero__art-orb" />
          <div className="support-hero__art-badge">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--color-primary)" strokeWidth="1.8">
              <path d="M3 8a9 9 0 0 1 18 0M3 8v7a2 2 0 0 0 2 2h1v-7H4a1 1 0 0 0-1 1Zm18-1v7a2 2 0 0 1-2 2h-1v-7h2a1 1 0 0 1 1 1Z" />
            </svg>
            We're here to help!
          </div>
          <svg
            className="support-hero__art-house"
            viewBox="0 0 24 24"
            width="64"
            height="64"
            fill="none"
            stroke="var(--color-primary-light)"
            strokeWidth="1.4"
          >
            <path d="M3 11 12 3l9 8M5 10v10h14V10" />
          </svg>
        </div>
      </section>

      <section className="support-categories">
        <h2>Get Support</h2>
        <p className="support-categories__intro">Choose a category below to get started.</p>

        <div className="support-categories__grid">
          {CATEGORY_CARDS.map((card) => (
            <div className="support-category-card" key={card.key}>
              <span className="support-category-card__icon" style={{ backgroundColor: card.color }}>
                {card.icon}
              </span>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
              <ul>
                {card.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              <button
                type="button"
                className="support-category-card__cta"
                style={{ color: card.color }}
                onClick={() => scrollToForm(card.key)}
              >
                {card.ctaLabel}
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="support-body" ref={formRef}>
        <div className="support-faq">
          <div className="support-faq__header">
            <div>
              <h2>Frequently Asked Questions</h2>
              <p>Find quick answers to common questions.</p>
            </div>
          </div>

          {filteredFaqs.length > 0 ? (
            <FaqAccordion items={filteredFaqs} />
          ) : (
            <p className="support-faq__empty">No FAQs match "{searchTerm}" — try the contact form instead.</p>
          )}
        </div>

        <div className="support-contact">
          <div className="support-contact-form">
            <h2>Contact Us</h2>
            <p>Still need help? Send us a message and our support team will get back to you as soon as possible.</p>

            <form onSubmit={handleSubmit}>
              <div className="support-contact-form__row">
                <div className="field">
                  <label htmlFor="fullName">Full Name *</label>
                  <input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                  {fieldErrors.fullName && <span className="field__error">{fieldErrors.fullName}</span>}
                </div>
                <div className="field">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                  {fieldErrors.email && <span className="field__error">{fieldErrors.email}</span>}
                </div>
              </div>

              <div className="support-contact-form__row">
                <div className="field">
                  <label htmlFor="phoneNumber">Phone Number (Optional)</label>
                  <input
                    id="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+233 50 123 4567"
                  />
                </div>
                <div className="field">
                  <label htmlFor="category">What do you need help with? *</label>
                  <select id="category" value={category} onChange={(e) => setCategory(e.target.value as SupportCategory)}>
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="field">
                <label htmlFor="subject">Subject *</label>
                <input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Briefly describe your issue"
                  required
                />
                {fieldErrors.subject && <span className="field__error">{fieldErrors.subject}</span>}
              </div>

              <div className="field">
                <label htmlFor="message">Tell us more about the issue *</label>
                <textarea
                  id="message"
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here…"
                  required
                />
                {fieldErrors.message && <span className="field__error">{fieldErrors.message}</span>}
              </div>

              <p className="support-contact-form__notice">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="4" y="10" width="16" height="10" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
                Please do not include passwords, payment PINs, or other sensitive information in your message.
              </p>

              {formError && <div className="form-error">{formError}</div>}
              {successMessage && <div className="support-contact-form__success">{successMessage}</div>}

              <button className="btn-primary support-contact-form__submit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Sending…" : "Send Message"}
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m3 3 18 9-18 9 4-9-4-9Z" />
                </svg>
              </button>
            </form>
          </div>

          <div className="support-sidebar">
            <h3>Other Ways to Reach Us</h3>

            <div className="support-sidebar__item">
              <span className="support-sidebar__icon">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3 7 9 6 9-6" />
                </svg>
              </span>
              <div>
                <p className="support-sidebar__title">General Enquiries &amp; Support</p>
                <p className="support-sidebar__desc">
                  For questions about Rooma, account, booking, payment, and technical assistance.
                </p>
                <a href="mailto:support@rooma.elpi.dev">support@rooma.elpi.dev</a>
              </div>
            </div>

            <div className="support-sidebar__item">
              <span className="support-sidebar__icon">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="4" y="10" width="16" height="10" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
              </span>
              <div>
                <p className="support-sidebar__title">Privacy &amp; Data Protection</p>
                <p className="support-sidebar__desc">For privacy-related requests or questions about your data.</p>
                <a href="mailto:privacy@rooma.elpi.dev">privacy@rooma.elpi.dev</a>
              </div>
            </div>

            <div className="support-sidebar__footer">
              <p className="support-sidebar__footer-title">We're here for you</p>
              <p>Your experience matters to us. Reach out anytime — we're just a message away.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="support-footer">
        <p className="support-footer__title">Rooma Support</p>
        <p>Helping you find, book, and manage the spaces that matter.</p>
        <Link to="/privacy" className="support-footer__privacy-link">
          Privacy Policy
        </Link>
      </footer>
    </div>
  );
}
