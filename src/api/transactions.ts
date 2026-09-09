import { apiFetch } from "./client";
import type { TransactionResponse, TransferRequest } from "../types/banking";

const BASE = "/api/v1/transactions";

export function generateIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `idem-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function transfer(
  payload: Omit<TransferRequest, "idempotencyKey"> & { idempotencyKey?: string }
): Promise<TransactionResponse> {
  const body: TransferRequest = {
    ...payload,
    idempotencyKey: payload.idempotencyKey ?? generateIdempotencyKey(),
  };
  return apiFetch<TransactionResponse>(`${BASE}/transfer`, {
    method: "POST",
    body,
    retriesOn429: 3,
  });
}

export function getTransaction(
  transactionId: string
): Promise<TransactionResponse> {
  return apiFetch<TransactionResponse>(`${BASE}/${transactionId}`);
}

export function getTransactionHistory(
  accountNumber: string
): Promise<TransactionResponse[]> {
  return apiFetch<TransactionResponse[]>(`${BASE}/history/${accountNumber}`);
}

export function verifyTransaction(
  transactionId: string,
  otp: string
): Promise<TransactionResponse> {
  return apiFetch<TransactionResponse>(`${BASE}/${transactionId}/verify`, {
    method: "POST",
    params: { otp },
  });
}
