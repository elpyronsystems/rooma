import { useNavigate } from "react-router-dom";

interface PropertyCardProps {
  id: string;
  badge?: { label: string; color: string };
  gradient: string;
  imageUrl?: string;
  title: string;
  rating: number;
  reviewCount: number;
  location: string;
  price: string;
  currency?: string;
}

export function PropertyCard({
  id,
  badge,
  gradient,
  imageUrl,
  title,
  rating,
  reviewCount,
  location,
  price,
  currency = "GHS",
}: PropertyCardProps) {
  const navigate = useNavigate();

  function goToDetail() {
    navigate(`/listings/${id}`);
  }

  return (
    <div
      className="property-card"
      onClick={goToDetail}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && goToDetail()}
    >
      <div className="property-card__image" style={imageUrl ? undefined : { background: gradient }}>
        {imageUrl && <img src={imageUrl} alt={title} className="property-card__photo" />}
        {badge && (
          <span className="property-card__badge" style={{ backgroundColor: badge.color }}>
            {badge.label}
          </span>
        )}
        <button
          className="property-card__save"
          type="button"
          aria-label="Save listing"
          onClick={(e) => e.stopPropagation()}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 21s-7.5-4.6-10-9.1C.6 8.4 2.4 5 6 5c2 0 3.6 1.1 4.5 2.4C11.4 6.1 13 5 15 5c3.6 0 5.4 3.4 4 6.9C19.5 16.4 12 21 12 21Z" />
          </svg>
        </button>
      </div>
      <div className="property-card__body">
        <div className="property-card__title-row">
          <p className="property-card__title">{title}</p>
          <span className="property-card__rating">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="var(--color-star)">
              <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7L5.8 21l1.6-7L2 9.2l7.1-.6L12 2Z" />
            </svg>
            {rating.toFixed(1)}
            <span className="property-card__reviews">({reviewCount})</span>
          </span>
        </div>
        <p className="property-card__location">{location}</p>
        <p className="property-card__price">
          {currency} {price} <span>/ night</span>
        </p>
      </div>
    </div>
  );
}
