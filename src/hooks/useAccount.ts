import { useCallback, useEffect, useState } from "react";
import { blockAccount, getAccount, unblockAccount } from "../api/accounts";
import { ApiError } from "../api/client";
import type { AccountResponse } from "../types/banking";

interface UseAccountResult {
  account: AccountResponse | null;
  isLoading: boolean;
  isRateLimited: boolean;
  isForbidden: boolean;
  error: string | null;
  refresh: () => void;
  blockThisAccount: () => Promise<void>;
  isBlocking: boolean;
  unblockThisAccount: () => Promise<void>;
  isUnblocking: boolean;
}

export function useAccount(accountNumber: string | null): UseAccountResult {
  const [account, setAccount] = useState<AccountResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [isForbidden, setIsForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBlocking, setIsBlocking] = useState(false);
  const [isUnblocking, setIsUnblocking] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    if (!accountNumber) return;
    const controller = new AbortController();

    setIsLoading(true);
    setError(null);
    setIsRateLimited(false);
    setIsForbidden(false);

    getAccount(accountNumber)
      .then((data) => setAccount(data))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError) {
          setIsRateLimited(err.isRateLimited);
          setIsForbidden(err.isForbidden);
          setError(err.isRateLimited || err.isForbidden ? null : err.message);
        } else {
          setError("Something went wrong loading this account.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [accountNumber, refreshTick]);

  const refresh = useCallback(() => setRefreshTick((t) => t + 1), []);

  const blockThisAccount = useCallback(async () => {
    if (!accountNumber) return;
    setIsBlocking(true);
    setError(null);
    try {
      await blockAccount(accountNumber);
      refresh();
    } catch (err: unknown) {
      setError(
        err instanceof ApiError ? err.message : "Couldn't block the account."
      );
    } finally {
      setIsBlocking(false);
    }
  }, [accountNumber, refresh]);

  const unblockThisAccount = useCallback(async () => {
    if (!accountNumber) return;
    setIsUnblocking(true);
    setError(null);
    try {
      await unblockAccount(accountNumber);
      refresh();
    } catch (err: unknown) {
      setError(
        err instanceof ApiError ? err.message : "Couldn't unblock the account."
      );
    } finally {
      setIsUnblocking(false);
    }
  }, [accountNumber, refresh]);

  return {
    account,
    isLoading,
    isRateLimited,
    isForbidden,
    error,
    refresh,
    blockThisAccount,
    isBlocking,
    unblockThisAccount,
    isUnblocking,
  };
}
