import { apiClient } from "./client";
import type { Rating } from "./types";

export async function getRatingsForListing(listingId: string): Promise<Rating[]> {
  return apiClient.get<Rating[]>(`/listings/${listingId}/ratings`, false);
}

export async function rateListing(
  listingId: string,
  rating: number,
  comment?: string
): Promise<{ averageRating: string; ratingCount: number }> {
  return apiClient.post(`/listings/${listingId}/ratings`, { rating, comment });
}

export async function deleteMyRating(listingId: string): Promise<void> {
  await apiClient.delete(`/listings/${listingId}/ratings`);
}
