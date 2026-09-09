import { ArrowDownToLine, ArrowUpRight, MoreHorizontal } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { Role } from "@/types/auth";

interface QuickAction {
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
}

interface QuickActionsProps {
  role: Role | null;
  onTransfer?: () => void;
  onTopUp?: () => void;
  onMore?: () => void;
}

export function QuickActions({ role, onTransfer, onTopUp, onMore }: QuickActionsProps) {
  const isCustomer = role === "CUSTOMER";

  const actions: QuickAction[] = [
    ...(isCustomer ? [{ label: "Transfer", icon: ArrowUpRight, onClick: onTransfer }] : []),
    ...(isCustomer ? [{ label: "Top up", icon: ArrowDownToLine, onClick: onTopUp }] : []),
    { label: "More", icon: MoreHorizontal, onClick: onMore },
  ];

  const colsClass =
    actions.length === 1
      ? "grid-cols-1"
      : actions.length === 2
        ? "grid-cols-2"
        : actions.length === 3
          ? "grid-cols-3"
          : "grid-cols-4";

  return (
    <div className={`grid gap-2 ${colsClass}`}>
      {actions.map(({ label, icon: Icon, onClick }) => (
        <button
          key={label}
          type="button"
          onClick={onClick}
          className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card py-4 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
            <Icon size={18} />
          </span>
          {label}
        </button>
      ))}
    </div>
  );
}
