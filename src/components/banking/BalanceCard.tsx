import { Eye, EyeOff, Lock, Unlock } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { accountTypeLabel, formatCurrency } from "@/lib/format";
import type { Role } from "@/types/auth";
import type { AccountResponse } from "@/types/banking";

interface BalanceCardProps {
  account: AccountResponse;
  role: Role | null;
  onBlock?: () => void;
  isBlocking?: boolean;
  onUnblock?: () => void;
  isUnblocking?: boolean;
}

const statusVariant = {
  ACTIVE: "success",
  BLOCKED: "danger",
  CLOSED: "default",
} as const;

export function BalanceCard({
  account,
  role,
  onBlock,
  isBlocking,
  onUnblock,
  isUnblocking,
}: BalanceCardProps) {
  const [revealed, setRevealed] = useState(true);

  return (
    <div className="relative overflow-hidden rounded-card bg-gradient-to-br from-[#1c1d22] to-[#0b0b0d] p-6 text-white shadow-xl">
      <div
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-accent/30 blur-3xl"
        aria-hidden
      />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm text-white/60">{accountTypeLabel(account.accountType)} account</p>
          <p className="mt-0.5 font-mono text-sm text-white/40">
            {account.accountNumber}
          </p>
        </div>
        <Badge variant={statusVariant[account.status]}>{account.status}</Badge>
      </div>

      <div className="relative mt-6 flex items-end gap-2">
        <span className="text-4xl font-semibold tracking-tight tabular-nums">
          {revealed ? formatCurrency(account.balance) : "•••••••"}
        </span>
        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          className="mb-1.5 text-white/50 transition-colors hover:text-white"
          aria-label={revealed ? "Hide balance" : "Show balance"}
        >
          {revealed ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      <p className="relative mt-1 text-sm text-white/40">
        Daily limit {formatCurrency(account.dailyTransactionLimit)}
      </p>

      {role === "ADMIN" && account.status === "ACTIVE" && onBlock && (
        <div className="relative mt-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBlock}
            disabled={isBlocking}
            className="text-white/70 hover:bg-white/10 hover:text-white"
          >
            <Lock size={14} />
            {isBlocking ? "Blocking…" : "Freeze card"}
          </Button>
        </div>
      )}

      {role === "ADMIN" && account.status === "BLOCKED" && onUnblock && (
        <div className="relative mt-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onUnblock}
            disabled={isUnblocking}
            className="text-white/70 hover:bg-white/10 hover:text-white"
          >
            <Unlock size={14} />
            {isUnblocking ? "Unblocking…" : "Unblock account"}
          </Button>
        </div>
      )}
    </div>
  );
}
