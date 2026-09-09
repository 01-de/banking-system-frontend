import { useCallback, useRef, useState } from "react";
import type { Stripe, StripeElements } from "@stripe/stripe-js";
import { createPaymentOrder, getPaymentStatus } from "../api/payments";
import { ApiError } from "../api/client";
import type { PaymentOrderResponse, PaymentStatusResponse } from "../types/banking";

export type PaymentStage =
  | "idle"
  | "creating_order"
  | "confirming_with_stripe"
  | "polling_status"
  | "completed"
  | "failed"
  | "rate_limited"
  | "forbidden"
  | "error";

interface PaymentState {
  stage: PaymentStage;
  order: PaymentOrderResponse | null;
  finalPayment: PaymentStatusResponse | null;
  errorMessage: string | null;
}

interface StartPaymentArgs {
  accountNumber: string;
  amount: number;
  description?: string;
  stripe: Stripe;
  elements: StripeElements;
  returnUrl: string;
}

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 15;

export function usePayment() {
  const [state, setState] = useState<PaymentState>({
    stage: "idle",
    order: null,
    finalPayment: null,
    errorMessage: null,
  });
  const pollCancelRef = useRef(false);

  const reset = useCallback(() => {
    pollCancelRef.current = true;
    setState({ stage: "idle", order: null, finalPayment: null, errorMessage: null });
  }, []);

  const pollForFinalStatus = useCallback(async (paymentId: string) => {
    pollCancelRef.current = false;
    setState((prev) => ({ ...prev, stage: "polling_status" }));

    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
      if (pollCancelRef.current) return;

      try {
        const payment = await getPaymentStatus(paymentId);
        if (payment.status === "COMPLETED") {
          setState((prev) => ({ ...prev, stage: "completed", finalPayment: payment }));
          return;
        }
        if (payment.status === "FAILED") {
          setState((prev) => ({
            ...prev,
            stage: "failed",
            finalPayment: payment,
            errorMessage: payment.failureReason,
          }));
          return;
        }
      } catch (err: unknown) {
        if (err instanceof ApiError && err.isForbidden) {
          setState((prev) => ({ ...prev, stage: "forbidden", errorMessage: null }));
          return;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }

    setState((prev) => ({
      ...prev,
      stage: "error",
      errorMessage:
        "Still processing — this can take a bit longer. Check your activity feed shortly.",
    }));
  }, []);

  const startPayment = useCallback(
    async (args: StartPaymentArgs) => {
      setState({ stage: "creating_order", order: null, finalPayment: null, errorMessage: null });

      let order: PaymentOrderResponse;
      try {
        order = await createPaymentOrder({
          accountNumber: args.accountNumber,
          amount: args.amount,
          description: args.description,
        });
        setState((prev) => ({ ...prev, order }));
      } catch (err: unknown) {
        if (err instanceof ApiError && err.isRateLimited) {
          setState({
            stage: "rate_limited",
            order: null,
            finalPayment: null,
            errorMessage: "Too many requests — please wait a moment and try again.",
          });
        } else if (err instanceof ApiError && err.isForbidden) {
          setState({ stage: "forbidden", order: null, finalPayment: null, errorMessage: null });
        } else {
          setState({
            stage: "error",
            order: null,
            finalPayment: null,
            errorMessage: err instanceof ApiError ? err.message : "Couldn't start the payment.",
          });
        }
        return;
      }

      setState((prev) => ({ ...prev, stage: "confirming_with_stripe" }));
      const { error: stripeError, paymentIntent } = await args.stripe.confirmPayment({
        elements: args.elements,
        clientSecret: order.clientSecret,
        confirmParams: { return_url: args.returnUrl },
        redirect: "if_required",
      });

      if (stripeError) {
        setState((prev) => ({
          ...prev,
          stage: "failed",
          errorMessage: stripeError.message ?? "Card was declined.",
        }));
        return;
      }

      void paymentIntent;
      await pollForFinalStatus(order.paymentId);
    },
    [pollForFinalStatus]
  );

  return {
    stage: state.stage,
    order: state.order,
    finalPayment: state.finalPayment,
    errorMessage: state.errorMessage,
    startPayment,
    reset,
  };
}
