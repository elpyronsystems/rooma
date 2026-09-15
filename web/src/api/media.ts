import { getAccessToken, apiClient } from "./client";
import { ApiError } from "./apiError";
import type { ListingMedia } from "./types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

export async function uploadListingMedia(listingId: string, files: File[]): Promise<void> {
  const token = getAccessToken();
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const response = await fetch(`${BASE_URL}/listings/${listingId}/media`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message =
      data && typeof data === "object" && "error" in data && typeof data.error === "string"
        ? data.error
        : `Upload failed with status ${response.status}`;
    throw new ApiError(response.status, message);
  }
}

export async function reorderListingMedia(listingId: string, orderedIds: string[]): Promise<ListingMedia[]> {
  return apiClient.patch<ListingMedia[]>(`/listings/${listingId}/media/reorder`, { orderedIds });
}

export async function setListingCoverMedia(listingId: string, mediaId: string): Promise<void> {
  await apiClient.patch<void>(`/listings/${listingId}/media/${mediaId}/cover`);
}

export async function deleteListingMedia(listingId: string, mediaId: string): Promise<void> {
  await apiClient.delete<void>(`/listings/${listingId}/media/${mediaId}`);
}
