import { Mail, Phone, X } from "lucide-react";

import { accountTypeLabel } from "@/lib/format";
import type { AccountResponse } from "@/types/banking";

interface ProfilePanelProps {
  account: AccountResponse;
  onClose: () => void;
}

export function ProfilePanel({ account, onClose }: ProfilePanelProps) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute left-0 top-12 z-50 w-72 rounded-card border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-medium">Profile</p>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex flex-col gap-3 p-4">
          <div>
            <p className="text-sm font-medium">{account.accountHolderName}</p>
            <p className="text-xs text-muted-foreground">
              {accountTypeLabel(account.accountType)} · {account.accountNumber}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail size={14} className="shrink-0 text-muted-foreground" />
            <span className="truncate">{account.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone size={14} className="shrink-0 text-muted-foreground" />
            <span className="truncate">{account.phone}</span>
          </div>
        </div>
      </div>
    </>
  );
}
