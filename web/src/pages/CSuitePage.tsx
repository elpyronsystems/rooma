import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import "./MarketingPage.css";

const BENEFITS = [
  {
    title: "Executive-Grade Stays",
    description:
      "Filter for premium hotels and serviced apartments that match the standard your travel demands.",
    icon: <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />,
  },
  {
    title: "Fast, Reliable Booking",
    description:
      "No back-and-forth with agents — search, compare, and confirm your stay directly through Rooma.",
    icon: <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" />,
  },
  {
    title: "Secure Payments",
    description:
      "Book with confidence using trusted payment options, with confirmation and receipts handled digitally.",
    icon: <path d="M12 2 4 5v6c0 5 3.4 8.4 8 11 4.6-2.6 8-6 8-11V5l-8-3ZM9.5 12l1.8 1.8L15 10" />,
  },
];

export function CSuitePage() {
  return (
    <div className="marketing-page">
      <Navbar />

      <section className="marketing-hero">
        <span className="marketing-hero__eyebrow">For C-Suite</span>
        <h1>Business travel accommodation, without the hassle</h1>
        <p>
          For executives and business travelers who need reliable, verified stays in Accra
          and beyond — Rooma cuts out the uncertainty of informal bookings.
        </p>
        <div className="marketing-hero__cta">
          <Link to="/hotels" className="btn-primary--nav">
            Browse Executive Stays
          </Link>
          <Link to="/signup" className="btn-outline--nav">
            Create an Account
          </Link>
        </div>
      </section>

      <section className="marketing-section">
        <div className="marketing-section__header">
          <h2>Built around your schedule</h2>
          <p>Less time coordinating accommodation, more time on what matters.</p>
        </div>
        <div className="marketing-grid">
          {BENEFITS.map((b) => (
            <div className="marketing-card" key={b.title}>
              <span className="marketing-card__icon">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
                  {b.icon}
                </svg>
              </span>
              <h3>{b.title}</h3>
              <p>{b.description}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="marketing-cta-band">
        <h2>Your next trip deserves a stay that matches it</h2>
        <p>Search verified hotels and executive suites on Rooma today.</p>
        <Link to="/hotels" className="btn-primary--nav">
          Explore Hotels
        </Link>
      </div>
    </div>
  );
}
