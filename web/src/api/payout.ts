import { apiClient } from "./client";

export interface PayoutSettings {
  payoutMethod?: "mtn_momo" | "telecel_cash" | "bank" | "";
  payoutMomoNumber?: string;
  payoutBankName?: string;
  payoutBankAccountNumber?: string;
  payoutBankAccountName?: string;
}

export async function getMyPayoutSettings(): Promise<PayoutSettings> {
  return apiClient.get<PayoutSettings>("/payout/me");
}

export async function updateMyPayoutSettings(params: PayoutSettings): Promise<PayoutSettings> {
  return apiClient.patch<PayoutSettings>("/payout/me", params);
}

export async function getPlatformPayoutSettings(): Promise<PayoutSettings> {
  return apiClient.get<PayoutSettings>("/admin/payout-settings");
}

export async function updatePlatformPayoutSettings(params: PayoutSettings): Promise<PayoutSettings> {
  return apiClient.patch<PayoutSettings>("/admin/payout-settings", params);
}
