import { apiFetch } from "./client";
import type {
  CreatePaymentRequest,
  PaymentOrderResponse,
  PaymentStatusResponse,
} from "../types/banking";

const BASE = "/api/v1/payments";

export function createPaymentOrder(
  payload: CreatePaymentRequest
): Promise<PaymentOrderResponse> {
  return apiFetch<PaymentOrderResponse>(`${BASE}/create-order`, {
    method: "POST",
    body: payload,
    retriesOn429: 3,
  });
}

export function getPaymentStatus(
  paymentId: string
): Promise<PaymentStatusResponse> {
  return apiFetch<PaymentStatusResponse>(`${BASE}/${paymentId}`);
}
