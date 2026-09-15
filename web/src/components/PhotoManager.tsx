import { useState } from "react";
import { reorderListingMedia, setListingCoverMedia, deleteListingMedia } from "../api/media";
import { ApiError } from "../api/apiError";
import type { ListingMedia } from "../api/types";
import "./PhotoManager.css";

interface PhotoManagerProps {
  listingId: string;
  media: ListingMedia[];
  onChange: (media: ListingMedia[]) => void;
}

export function PhotoManager({ listingId, media, onChange }: PhotoManagerProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function persistOrder(newOrder: ListingMedia[]) {
    setIsSaving(true);
    setError(null);
    try {
      const updated = await reorderListingMedia(
        listingId,
        newOrder.map((m) => m.id)
      );
      onChange(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save the new order.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      return;
    }
    const reordered = [...media];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    setDragIndex(null);
    onChange(reordered); // optimistic update
    persistOrder(reordered);
  }

  async function handleSetCover(mediaId: string) {
    setBusyId(mediaId);
    setError(null);
    try {
      await setListingCoverMedia(listingId, mediaId);
      onChange(media.map((m) => ({ ...m, isCover: m.id === mediaId })));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't set cover photo.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(mediaId: string) {
    if (!window.confirm("Remove this photo?")) return;
    setBusyId(mediaId);
    setError(null);
    try {
      await deleteListingMedia(listingId, mediaId);
      onChange(media.filter((m) => m.id !== mediaId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't remove this photo.");
    } finally {
      setBusyId(null);
    }
  }

  if (media.length === 0) {
    return <p className="photo-manager__empty">No photos uploaded yet.</p>;
  }

  return (
    <div className="photo-manager">
      <p className="photo-manager__hint">
        Drag to reorder. The starred photo is the cover — the first one seekers see.
        {isSaving && " Saving…"}
      </p>
      {error && <div className="form-error">{error}</div>}

      <div className="photo-manager__grid">
        {media.map((item, index) => (
          <div
            key={item.id}
            className={`photo-manager__item${dragIndex === index ? " photo-manager__item--dragging" : ""}`}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(index)}
          >
            {item.mediaType === "video" ? (
              <video src={item.url} className="photo-manager__media" />
            ) : (
              <img src={item.url} alt="" className="photo-manager__media" />
            )}

            <button
              type="button"
              className={`photo-manager__star${item.isCover ? " photo-manager__star--active" : ""}`}
              onClick={() => handleSetCover(item.id)}
              disabled={busyId === item.id}
              aria-label={item.isCover ? "Cover photo" : "Set as cover photo"}
              title={item.isCover ? "Cover photo" : "Set as cover photo"}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill={item.isCover ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
                <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7L5.8 21l1.6-7L2 9.2l7.1-.6L12 2Z" />
              </svg>
            </button>

            <button
              type="button"
              className="photo-manager__remove"
              onClick={() => handleDelete(item.id)}
              disabled={busyId === item.id}
              aria-label="Remove photo"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
