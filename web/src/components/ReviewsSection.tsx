import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getRatingsForListing, rateListing } from "../api/ratings";
import { ApiError } from "../api/apiError";
import type { Rating } from "../api/types";
import { StarRating } from "./StarRating";
import "./ReviewsSection.css";

interface ReviewsSectionProps {
  listingId: string;
}

export function ReviewsSection({ listingId }: ReviewsSectionProps) {
  const { user } = useAuth();

  const [ratings, setRatings] = useState<Rating[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getRatingsForListing(listingId)
      .then((data) => {
        if (!cancelled) setRatings(data);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  async function handleSubmitReview() {
    if (myRating < 1) {
      setSubmitError("Select a star rating first.");
      return;
    }
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await rateListing(listingId, myRating, myComment.trim() || undefined);
      setSubmitted(true);
      const updated = await getRatingsForListing(listingId);
      setRatings(updated);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Couldn't submit your review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="reviews-section">
      <h2>Reviews {ratings.length > 0 && `(${ratings.length})`}</h2>

      {isLoading && <p className="reviews-section__status">Loading reviews…</p>}

      {!isLoading && ratings.length === 0 && (
        <p className="reviews-section__status">No reviews yet — be the first to share your experience.</p>
      )}

      <div className="reviews-list">
        {ratings.map((r) => (
          <div className="review-item" key={r.id}>
            <div className="review-item__header">
              <span className="review-item__author">{r.user?.fullName ?? "Anonymous"}</span>
              <StarRating rating={r.rating} />
            </div>
            {r.comment && <p className="review-item__comment">{r.comment}</p>}
          </div>
        ))}
      </div>

      {user ? (
        !submitted ? (
          <div className="review-form">
            <p className="review-form__title">Leave a review</p>
            <div className="review-form__stars">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className="review-form__star-btn"
                  onClick={() => setMyRating(n)}
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="22"
                    height="22"
                    fill={n <= myRating ? "var(--color-star)" : "none"}
                    stroke={n <= myRating ? "none" : "var(--color-line)"}
                    strokeWidth="1.5"
                  >
                    <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7L5.8 21l1.6-7L2 9.2l7.1-.6L12 2Z" />
                  </svg>
                </button>
              ))}
            </div>
            <textarea
              placeholder="Share details of your experience (optional)"
              value={myComment}
              onChange={(e) => setMyComment(e.target.value)}
              rows={3}
            />
            {submitError && <p className="review-form__error">{submitError}</p>}
            <button
              className="review-form__submit"
              type="button"
              onClick={handleSubmitReview}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting…" : "Submit Review"}
            </button>
          </div>
        ) : (
          <p className="reviews-section__status reviews-section__status--success">
            Thanks — your review has been saved.
          </p>
        )
      ) : (
        <p className="reviews-section__status">Log in to leave a review.</p>
      )}
    </section>
  );
}
