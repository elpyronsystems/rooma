import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { StarRating } from "../components/StarRating";
import { ListingGallery } from "../components/ListingGallery";
import { BookingPanel } from "../components/BookingPanel";
import { ReviewsSection } from "../components/ReviewsSection";
import { ContactCard } from "../components/ContactCard";
import { useAuth } from "../context/AuthContext";
import { getListing } from "../api/listings";
import { saveListing, unsaveListing } from "../api/savedListings";
import type { Listing } from "../api/types";
import "./ListingDetailPage.css";

function detailRows(listing: Listing): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];

  if (listing.type === "hostel" && listing.hostelDetails) {
    if (listing.hostelDetails.roomType) rows.push({ label: "Room type", value: listing.hostelDetails.roomType });
    if (listing.hostelDetails.capacity) rows.push({ label: "Capacity", value: `${listing.hostelDetails.capacity} people` });
    if (listing.hostelDetails.distanceToCampusKm)
      rows.push({ label: "Distance to campus", value: `${listing.hostelDetails.distanceToCampusKm} km` });
  }

  if (listing.type === "hotel" && listing.hotelDetails) {
    if (listing.hotelDetails.starRating) rows.push({ label: "Star rating", value: `${listing.hotelDetails.starRating} stars` });
  }

  if (listing.type === "rental" && listing.rentalDetails) {
    if (listing.rentalDetails.bedrooms !== undefined) rows.push({ label: "Bedrooms", value: String(listing.rentalDetails.bedrooms) });
    if (listing.rentalDetails.bathrooms !== undefined) rows.push({ label: "Bathrooms", value: String(listing.rentalDetails.bathrooms) });
    if (listing.rentalDetails.leaseTerm) rows.push({ label: "Lease term", value: listing.rentalDetails.leaseTerm });
    if (listing.rentalDetails.furnished !== undefined)
      rows.push({ label: "Furnished", value: listing.rentalDetails.furnished ? "Yes" : "No" });
  }

  if (listing.type === "sale" && listing.saleDetails) {
    if (listing.saleDetails.bedrooms !== undefined) rows.push({ label: "Bedrooms", value: String(listing.saleDetails.bedrooms) });
    if (listing.saleDetails.bathrooms !== undefined) rows.push({ label: "Bathrooms", value: String(listing.saleDetails.bathrooms) });
    if (listing.saleDetails.landSizeSqm) rows.push({ label: "Land size", value: `${listing.saleDetails.landSizeSqm} m²` });
    rows.push({ label: "Ownership verified", value: listing.saleDetails.ownershipVerified ? "Yes" : "Pending" });
  }

  return rows;
}

export function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    getListing(id)
      .then((data) => {
        if (!cancelled) setListing(data);
      })
      .catch(() => {
        if (!cancelled) setLoadError("This listing couldn't be found.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleToggleSave() {
    if (!id) return;
    if (!user) {
      setSaveError("Log in to save listings.");
      return;
    }
    setSaveError(null);
    try {
      if (isSaved) {
        await unsaveListing(id);
        setIsSaved(false);
      } else {
        await saveListing(id);
        setIsSaved(true);
      }
    } catch {
      setSaveError("Couldn't update saved listings right now.");
    }
  }

  if (isLoading) {
    return (
      <div className="listing-detail-page">
        <Navbar />
        <p className="listing-detail-page__status">Loading listing…</p>
      </div>
    );
  }

  if (loadError || !listing) {
    return (
      <div className="listing-detail-page">
        <Navbar />
        <div className="listing-detail-page__status">
          <p>{loadError ?? "This listing couldn't be found."}</p>
          <Link to="/explore" className="btn-primary--nav">
            Browse listings
          </Link>
        </div>
      </div>
    );
  }

  const rating = parseFloat(listing.averageRating) || 0;
  const rows = detailRows(listing);

  return (
    <div className="listing-detail-page">
      <Navbar />

      <ListingGallery media={listing.media} />

      <div className="listing-detail-body">
        <div className="listing-detail-main">
          <div className="listing-detail-header">
            <div>
              <span className="listing-detail-type-badge">{listing.type.toUpperCase()}</span>
              <h1>{listing.title}</h1>
              <p className="listing-detail-location">{listing.address || "Location not specified"}</p>
              {listing.ratingCount > 0 && (
                <div className="listing-detail-rating">
                  <StarRating rating={rating} />
                  <span>
                    {rating.toFixed(1)} ({listing.ratingCount} review{listing.ratingCount !== 1 ? "s" : ""})
                  </span>
                </div>
              )}
            </div>
            <button
              className={`listing-detail-save${isSaved ? " listing-detail-save--active" : ""}`}
              type="button"
              onClick={handleToggleSave}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
                <path d="M12 21s-7.5-4.6-10-9.1C.6 8.4 2.4 5 6 5c2 0 3.6 1.1 4.5 2.4C11.4 6.1 13 5 15 5c3.6 0 5.4 3.4 4 6.9C19.5 16.4 12 21 12 21Z" />
              </svg>
              {isSaved ? "Saved" : "Save"}
            </button>
          </div>
          {saveError && <p className="listing-detail-save-error">{saveError}</p>}

          {listing.description && (
            <div className="listing-detail-section">
              <h2>About this place</h2>
              <p>{listing.description}</p>
            </div>
          )}

          {rows.length > 0 && (
            <div className="listing-detail-section">
              <h2>Details</h2>
              <div className="listing-detail-facts">
                {rows.map((row) => (
                  <div className="listing-detail-fact" key={row.label}>
                    <span className="listing-detail-fact__label">{row.label}</span>
                    <span className="listing-detail-fact__value">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {listing.hotelDetails?.amenities && listing.hotelDetails.amenities.length > 0 && (
            <div className="listing-detail-section">
              <h2>Amenities</h2>
              <div className="listing-detail-amenities">
                {listing.hotelDetails.amenities.map((a) => (
                  <span key={a} className="listing-detail-amenity-chip">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          <ReviewsSection listingId={listing.id} />
        </div>

        <div className="listing-detail-sidebar">
          <BookingPanel listing={listing} />
          <ContactCard owner={listing.owner} />
        </div>
      </div>
    </div>
  );
}
