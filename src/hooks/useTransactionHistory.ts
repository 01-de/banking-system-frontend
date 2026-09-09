import { useEffect, useState } from "react";
import { getTransactionHistory } from "../api/transactions";
import { ApiError } from "../api/client";
import type { TransactionResponse } from "../types/banking";

interface UseTransactionHistoryResult {
  transactions: TransactionResponse[];
  isLoading: boolean;
  isRateLimited: boolean;
  isForbidden: boolean;
  error: string | null;
}

export function useTransactionHistory(
  accountNumber: string | null
): UseTransactionHistoryResult {
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [isForbidden, setIsForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountNumber) return;
    const controller = new AbortController();

    setIsLoading(true);
    setError(null);
    setIsRateLimited(false);
    setIsForbidden(false);

    getTransactionHistory(accountNumber)
      .then((data) => setTransactions(data))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError) {
          setIsRateLimited(err.isRateLimited);
          setIsForbidden(err.isForbidden);
          setError(err.isRateLimited || err.isForbidden ? null : err.message);
        } else {
          setError("Something went wrong loading transaction history.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [accountNumber]);

  return { transactions, isLoading, isRateLimited, isForbidden, error };
}
