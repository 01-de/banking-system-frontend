import { apiFetch } from "./client";
import type {
  AuthResponse,
  LoginRequest,
  RefreshRequest,
  RegisterRequest,
} from "../types/auth";

const BASE = "/api/v1/auth";

export function register(payload: RegisterRequest): Promise<void> {
  return apiFetch<void>(`${BASE}/register`, { method: "POST", body: payload });
}

export function login(payload: LoginRequest): Promise<AuthResponse> {
  return apiFetch<AuthResponse>(`${BASE}/login`, { method: "POST", body: payload });
}

export function refresh(payload: RefreshRequest): Promise<AuthResponse> {
  return apiFetch<AuthResponse>(`${BASE}/refresh`, { method: "POST", body: payload });
}

export function logout(payload: RefreshRequest): Promise<void> {
  return apiFetch<void>(`${BASE}/logout`, { method: "POST", body: payload });
}
