import { X } from "lucide-react";

import { TransactionsList } from "./TransactionsList";
import type { TransactionResponse } from "@/types/banking";

interface NotificationsPanelProps {
  accountNumber: string;
  transactions: TransactionResponse[];
  isLoading: boolean;
  isForbidden?: boolean;
  error: string | null;
  onClose: () => void;
}

export function NotificationsPanel({
  accountNumber,
  transactions,
  isLoading,
  isForbidden,
  error,
  onClose,
}: NotificationsPanelProps) {
  const received = transactions.filter((tx) => tx.receiverAccountNumber === accountNumber);

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-12 z-50 max-h-96 w-80 overflow-y-auto rounded-card border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-medium">Money received</p>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-4">
          <TransactionsList
            accountNumber={accountNumber}
            transactions={received}
            isLoading={isLoading}
            isForbidden={isForbidden}
            error={error}
          />
        </div>
      </div>
    </>
  );
}
