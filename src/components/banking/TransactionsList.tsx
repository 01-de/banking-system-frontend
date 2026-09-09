import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpRight,
  CreditCard,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatTransactionDate } from "@/lib/format";
import type { TransactionResponse, TransactionStatus } from "@/types/banking";

interface TransactionsListProps {
  accountNumber: string;
  transactions: TransactionResponse[];
  isLoading: boolean;
  isForbidden?: boolean;
  error: string | null;
}

const typeIcon: Record<TransactionResponse["type"], LucideIcon> = {
  DEPOSIT: ArrowDownToLine,
  WITHDRAW: ArrowUpRight,
  PAYMENT: CreditCard,
  TRANSFER: ArrowLeftRight,
};

const statusBadge: Partial<Record<TransactionStatus, { label: string; variant: "warning" | "danger" }>> = {
  PENDING: { label: "Pending", variant: "warning" },
  PROCESSING: { label: "Processing", variant: "warning" },
  PENDING_VERIFICATION: { label: "Verify", variant: "warning" },
  FLAGGED: { label: "Flagged", variant: "danger" },
  FAILED: { label: "Failed", variant: "danger" },
};

function TransactionRow({
  transaction,
  accountNumber,
}: {
  transaction: TransactionResponse;
  accountNumber: string;
}) {
  const isIncoming = transaction.receiverAccountNumber === accountNumber;
  const Icon = typeIcon[transaction.type];
  const badge = statusBadge[transaction.status];
  const counterparty = isIncoming
    ? transaction.senderAccountNumber
    : transaction.receiverAccountNumber;

  return (
    <div className="flex items-center gap-3 py-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
        <Icon size={16} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{transaction.description}</p>
          {badge && (
            <Badge variant={badge.variant} className="shrink-0">
              {badge.label}
            </Badge>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {counterparty ? `${isIncoming ? "From" : "To"} ${counterparty}` : transaction.type}
          {" · "}
          {formatTransactionDate(transaction.createdAt)}
        </p>
      </div>

      <span
        className={`shrink-0 text-sm font-semibold tabular-nums ${
          isIncoming ? "text-success" : "text-foreground"
        }`}
      >
        {isIncoming ? "+" : "-"}
        {formatCurrency(transaction.amount)}
      </span>
    </div>
  );
}

export function TransactionsList({
  accountNumber,
  transactions,
  isLoading,
  isForbidden,
  error,
}: TransactionsListProps) {
  if (isLoading) {
    return (
      <div className="divide-y divide-border">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 py-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (isForbidden) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        You don't have access to this account's activity.
      </p>
    );
  }

  if (error) {
    return <p className="py-6 text-center text-sm text-danger">{error}</p>;
  }

  if (transactions.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No transactions yet.
      </p>
    );
  }

  return (
    <div className="divide-y divide-border">
      {transactions.map((tx) => (
        <TransactionRow key={tx.id} transaction={tx} accountNumber={accountNumber} />
      ))}
    </div>
  );
}
