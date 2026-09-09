import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { CategoryCard } from "../components/CategoryCard";
import { PropertyCard } from "../components/PropertyCard";
import { SearchBar } from "../components/SearchBar";
import { TestimonialCarousel } from "../components/TestimonialCarousel";
import { Footer } from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { searchListings } from "../api/listings";
import type { Listing } from "../api/types";
import "./HomePage.css";

const CATEGORIES = [
  {
    label: "Hotels",
    sublabel: "Premium stays",
    gradient: "linear-gradient(135deg, #2563eb, #60a5fa)",
    iconBg: "#2563eb",
    to: "/hotels",
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" strokeWidth="2">
        <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
      </svg>
    ),
  },
  {
    label: "Properties",
    sublabel: "Homes & Apartments",
    gradient: "linear-gradient(135deg, #16a34a, #86efac)",
    iconBg: "#16a34a",
    to: "/properties",
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" strokeWidth="2">
        <path d="M3 12l9-9 9 9M5 10v10h14V10" />
      </svg>
    ),
  },
  {
    label: "Student Hostel",
    sublabel: "Affordable & Safe",
    gradient: "linear-gradient(135deg, #7c3aed, #c4b5fd)",
    iconBg: "#7c3aed",
    to: "/hostels",
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" strokeWidth="2">
        <path d="M3 18v-6a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v6M3 18h18M6 12V9a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3" />
      </svg>
    ),
  },
  {
    label: "Tourism",
    sublabel: "Explore & Experience",
    gradient: "linear-gradient(135deg, #ea580c, #fdba74)",
    iconBg: "#ea580c",
    to: "/explore",
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" strokeWidth="2">
        <circle cx="12" cy="13" r="4" />
        <path d="M5 7l2-3h10l2 3M3 7h18v13H3z" />
      </svg>
    ),
  },
];

const TRUST_BADGES = [
  {
    title: "Verified & Trusted",
    description: "All listings are verified for your safety",
    icon: <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4Z" />,
  },
  {
    title: "Best Prices",
    description: "Competitive prices you can trust",
    icon: <path d="M20.6 12.3 12.7 20.2a2 2 0 0 1-2.8 0L3 13.3V4h9.3l8.3 8.3a2 2 0 0 1 0 2.8ZM7 8h.01" />,
  },
  {
    title: "24/7 Support",
    description: "We're here for you anytime, anywhere",
    icon: <path d="M3 12a9 9 0 0 1 18 0M3 12v4a2 2 0 0 0 2 2h1v-7H4a1 1 0 0 0-1 1Zm18 0v4a2 2 0 0 1-2 2h-1v-7h2a1 1 0 0 1 1 1Z" />,
  },
  {
    title: "Secure Booking",
    description: "Book with confidence and peace of mind",
    icon: <path d="M12 2 4 5v6c0 5 3.4 8.4 8 11 4.6-2.6 8-6 8-11V5l-8-3ZM9.5 12l1.8 1.8L15 10" />,
  },
];

// Cosmetic gradients standing in for real listing photos, cycled per card.
const PLACEHOLDER_GRADIENTS = [
  "linear-gradient(135deg, #1e293b, #475569)",
  "linear-gradient(135deg, #0ea5e9, #7dd3fc)",
  "linear-gradient(135deg, #78350f, #b45309)",
  "linear-gradient(135deg, #292524, #57534e)",
];

const BADGE_COLORS: Record<string, string> = {
  NEW: "#ea580c",
  hotel: "#2563eb",
  hostel: "#7c3aed",
  rental: "#16a34a",
  sale: "#0f766e",
};

function timeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
}

function isRecent(createdAt: string | undefined): boolean {
  if (!createdAt) return false;
  const days = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return days <= 14;
}

export function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [featured, setFeatured] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadFeatured() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const results = await searchListings();
        if (!cancelled) setFeatured(results.slice(0, 4));
      } catch {
        if (!cancelled) setLoadError("Couldn't load listings right now. Please try again shortly.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadFeatured();
    return () => {
      cancelled = true;
    };
  }, []);

  const greeting = user ? `Good ${timeOfDayGreeting()}, ${user.fullName.split(" ")[0]}` : "GOOD MORNING";

  function handleSearch(params: { location: string; search: string }) {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.location) query.set("location", params.location);
    navigate(`/hotels?${query.toString()}`);
  }

  return (
    <div className="page">
      <Navbar />

      <section className="hero">
        <div className="hero__left">
          <span className="hero__eyebrow">{greeting}</span>
          <h1 className="hero__headline">
            Find the perfect
            <br />
            Stay. <span className="hero__headline-accent">For You.</span>
          </h1>
          <p className="hero__subtext">
            Rooma helps students and executives find safe, verified, and comfortable
            accommodations with ease.
          </p>
        </div>

        <div className="hero__categories">
          {CATEGORIES.map((cat) => (
            <a key={cat.label} href={cat.to} onClick={(e) => { e.preventDefault(); navigate(cat.to); }}>
              <CategoryCard
                label={cat.label}
                sublabel={cat.sublabel}
                gradient={cat.gradient}
                iconBg={cat.iconBg}
                icon={cat.icon}
              />
            </a>
          ))}
        </div>
      </section>

      <SearchBar onSearch={handleSearch} />

      <section className="featured">
        <div className="featured__header">
          <h2>Featured Properties</h2>
          <a
            href="/hotels"
            className="featured__view-all"
            onClick={(e) => {
              e.preventDefault();
              navigate("/hotels");
            }}
          >
            View all
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        <div className="featured__grid">
          <div className="featured__cards">
            {isLoading && <p className="featured__status">Loading listings…</p>}
            {!isLoading && loadError && <p className="featured__status featured__status--error">{loadError}</p>}
            {!isLoading && !loadError && featured.length === 0 && (
              <p className="featured__status">No listings yet — check back soon.</p>
            )}
            {!isLoading &&
              !loadError &&
              featured.map((listing, index) => (
                <PropertyCard
                  key={listing.id}
                  id={listing.id}
                  gradient={PLACEHOLDER_GRADIENTS[index % PLACEHOLDER_GRADIENTS.length]}
                  imageUrl={listing.media.find((m) => m.mediaType === "image")?.url}
                  title={listing.title}
                  rating={parseFloat(listing.averageRating) || 0}
                  reviewCount={listing.ratingCount}
                  location={listing.address || "Location not specified"}
                  price={parseFloat(listing.price).toLocaleString()}
                  currency={listing.currency}
                  badge={
                    isRecent(listing.createdAt)
                      ? { label: "NEW", color: BADGE_COLORS.NEW }
                      : { label: listing.type.toUpperCase(), color: BADGE_COLORS[listing.type] }
                  }
                />
              ))}
          </div>

          <TestimonialCarousel />
        </div>
      </section>

      <section className="trust-badges">
        {TRUST_BADGES.map((badge) => (
          <div className="trust-badge" key={badge.title}>
            <span className="trust-badge__icon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
                {badge.icon}
              </svg>
            </span>
            <div>
              <p className="trust-badge__title">{badge.title}</p>
              <p className="trust-badge__desc">{badge.description}</p>
            </div>
          </div>
        ))}
      </section>

      <Footer />
    </div>
  );
}
