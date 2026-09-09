import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import "./MarketingPage.css";

const VALUES = [
  {
    title: "Transparency",
    description:
      "Clear pricing, verified listings, and honest information — no more guessing what you'll actually get.",
    icon: <path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21Z" />,
  },
  {
    title: "Trust",
    description:
      "Every listing on Rooma goes through a verification process before it reaches a seeker's search results.",
    icon: <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4Z" />,
  },
  {
    title: "Accessibility",
    description:
      "One platform across Android, iOS, and the web, so anyone — student or executive — can find a place to stay.",
    icon: <path d="M12 2C7.6 2 4 5.4 4 9.6 4 15 12 22 12 22s8-7 8-12.4C20 5.4 16.4 2 12 2Z" />,
  },
];

const STATS = [
  { value: "~120", label: "Universities across Ghana" },
  { value: "~430", label: "3–5 star hotels in view" },
  { value: "4", label: "Accommodation verticals in one app" },
];

export function AboutPage() {
  return (
    <div className="marketing-page">
      <Navbar />

      <section className="marketing-hero">
        <span className="marketing-hero__eyebrow">About Us</span>
        <h1>Digitizing Ghana's accommodation market, one verified listing at a time</h1>
        <p>
          Rooma is built by eLPi.dev, the software development vertical of Elpyron Ltd. We're
          working to bring hostels, hotels, rentals, and home sales into a single, trustworthy
          platform.
        </p>
      </section>

      <section className="marketing-section">
        <div className="marketing-section__header">
          <h2>Why we built Rooma</h2>
          <p>
            Ghana's accommodation search today is scattered across informal WhatsApp groups,
            unreliable agents, and outdated listings. Seekers waste time and money on physical
            inspections that don't match what they were promised, while landlords, agents, and
            hotel managers lack a simple way to reach the people looking for a place to stay.
            Rooma exists to close that gap.
          </p>
        </div>

        <div className="marketing-stats">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <p className="marketing-stat__value">{stat.value}</p>
              <p className="marketing-stat__label">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="marketing-section marketing-section--tint">
        <div className="marketing-section__inner">
          <div className="marketing-section__header">
            <h2>What we stand for</h2>
          </div>
          <div className="marketing-grid">
            {VALUES.map((v) => (
              <div className="marketing-card" key={v.title}>
                <span className="marketing-card__icon">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
                    {v.icon}
                  </svg>
                </span>
                <h3>{v.title}</h3>
                <p>{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="marketing-cta-band">
        <h2>Join us in digitizing the real estate landscape</h2>
        <p>Whether you're searching for a place or listing one, Rooma is built for you.</p>
        <Link to="/signup" className="btn-primary--nav">
          Get Started
        </Link>
      </div>
    </div>
  );
}
