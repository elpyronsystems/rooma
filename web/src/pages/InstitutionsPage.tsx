import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import "./MarketingPage.css";

const BENEFITS = [
  {
    title: "Centralized Listings",
    description:
      "Manage all your available rooms, beds, or units from one dashboard instead of juggling WhatsApp groups and spreadsheets.",
    icon: <path d="M4 5h16M4 12h16M4 19h16" />,
  },
  {
    title: "Real-Time Availability",
    description:
      "Update vacancies instantly so prospective students or guests always see accurate, up-to-date information.",
    icon: <path d="M12 6v6l4 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" />,
  },
  {
    title: "Verified Trust",
    description:
      "Every listing goes through Rooma's verification process, building confidence with the people searching for accommodation.",
    icon: <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4Z" />,
  },
];

const STEPS = [
  {
    title: "Register your institution",
    description: "Sign up as a Landlord, Agent, or Hotel Manager and set up your organization's profile.",
  },
  {
    title: "List your accommodations",
    description: "Add hostels, rooms, or units with photos, pricing, and availability details.",
  },
  {
    title: "Manage bookings in one place",
    description: "Confirm requests, track occupancy, and communicate with seekers directly through Rooma.",
  },
];

export function InstitutionsPage() {
  return (
    <div className="marketing-page">
      <Navbar />

      <section className="marketing-hero">
        <span className="marketing-hero__eyebrow">For Institutions</span>
        <h1>Digitize accommodation management for your students and guests</h1>
        <p>
          Whether you run a university hostel network, a hotel, or manage multiple rental
          properties, Rooma gives you one place to list, track, and fill your vacancies.
        </p>
        <div className="marketing-hero__cta">
          <Link to="/signup" className="btn-primary--nav">
            Get Started
          </Link>
          <Link to="/hotels" className="btn-outline--nav">
            See how it works
          </Link>
        </div>
      </section>

      <section className="marketing-section">
        <div className="marketing-section__header">
          <h2>Built for accommodation providers</h2>
          <p>Everything you need to reach more students, travelers, and tenants — without the guesswork.</p>
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

      <section className="marketing-section marketing-section--tint">
        <div className="marketing-section__inner">
          <div className="marketing-section__header">
            <h2>How it works</h2>
          </div>
          <div className="marketing-steps">
            {STEPS.map((step, i) => (
              <div className="marketing-step" key={step.title}>
                <span className="marketing-step__number">{i + 1}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="marketing-cta-band">
        <h2>Ready to reach more students and guests?</h2>
        <p>Set up your first listing on Rooma in minutes.</p>
        <Link to="/signup" className="btn-primary--nav">
          Sign Up as a Provider
        </Link>
      </div>
    </div>
  );
}
