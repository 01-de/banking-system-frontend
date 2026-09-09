import { useCallback, useEffect, useState } from "react";
import { ChevronRight, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { createAccount, getMyAccounts } from "@/api/accounts";
import { ApiError } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { accountTypeLabel, formatCurrency } from "@/lib/format";
import type { AccountResponse, AccountType } from "@/types/banking";

interface AccountPickerProps {
  onSelect: (accountNumber: string) => void;
}

const statusVariant = {
  ACTIVE: "success",
  BLOCKED: "danger",
  CLOSED: "default",
} as const;

interface CreateAccountFormProps {
  onCreated: (account: AccountResponse) => void;
  prefillName: string;
  prefillEmail: string;
  prefillPhone: string;
}

function CreateAccountForm({
  onCreated,
  prefillName,
  prefillEmail,
  prefillPhone,
}: CreateAccountFormProps) {
  const [accountHolderName, setAccountHolderName] = useState(prefillName);
  const [email, setEmail] = useState(prefillEmail);
  const [phone, setPhone] = useState(prefillPhone);
  const [accountType, setAccountType] = useState<AccountType>("SAVINGS");
  const [initialDeposit, setInitialDeposit] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsedDeposit = Number(initialDeposit);
    if (!parsedDeposit || parsedDeposit <= 0) {
      setError("Initial deposit must be a positive amount.");
      return;
    }
    setIsSubmitting(true);
    try {
      const account = await createAccount({
        accountHolderName: accountHolderName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        accountType,
        initialDeposit: parsedDeposit,
      });
      onCreated(account);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Couldn't create the account.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Input
        value={accountHolderName}
        onChange={(e) => setAccountHolderName(e.target.value)}
        placeholder="Account holder name"
        disabled={isSubmitting}
        required
      />
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        disabled={isSubmitting}
        required
      />
      <Input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Phone"
        disabled={isSubmitting}
        required
      />
      <select
        value={accountType}
        onChange={(e) => setAccountType(e.target.value as AccountType)}
        disabled={isSubmitting}
        className="h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm outline-none focus:border-accent"
      >
        <option value="SAVINGS">Savings</option>
        <option value="CURRENT">Current</option>
        <option value="FIXED_DEPOSIT">Fixed Deposit</option>
      </select>
      <Input
        type="number"
        min="0.01"
        step="0.01"
        value={initialDeposit}
        onChange={(e) => setInitialDeposit(e.target.value)}
        placeholder="Initial deposit"
        disabled={isSubmitting}
        required
      />

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? "Creating…" : "Create account"}
      </Button>
    </form>
  );
}

function AdminLookup({ onSelect }: { onSelect: (accountNumber: string) => void }) {
  const [draft, setDraft] = useState("");
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (draft.trim()) onSelect(draft.trim());
      }}
    >
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Account number"
      />
      <Button type="submit" variant="outline">
        Look up account
      </Button>
    </form>
  );
}

export function AccountPicker({ onSelect }: AccountPickerProps) {
  const { role, email, phone, logout } = useAuth();
  const [accounts, setAccounts] = useState<AccountResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showAdminLookup, setShowAdminLookup] = useState(false);

  const loadAccounts = useCallback(() => {
    setError(null);
    getMyAccounts()
      .then(setAccounts)
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : "Couldn't load your accounts.");
      });
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const isLoading = accounts === null && !error;

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your accounts</h1>
        <button
          type="button"
          onClick={() => void logout()}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Log out
        </button>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-20 w-full rounded-card" />
          <Skeleton className="h-20 w-full rounded-card" />
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      {accounts && accounts.length > 0 && (
        <div className="flex flex-col gap-3">
          {accounts.map((account) => (
            <button
              key={account.accountNumber}
              type="button"
              onClick={() => onSelect(account.accountNumber)}
              className="text-left"
            >
              <Card className="transition-colors hover:bg-muted">
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        {accountTypeLabel(account.accountType)}
                      </p>
                      <Badge variant={statusVariant[account.status]}>{account.status}</Badge>
                    </div>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                      {account.accountNumber}
                    </p>
                    <p className="mt-1 text-lg font-semibold tabular-nums">
                      {formatCurrency(account.balance)}
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-muted-foreground" />
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}

      {accounts && accounts.length === 0 && !showCreate && (
        <p className="text-sm text-muted-foreground">
          You don't have any accounts yet.
        </p>
      )}

      {accounts && !showCreate && (
        <Button variant="secondary" onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          Create {accounts.length > 0 ? "another" : "your first"} account
        </Button>
      )}

      {showCreate && (
        <Card>
          <CardContent className="p-5">
            <CreateAccountForm
              prefillName={accounts?.[0]?.accountHolderName ?? ""}
              prefillEmail={email ?? accounts?.[0]?.email ?? ""}
              prefillPhone={phone ?? accounts?.[0]?.phone ?? ""}
              onCreated={(account) => {
                setShowCreate(false);
                loadAccounts();
                onSelect(account.accountNumber);
              }}
            />
          </CardContent>
        </Card>
      )}

      {role === "ADMIN" && (
        <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={() => setShowAdminLookup((v) => !v)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Admin: look up any account
          </button>
          {showAdminLookup && <AdminLookup onSelect={onSelect} />}
        </div>
      )}
    </div>
  );
}
