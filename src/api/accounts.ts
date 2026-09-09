import { apiFetch } from "./client";
import type { AccountResponse, CreateAccountRequest } from "../types/banking";

const BASE = "/api/v1/accounts";

export function createAccount(
  payload: CreateAccountRequest
): Promise<AccountResponse> {
  return apiFetch<AccountResponse>(BASE, { method: "POST", body: payload });
}

export function getMyAccounts(): Promise<AccountResponse[]> {
  return apiFetch<AccountResponse[]>(BASE);
}

export function getAccount(accountNumber: string): Promise<AccountResponse> {
  return apiFetch<AccountResponse>(`${BASE}/${accountNumber}`);
}

export function getAccountBalance(accountNumber: string): Promise<number> {
  return apiFetch<number>(`${BASE}/${accountNumber}/balance`);
}

export function blockAccount(accountNumber: string): Promise<string> {
  return apiFetch<string>(`${BASE}/${accountNumber}/block`, { method: "PUT" });
}

export function unblockAccount(accountNumber: string): Promise<string> {
  return apiFetch<string>(`${BASE}/${accountNumber}/unblock`, { method: "PUT" });
}
