import { apiClient } from "./client";

export type PaymentProvider = "mtn_momo" | "telecel_cash" | "bank";
export type PaymentStatus = "pending" | "successful" | "failed" | "refunded";

export interface Payment {
  id: string;
  bookingId: string;
  amount: string;
  platformFeeAmount: string;
  platformFeePercent: string;
  netAmount: string;
  currency: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  providerReference?: string;
  paidAt?: string;
  disbursementStatus?: PaymentStatus;
  disbursedAt?: string;
  createdAt: string;
}

export interface ManualTransferInstructions {
  ownerAmount: number;
  ownerBankName?: string;
  ownerAccountNumber?: string;
  ownerAccountName?: string;
  platformAmount: number;
  platformBankName?: string;
  platformAccountNumber?: string;
  platformAccountName?: string;
  currency: string;
}

export interface InitiatePaymentResponse {
  paymentId: string;
  reference: string;
  requiresPolling?: boolean;
  requiresManualTransfer?: boolean;
  instructions?: ManualTransferInstructions;
}

export async function initiatePayment(
  bookingId: string,
  provider: PaymentProvider,
  phoneNumber?: string
): Promise<InitiatePaymentResponse> {
  return apiClient.post<InitiatePaymentResponse>(`/bookings/${bookingId}/payments`, { provider, phoneNumber });
}

export async function getBookingPayment(bookingId: string): Promise<Payment | null> {
  return apiClient.get<Payment | null>(`/bookings/${bookingId}/payment`);
}

export async function verifyPayment(reference: string): Promise<Payment> {
  return apiClient.get<Payment>(`/payments/verify/${reference}`);
}
