import { apiClient } from "./client";

export async function saveListing(listingId: string): Promise<void> {
  await apiClient.post(`/saved-listings/${listingId}`);
}

export async function unsaveListing(listingId: string): Promise<void> {
  await apiClient.delete(`/saved-listings/${listingId}`);
}
