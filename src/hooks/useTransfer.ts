import { useCallback, useRef, useState } from "react";
import { getTransaction, transfer, verifyTransaction } from "../api/transactions";
import { ApiError } from "../api/client";
import type { TransactionResponse } from "../types/banking";

export type TransferStage =
  | "idle"
  | "submitting"
  | "polling_status"
  | "awaiting_otp"
  | "verifying_otp"
  | "completed"
  | "flagged"
  | "failed"
  | "rate_limited"
  | "forbidden"
  | "error";

interface TransferState {
  stage: TransferStage;
  transaction: TransactionResponse | null;
  errorMessage: string | null;
}

interface SubmitTransferArgs {
  senderAccountNumber: string;
  receiverAccountNumber: string;
  amount: number;
  description: string;
}

const POLL_INTERVAL_MS = 1500;
const MAX_POLL_ATTEMPTS = 15;

type SettledStage = "completed" | "awaiting_otp" | "flagged" | "failed";

function resolveSettledStage(tx: TransactionResponse): SettledStage | null {
  switch (tx.status) {
    case "COMPLETED":
      return "completed";
    case "PENDING_VERIFICATION":
      return "awaiting_otp";
    case "FLAGGED":
      return "flagged";
    case "FAILED":
      return "failed";
    default:
      return null;
  }
}

export function useTransfer() {
  const [state, setState] = useState<TransferState>({
    stage: "idle",
    transaction: null,
    errorMessage: null,
  });
  const pollCancelRef = useRef(false);

  const reset = useCallback(() => {
    pollCancelRef.current = true;
    setState({ stage: "idle", transaction: null, errorMessage: null });
  }, []);

  const pollUntilSettled = useCallback(async (transactionId: string) => {
    pollCancelRef.current = false;
    setState((prev) => ({ ...prev, stage: "polling_status" }));

    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
      if (pollCancelRef.current) return;

      try {
        const tx = await getTransaction(transactionId);
        const settled = resolveSettledStage(tx);
        if (settled) {
          setState({
            stage: settled,
            transaction: tx,
            errorMessage: settled === "failed" || settled === "flagged" ? tx.failureReason : null,
          });
          return;
        }
      } catch (err: unknown) {
        if (err instanceof ApiError && err.isForbidden) {
          setState({ stage: "forbidden", transaction: null, errorMessage: null });
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

  const submitTransfer = useCallback(
    async (args: SubmitTransferArgs) => {
      setState({ stage: "submitting", transaction: null, errorMessage: null });
      try {
        const tx = await transfer(args);
        const settled = resolveSettledStage(tx);
        if (settled) {
          setState({
            stage: settled,
            transaction: tx,
            errorMessage: settled === "failed" ? tx.failureReason : null,
          });
        } else {
          setState({ stage: "submitting", transaction: tx, errorMessage: null });
          await pollUntilSettled(tx.id);
        }
      } catch (err: unknown) {
        if (err instanceof ApiError && err.isRateLimited) {
          setState({
            stage: "rate_limited",
            transaction: null,
            errorMessage: "Too many requests — please wait a moment and try again.",
          });
        } else if (err instanceof ApiError && err.isForbidden) {
          setState({ stage: "forbidden", transaction: null, errorMessage: null });
        } else {
          setState({
            stage: "error",
            transaction: null,
            errorMessage:
              err instanceof ApiError ? err.message : "Something went wrong.",
          });
        }
      }
    },
    [pollUntilSettled]
  );

  const submitOtp = useCallback(
    async (otp: string) => {
      const currentTx = state.transaction;
      if (!currentTx) return;

      setState((prev) => ({ ...prev, stage: "verifying_otp" }));
      try {
        const tx = await verifyTransaction(currentTx.id, otp);
        const settled = resolveSettledStage(tx);
        if (settled) {
          setState({
            stage: settled,
            transaction: tx,
            errorMessage: settled === "flagged" || settled === "failed" ? tx.failureReason : null,
          });
        } else {
          setState({ stage: "verifying_otp", transaction: tx, errorMessage: null });
          await pollUntilSettled(tx.id);
        }
      } catch (err: unknown) {
        if (err instanceof ApiError && err.isRateLimited) {
          setState((prev) => ({
            ...prev,
            stage: "rate_limited",
            errorMessage: "Too many requests — please wait a moment and try again.",
          }));
        } else if (err instanceof ApiError && err.isForbidden) {
          setState({ stage: "forbidden", transaction: null, errorMessage: null });
        } else {
          setState((prev) => ({
            ...prev,
            stage: "awaiting_otp",
            errorMessage:
              err instanceof ApiError ? err.message : "Couldn't verify that code.",
          }));
        }
      }
    },
    [state.transaction, pollUntilSettled]
  );

  return {
    stage: state.stage,
    transaction: state.transaction,
    errorMessage: state.errorMessage,
    submitTransfer,
    submitOtp,
    reset,
  };
}
