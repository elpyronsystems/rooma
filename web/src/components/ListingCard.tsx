import { useNavigate } from "react-router-dom";
import type { Listing } from "../api/types";
import "./ListingCard.css";

interface ListingCardProps {
  listing: Listing;
  gradient: string;
}

function detailLine(listing: Listing): string | null {
  if (listing.type === "hostel" && listing.hostelDetails) {
    const parts: string[] = [];
    if (listing.hostelDetails.roomType) parts.push(listing.hostelDetails.roomType);
    if (listing.hostelDetails.capacity) parts.push(`${listing.hostelDetails.capacity} capacity`);
    if (listing.hostelDetails.distanceToCampusKm) {
      parts.push(`${listing.hostelDetails.distanceToCampusKm}km from campus`);
    }
    return parts.join(" · ") || null;
  }

  if (listing.type === "rental" && listing.rentalDetails) {
    const parts: string[] = [];
    if (listing.rentalDetails.bedrooms !== undefined) parts.push(`${listing.rentalDetails.bedrooms} bed`);
    if (listing.rentalDetails.bathrooms !== undefined) parts.push(`${listing.rentalDetails.bathrooms} bath`);
    if (listing.rentalDetails.leaseTerm) parts.push(listing.rentalDetails.leaseTerm);
    return parts.join(" · ") || null;
  }

  if (listing.type === "sale" && listing.saleDetails) {
    const parts: string[] = [];
    if (listing.saleDetails.bedrooms !== undefined) parts.push(`${listing.saleDetails.bedrooms} bed`);
    if (listing.saleDetails.bathrooms !== undefined) parts.push(`${listing.saleDetails.bathrooms} bath`);
    if (listing.saleDetails.landSizeSqm) parts.push(`${listing.saleDetails.landSizeSqm}m² land`);
    return parts.join(" · ") || null;
  }

  return null;
}

export function ListingCard({ listing, gradient }: ListingCardProps) {
  const navigate = useNavigate();
  const rating = parseFloat(listing.averageRating) || 0;
  const detail = detailLine(listing);
  const isSale = listing.type === "sale";
  const photoUrl = listing.media.find((m) => m.mediaType === "image")?.url;

  return (
    <div
      className="listing-card"
      onClick={() => navigate(`/listings/${listing.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") navigate(`/listings/${listing.id}`);
      }}
    >
      <div className="listing-card__image" style={photoUrl ? undefined : { background: gradient }}>
        {photoUrl && <img src={photoUrl} alt={listing.title} className="listing-card__photo" />}
        {listing.type === "sale" && listing.saleDetails?.ownershipVerified && (
          <span className="listing-card__verified">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M5 13l4 4L19 7" />
            </svg>
            Verified
          </span>
        )}
        <button
          className="listing-card__save"
          type="button"
          aria-label="Save listing"
          onClick={(e) => e.stopPropagation()}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 21s-7.5-4.6-10-9.1C.6 8.4 2.4 5 6 5c2 0 3.6 1.1 4.5 2.4C11.4 6.1 13 5 15 5c3.6 0 5.4 3.4 4 6.9C19.5 16.4 12 21 12 21Z" />
          </svg>
        </button>
      </div>

      <div className="listing-card__body">
        <div className="listing-card__title-row">
          <p className="listing-card__title">{listing.title}</p>
          {rating > 0 && (
            <span className="listing-card__rating">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="var(--color-star)">
                <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7L5.8 21l1.6-7L2 9.2l7.1-.6L12 2Z" />
              </svg>
              {rating.toFixed(1)}
            </span>
          )}
        </div>

        <p className="listing-card__location">{listing.address || "Location not specified"}</p>
        {detail && <p className="listing-card__detail">{detail}</p>}

        <div className="listing-card__footer">
          <p className="listing-card__price">
            {listing.currency} {parseFloat(listing.price).toLocaleString()}
            {!isSale && <span> / {listing.type === "hotel" ? "night" : "month"}</span>}
          </p>
          {listing.priceNegotiable && <span className="listing-card__negotiable">Negotiable</span>}
        </div>
      </div>
    </div>
  );
}
