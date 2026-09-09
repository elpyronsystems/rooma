import { apiClient } from "./client";

export interface ContactInfo {
  businessName?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactWhatsapp?: string;
}

export async function getMyContact(): Promise<ContactInfo> {
  return apiClient.get<ContactInfo>("/contact/me");
}

export async function updateMyContact(params: ContactInfo): Promise<ContactInfo> {
  return apiClient.patch<ContactInfo>("/contact/me", params);
}
