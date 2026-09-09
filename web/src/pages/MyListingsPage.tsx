import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { getMyListings, updateListing } from "../api/listings";
import { ApiError } from "../api/apiError";
import type { Listing } from "../api/types";
import "./CategoryListingsPage.css";
import "./MyListingsPage.css";

const OWNER_ROLES = ["landlord", "agent", "hotel_manager", "admin"];

export function MyListingsPage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const isOwnerRole = user ? OWNER_ROLES.includes(user.role) : false;

  useEffect(() => {
    if (!user || !isOwnerRole) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;

    getMyListings()
      .then((data) => {
        if (!cancelled) setListings(data);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Couldn't load your listings right now.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, isOwnerRole]);

  async function toggleStatus(listing: Listing) {
    setActionError(null);
    setActioningId(listing.id);
    const nextStatus = listing.status === "active" ? "inactive" : "active";
    try {
      const updated = await updateListing(listing.id, { status: nextStatus });
      setListings((prev) => prev.map((l) => (l.id === listing.id ? { ...l, status: updated.status } : l)));
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Couldn't update this listing.");
    } finally {
      setActioningId(null);
    }
  }

  return (
    <div className="category-page">
      <Navbar />

      <section className="category-hero">
        <div className="category-hero__overlay" />
        <div className="category-hero__content">
          <h1>My Listings</h1>
          <p>Manage everything you've posted on Rooma.</p>
        </div>
      </section>

      <div className="category-body">
        {!user && <p className="category-status">Log in to manage your listings.</p>}

        {user && !isOwnerRole && (
          <p className="category-status">
            This page is for landlords, agents, and hotel managers. Your account role is{" "}
            <strong>{user.role}</strong>.
          </p>
        )}

        {user && isOwnerRole && isLoading && <p className="category-status">Loading your listings…</p>}

        {user && isOwnerRole && !isLoading && loadError && (
          <p className="category-status category-status--error">{loadError}</p>
        )}

        {user && isOwnerRole && !isLoading && !loadError && listings.length === 0 && (
          <p className="category-status">
            You haven't created any listings yet.{" "}
            <Link to="/listings/new" className="category-status__reset">
              Create your first listing
            </Link>
          </p>
        )}

        {actionError && <p className="category-status category-status--error">{actionError}</p>}

        {user && isOwnerRole && !isLoading && !loadError && listings.length > 0 && (
          <div className="my-listings-table">
            {listings.map((listing) => (
              <div className="my-listing-row" key={listing.id}>
                <div className="my-listing-row__main">
                  <Link to={`/listings/${listing.id}`} className="my-listing-row__title">
                    {listing.title}
                  </Link>
                  <p className="my-listing-row__meta">
                    {listing.type.toUpperCase()} · {listing.currency} {parseFloat(listing.price).toLocaleString()}
                    {listing.address ? ` · ${listing.address}` : ""}
                  </p>
                </div>
                <div className="my-listing-row__side">
                  <span className={`my-listing-status my-listing-status--${listing.status}`}>
                    {listing.status.replace("_", " ")}
                  </span>
                  <Link to={`/listings/${listing.id}/edit`} className="my-listing-row__edit">
                    Edit
                  </Link>
                  {(listing.status === "active" || listing.status === "inactive") && (
                    <button
                      type="button"
                      className="my-listing-row__toggle"
                      disabled={actioningId === listing.id}
                      onClick={() => toggleStatus(listing)}
                    >
                      {listing.status === "active" ? "Deactivate" : "Activate"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
