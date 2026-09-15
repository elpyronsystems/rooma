import { apiClient } from "./client";
import type { Booking } from "./types";

export interface CreateBookingParams {
  listingId: string;
  roomTypeId?: string;
  checkIn?: string;
  checkOut?: string;
  totalAmount: number;
  currency?: string;
}

export async function createBooking(params: CreateBookingParams): Promise<Booking> {
  return apiClient.post<Booking>("/bookings", params);
}

export async function getMyBookings(): Promise<Booking[]> {
  return apiClient.get<Booking[]>("/bookings/my");
}

export async function getOwnerBookings(): Promise<Booking[]> {
  return apiClient.get<Booking[]>("/bookings/owner");
}

export async function confirmBooking(bookingId: string): Promise<Booking> {
  return apiClient.patch<Booking>(`/bookings/${bookingId}/confirm`);
}

export async function rejectBooking(bookingId: string): Promise<Booking> {
  return apiClient.patch<Booking>(`/bookings/${bookingId}/reject`);
}

export async function cancelBooking(bookingId: string): Promise<Booking> {
  return apiClient.patch<Booking>(`/bookings/${bookingId}/cancel`);
}
