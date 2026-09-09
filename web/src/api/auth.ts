import { apiClient, saveTokens, clearTokens, getAccessToken } from "./client";
import type { User, UserRole } from "./types";

interface SignupResponse {
  message: string;
  userId: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export async function signup(params: {
  fullName: string;
  phoneNumber: string;
  password: string;
  email?: string;
  role: UserRole;
}): Promise<string> {
  const response = await apiClient.post<SignupResponse>("/auth/signup", params, false);
  return response.userId;
}

export async function verifyOtp(userId: string, code: string): Promise<void> {
  await apiClient.post("/auth/verify-otp", { userId, code }, false);
}

export async function login(identifier: string, password: string): Promise<User> {
  const response = await apiClient.post<LoginResponse>(
    "/auth/login",
    { identifier, password },
    false
  );
  saveTokens(response.accessToken, response.refreshToken);
  return response.user;
}

export function logout(): void {
  clearTokens();
}

export function isLoggedIn(): boolean {
  return getAccessToken() !== null;
}
