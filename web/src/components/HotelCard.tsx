import { useNavigate } from "react-router-dom";
import type { Listing } from "../api/types";
import { StarRating } from "./StarRating";
import "./HotelCard.css";

const AMENITY_ICONS: Record<string, JSX.Element> = {
  wifi: (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 8.5a16 16 0 0 1 20 0M5.5 12a11 11 0 0 1 13 0M9 15.5a6 6 0 0 1 6 0M12 19h.01" />
    </svg>
  ),
  pool: (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 18c1.5-1 3-1 4.5 0s3 1 4.5 0 3-1 4.5 0 3 1 4.5 0M4 14V6a2 2 0 0 1 2-2h5l7 7" />
    </svg>
  ),
  breakfast: (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 10h14a4 4 0 0 1 0 8H3v-8ZM3 10a7 7 0 0 1 13-4M3 21h18" />
    </svg>
  ),
  parking: (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
    </svg>
  ),
  gym: (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 7v10M18 7v10M2 12h3M19 12h3M6 12h12" />
    </svg>
  ),
  spa: (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3c2 2 3 4 3 6a3 3 0 0 1-6 0c0-2 1-4 3-6ZM5 14c1.5 1 2.5 2.5 2.5 4.5M19 14c-1.5 1-2.5 2.5-2.5 4.5M12 12v9" />
    </svg>
  ),
  shuttle: (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 16V8a2 2 0 0 1 2-2h9l4 4v6H3Z" />
      <circle cx="7.5" cy="18" r="1.5" />
      <circle cx="16.5" cy="18" r="1.5" />
    </svg>
  ),
};

function amenityIcon(name: string) {
  const key = name.toLowerCase().replace(/[^a-z]/g, "");
  const matchKey = Object.keys(AMENITY_ICONS).find((k) => key.includes(k));
  return matchKey ? AMENITY_ICONS[matchKey] : null;
}

interface HotelCardProps {
  listing: Listing;
  gradient: string;
  badge?: { label: string; color: string };
}

export function HotelCard({ listing, gradient, badge }: HotelCardProps) {
  const navigate = useNavigate();
  const rating = parseFloat(listing.averageRating) || 0;
  const amenities = listing.hotelDetails?.amenities ?? [];
  const photoUrl = listing.media.find((m) => m.mediaType === "image")?.url;

  function goToDetail() {
    navigate(`/listings/${listing.id}`);
  }

  return (
    <div className="hotel-card" onClick={goToDetail} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && goToDetail()}>
      <div className="hotel-card__image" style={photoUrl ? undefined : { background: gradient }}>
        {photoUrl && <img src={photoUrl} alt={listing.title} className="hotel-card__photo" />}
        {badge && (
          <span className="hotel-card__badge" style={{ backgroundColor: badge.color }}>
            {badge.label}
          </span>
        )}
        <button className="hotel-card__save" type="button" aria-label="Save listing" onClick={(e) => e.stopPropagation()}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 21s-7.5-4.6-10-9.1C.6 8.4 2.4 5 6 5c2 0 3.6 1.1 4.5 2.4C11.4 6.1 13 5 15 5c3.6 0 5.4 3.4 4 6.9C19.5 16.4 12 21 12 21Z" />
          </svg>
        </button>
      </div>

      <div className="hotel-card__body">
        <StarRating rating={rating} />
        <p className="hotel-card__rating-text">
          {rating.toFixed(1)} <span>({listing.ratingCount})</span>
        </p>
        <p className="hotel-card__title">{listing.title}</p>
        <p className="hotel-card__location">{listing.address || "Location not specified"}</p>

        {amenities.length > 0 && (
          <div className="hotel-card__amenities">
            {amenities.slice(0, 4).map((a) => (
              <span key={a} className="hotel-card__amenity" title={a}>
                {amenityIcon(a)}
                {a}
              </span>
            ))}
          </div>
        )}

        <div className="hotel-card__footer">
          <p className="hotel-card__price">
            {listing.currency} {parseFloat(listing.price).toLocaleString()} <span>/ night</span>
          </p>
          <button className="hotel-card__book" type="button" onClick={(e) => { e.stopPropagation(); goToDetail(); }}>
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
}
