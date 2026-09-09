import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { ListingCard } from "../components/ListingCard";
import { useAuth } from "../context/AuthContext";
import { apiClient } from "../api/client";
import type { Listing } from "../api/types";
import "./CategoryListingsPage.css";

const PLACEHOLDER_GRADIENTS = [
  "linear-gradient(135deg, #1e293b, #475569)",
  "linear-gradient(135deg, #0ea5e9, #7dd3fc)",
  "linear-gradient(135deg, #78350f, #b45309)",
  "linear-gradient(135deg, #292524, #57534e)",
];

const OWNER_ROLES = ["landlord", "agent", "hotel_manager", "admin"];

export function SavedListingsPage() {
  const { user } = useAuth();
  const [saved, setSaved] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const isOwnerRole = user ? OWNER_ROLES.includes(user.role) : false;

  useEffect(() => {
    if (!user || !isOwnerRole) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;

    apiClient
      .get<Listing[]>("/saved-listings")
      .then((data) => {
        if (!cancelled) setSaved(data);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Couldn't load your saved listings right now.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, isOwnerRole]);

  return (
    <div className="category-page">
      <Navbar />

      <section className="category-hero">
        <div className="category-hero__overlay" />
        <div className="category-hero__content">
          <h1>Saved Listings</h1>
          <p>Everything you've bookmarked, in one place.</p>
        </div>
      </section>

      <div className="category-body">
        {!user && (
          <p className="category-status">
            Log in to see your saved listings.{" "}
            <Link to="/login" state={{ redirectTo: "/saved" }} className="category-status__reset">
              Log in
            </Link>
          </p>
        )}

        {user && !isOwnerRole && (
          <p className="category-status">
            Saved Listings is available for landlord, agent, and hotel manager accounts. Your
            account role is <strong>{user.role}</strong>.
          </p>
        )}

        {user && isOwnerRole && isLoading && <p className="category-status">Loading your saved listings…</p>}

        {user && isOwnerRole && !isLoading && loadError && (
          <p className="category-status category-status--error">{loadError}</p>
        )}

        {user && isOwnerRole && !isLoading && !loadError && saved.length === 0 && (
          <p className="category-status">
            You haven't saved any listings yet.{" "}
            <Link to="/explore" className="category-status__reset">
              Browse listings
            </Link>
          </p>
        )}

        {user && isOwnerRole && !isLoading && !loadError && saved.length > 0 && (
          <div className="category-grid">
            {saved.map((listing, index) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                gradient={PLACEHOLDER_GRADIENTS[index % PLACEHOLDER_GRADIENTS.length]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
