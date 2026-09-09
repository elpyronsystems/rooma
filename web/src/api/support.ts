import { apiClient } from "./client";

export type SupportCategory =
  | "finding_accommodation"
  | "booking"
  | "payment"
  | "my_account"
  | "property_listing"
  | "verification"
  | "report_a_problem"
  | "other";

export interface SubmitSupportMessageParams {
  fullName: string;
  email: string;
  phoneNumber?: string;
  category: SupportCategory;
  subject: string;
  message: string;
}

export async function submitSupportMessage(params: SubmitSupportMessageParams): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>("/support", params, false);
}
