import { Bell, LogOut } from "lucide-react";
import { useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useAccount } from "@/hooks/useAccount";
import { useTransactionHistory } from "@/hooks/useTransactionHistory";

import { BalanceCard } from "./BalanceCard";
import { NotificationsPanel } from "./NotificationsPanel";
import { ProfilePanel } from "./ProfilePanel";
import { QuickActions } from "./QuickActions";
import { TransactionsList } from "./TransactionsList";

interface DashboardProps {
  accountNumber: string;
  onTransfer?: () => void;
  onTopUp?: () => void;
  onSwitchAccount?: () => void;
}

export function Dashboard({ accountNumber, onTransfer, onTopUp, onSwitchAccount }: DashboardProps) {
  const { role, logout } = useAuth();
  const {
    account,
    isLoading,
    isRateLimited,
    isForbidden,
    error,
    blockThisAccount,
    isBlocking,
    unblockThisAccount,
    isUnblocking,
  } = useAccount(accountNumber);
  const history = useTransactionHistory(accountNumber);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 px-4 pb-16 pt-6">
      <header className="relative flex items-center justify-between">
        <button
          type="button"
          onClick={() => account && setShowProfile((v) => !v)}
          className="flex items-center gap-3 text-left"
          disabled={!account}
        >
          <Avatar name={account?.accountHolderName ?? accountNumber} />
          <div>
            <p className="text-xs text-muted-foreground">Welcome back</p>
            <p className="text-sm font-medium">
              {account?.accountHolderName ?? accountNumber}
            </p>
          </div>
        </button>

        {showProfile && account && (
          <ProfilePanel account={account} onClose={() => setShowProfile(false)} />
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowNotifications((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell size={18} />
          </button>
          <button
            type="button"
            onClick={() => void logout()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
            aria-label="Log out"
          >
            <LogOut size={18} />
          </button>
        </div>

        {showNotifications && (
          <NotificationsPanel
            accountNumber={accountNumber}
            transactions={history.transactions}
            isLoading={history.isLoading}
            isForbidden={history.isForbidden}
            error={history.error}
            onClose={() => setShowNotifications(false)}
          />
        )}
      </header>

      {isLoading && (
        <Skeleton className="h-44 w-full rounded-card" />
      )}

      {!isLoading && isRateLimited && (
        <Card>
          <CardContent className="p-5 text-sm text-warning">
            Too many requests — retrying shortly…
          </CardContent>
        </Card>
      )}

      {!isLoading && isForbidden && (
        <Card>
          <CardContent className="p-5 text-sm text-muted-foreground">
            You don't have access to this account.
          </CardContent>
        </Card>
      )}

      {!isLoading && error && (
        <Card>
          <CardContent className="p-5 text-sm text-danger">{error}</CardContent>
        </Card>
      )}

      {!isLoading && account && (
        <BalanceCard
          account={account}
          role={role}
          onBlock={blockThisAccount}
          isBlocking={isBlocking}
          onUnblock={unblockThisAccount}
          isUnblocking={isUnblocking}
        />
      )}

      <QuickActions
        role={role}
        onTransfer={onTransfer}
        onTopUp={onTopUp}
        onMore={onSwitchAccount}
      />

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <TransactionsList
            accountNumber={accountNumber}
            transactions={history.transactions}
            isLoading={history.isLoading}
            isForbidden={history.isForbidden}
            error={history.error}
          />
        </CardContent>
      </Card>
    </div>
  );
}
