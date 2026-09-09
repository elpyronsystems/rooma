import { apiClient } from "./client";
import type { Listing } from "./types";

export interface SearchListingsParams {
  type?: "hostel" | "hotel" | "rental" | "sale";
  minPrice?: number;
  maxPrice?: number;
  universityId?: string;
  search?: string;
}

export async function searchListings(params: SearchListingsParams = {}): Promise<Listing[]> {
  const query = new URLSearchParams();
  if (params.type) query.set("type", params.type);
  if (params.minPrice !== undefined) query.set("minPrice", String(params.minPrice));
  if (params.maxPrice !== undefined) query.set("maxPrice", String(params.maxPrice));
  if (params.universityId) query.set("universityId", params.universityId);
  if (params.search) query.set("search", params.search);

  const queryString = query.toString();
  return apiClient.get<Listing[]>(`/listings${queryString ? `?${queryString}` : ""}`, false);
}

export interface CreateListingParams {
  type: "hostel" | "hotel" | "rental" | "sale";
  title: string;
  description?: string;
  price: number;
  currency?: string;
  priceNegotiable?: boolean;
  address?: string;
  latitude?: number;
  longitude?: number;
  hostelDetails?: { roomType?: string; capacity?: number; distanceToCampusKm?: number };
  hotelDetails?: { starRating?: number; amenities?: string[] };
  rentalDetails?: { bedrooms?: number; bathrooms?: number; leaseTerm?: string; furnished?: boolean };
  saleDetails?: { bedrooms?: number; bathrooms?: number; landSizeSqm?: number };
}

export async function createListing(params: CreateListingParams): Promise<Listing> {
  return apiClient.post<Listing>("/listings", params);
}

export async function getListing(id: string): Promise<Listing> {
  return apiClient.get<Listing>(`/listings/${id}`, false);
}

export async function getMyListings(): Promise<Listing[]> {
  return apiClient.get<Listing[]>("/listings/mine");
}

export interface UpdateListingParams {
  title?: string;
  description?: string;
  price?: number;
  currency?: string;
  priceNegotiable?: boolean;
  address?: string;
  status?: "draft" | "pending_review" | "active" | "inactive" | "archived";
  hostelDetails?: { roomType?: string; capacity?: number; distanceToCampusKm?: number };
  hotelDetails?: { starRating?: number; amenities?: string[] };
  rentalDetails?: { bedrooms?: number; bathrooms?: number; leaseTerm?: string; furnished?: boolean };
  saleDetails?: { bedrooms?: number; bathrooms?: number; landSizeSqm?: number };
}

export async function updateListing(id: string, params: UpdateListingParams): Promise<Listing> {
  return apiClient.patch<Listing>(`/listings/${id}`, params);
}
