import { apiClient } from "./client";
import type { Listing, UserRole } from "./types";

export interface AdminUser {
  id: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  role: UserRole;
  phoneVerified: boolean;
  isSuspended: boolean;
  createdAt: string;
}

export async function getUsers(): Promise<AdminUser[]> {
  return apiClient.get<AdminUser[]>("/admin/users");
}

export async function updateUser(
  id: string,
  params: { role?: UserRole; isSuspended?: boolean }
): Promise<AdminUser> {
  return apiClient.patch<AdminUser>(`/admin/users/${id}`, params);
}

export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete<void>(`/admin/users/${id}`);
}

export async function getAdminListings(status?: string): Promise<Listing[]> {
  return apiClient.get<Listing[]>(`/admin/listings${status ? `?status=${status}` : ""}`);
}

export interface SupportMessageAdmin {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  category: string;
  subject: string;
  message: string;
  resolved: boolean;
  createdAt: string;
}

export async function getSupportMessages(): Promise<SupportMessageAdmin[]> {
  return apiClient.get<SupportMessageAdmin[]>("/admin/support-messages");
}

export async function updateSupportMessage(id: string, resolved: boolean): Promise<SupportMessageAdmin> {
  return apiClient.patch<SupportMessageAdmin>(`/admin/support-messages/${id}`, { resolved });
}

export interface AdminDocument {
  id: string;
  listingId: string;
  docType: string;
  fileUrl: string;
  verified: boolean;
  verifiedBy?: string;
  uploadedAt: string;
  listing?: {
    id: string;
    title: string;
    type: string;
    owner?: { id: string; fullName: string; phoneNumber?: string };
  };
}

export async function getDocuments(verified?: boolean): Promise<AdminDocument[]> {
  const query = verified !== undefined ? `?verified=${verified}` : "";
  return apiClient.get<AdminDocument[]>(`/admin/documents${query}`);
}

export async function updateDocument(id: string, verified: boolean): Promise<AdminDocument> {
  return apiClient.patch<AdminDocument>(`/admin/documents/${id}`, { verified });
}

export interface AdminAnalytics {
  totalUsers: number;
  usersByRole: { role: string; count: number }[];
  totalListings: number;
  listingsByType: { type: string; count: number }[];
  listingsByStatus: { status: string; count: number }[];
  totalBookings: number;
  bookingsByStatus: { status: string; count: number }[];
  totalSupportMessages: number;
  unresolvedSupportMessages: number;
  signupsLast30Days: { date: string; count: number }[];
  bookingsLast30Days: { date: string; count: number }[];
}

export async function getAnalytics(): Promise<AdminAnalytics> {
  return apiClient.get<AdminAnalytics>("/admin/analytics");
}
