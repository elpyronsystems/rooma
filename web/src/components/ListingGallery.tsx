import { useState } from "react";
import type { ListingMedia } from "../api/types";
import "./ListingGallery.css";

const FALLBACK_GRADIENT = "linear-gradient(135deg, #1e293b, #2563eb)";

interface ListingGalleryProps {
  media: ListingMedia[];
}

export function ListingGallery({ media }: ListingGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (media.length === 0) {
    return (
      <div className="listing-gallery listing-gallery--empty" style={{ background: FALLBACK_GRADIENT }}>
        <span className="listing-gallery__placeholder-note">No photos uploaded yet for this listing</span>
      </div>
    );
  }

  const active = media[Math.min(activeIndex, media.length - 1)];

  return (
    <div className="listing-gallery">
      <div className="listing-gallery__main">
        {active.mediaType === "video" ? (
          <video src={active.url} controls className="listing-gallery__media" />
        ) : (
          <img src={active.url} alt="Listing photo" className="listing-gallery__media" />
        )}
      </div>

      {media.length > 1 && (
        <div className="listing-gallery__thumbs">
          {media.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={`listing-gallery__thumb${index === activeIndex ? " listing-gallery__thumb--active" : ""}`}
              onClick={() => setActiveIndex(index)}
              aria-label={`View photo ${index + 1}`}
            >
              {item.mediaType === "video" ? (
                <video src={item.url} className="listing-gallery__thumb-media" />
              ) : (
                <img src={item.url} alt="" className="listing-gallery__thumb-media" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
