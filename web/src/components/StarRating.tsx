interface StarRatingProps {
  rating: number;
}

export function StarRating({ rating }: StarRatingProps) {
  const rounded = Math.round(rating);
  return (
    <span className="star-rating" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          width="13"
          height="13"
          fill={i < rounded ? "var(--color-star)" : "none"}
          stroke={i < rounded ? "none" : "var(--color-line)"}
          strokeWidth="1.5"
        >
          <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7L5.8 21l1.6-7L2 9.2l7.1-.6L12 2Z" />
        </svg>
      ))}
    </span>
  );
}
