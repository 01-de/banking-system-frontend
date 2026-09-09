import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { useTransfer } from "@/hooks/useTransfer";
import { formatCurrency } from "@/lib/format";

interface TransferFlowProps {
  senderAccountNumber: string;
  onClose: () => void;
  onCompleted?: () => void;
}

const OTP_LENGTH = 6;

export function TransferFlow({ senderAccountNumber, onClose, onCompleted }: TransferFlowProps) {
  const { stage, transaction, errorMessage, submitTransfer, submitOtp, reset } = useTransfer();

  const [receiverAccountNumber, setReceiverAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const isBusy = stage === "submitting" || stage === "polling_status" || stage === "verifying_otp";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = Number(amount);
    if (!receiverAccountNumber.trim() || !parsedAmount || parsedAmount <= 0) return;
    void submitTransfer({
      senderAccountNumber,
      receiverAccountNumber: receiverAccountNumber.trim(),
      amount: parsedAmount,
      description: description.trim() || "Transfer",
    });
  }

  function handleOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);

    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
    if (next.every((d) => d.length === 1)) {
      void submitOtp(next.join(""));
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  const showHeader =
    stage !== "completed" && stage !== "flagged" && stage !== "failed" && stage !== "forbidden";

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col px-4 pb-10 pt-6">
      {showHeader && (
        <header className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-lg font-semibold">
            {stage === "awaiting_otp" || stage === "verifying_otp" ? "Verify transfer" : "Send money"}
          </h1>
        </header>
      )}

      {(stage === "idle" ||
        stage === "submitting" ||
        stage === "polling_status" ||
        stage === "rate_limited" ||
        stage === "error") && (
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Recipient account number
            </label>
            <input
              value={receiverAccountNumber}
              onChange={(e) => setReceiverAccountNumber(e.target.value)}
              placeholder="e.g. 495147077468"
              disabled={isBusy}
              className="h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm outline-none focus:border-accent disabled:opacity-50"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Amount</label>
            <div className="flex items-center rounded-2xl border border-border bg-card px-4">
              <span className="text-2xl font-semibold text-muted-foreground">$</span>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                type="number"
                min="0.01"
                step="0.01"
                disabled={isBusy}
                className="h-14 w-full bg-transparent px-2 text-2xl font-semibold outline-none disabled:opacity-50"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              What's it for? (optional)
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              disabled={isBusy}
              className="h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm outline-none focus:border-accent disabled:opacity-50"
            />
          </div>

          {(stage === "rate_limited" || stage === "error") && errorMessage && (
            <p className="text-sm text-danger">{errorMessage}</p>
          )}

          <div className="flex-1" />

          <Button type="submit" size="lg" disabled={isBusy}>
            {stage === "submitting"
              ? "Sending…"
              : stage === "polling_status"
                ? "Confirming…"
                : "Send"}
          </Button>
        </form>
      )}

      {(stage === "awaiting_otp" || stage === "verifying_otp") && (
        <div className="flex flex-1 flex-col items-center gap-6 pt-10 text-center">
          <p className="text-sm text-muted-foreground">
            This transfer looked unusual, so we sent a verification code. Enter it below to
            continue.
          </p>

          <div className="flex gap-2">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  otpRefs.current[i] = el;
                }}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                inputMode="numeric"
                maxLength={1}
                disabled={stage === "verifying_otp"}
                className="h-14 w-11 rounded-2xl border border-border bg-card text-center text-xl font-semibold outline-none focus:border-accent disabled:opacity-50"
              />
            ))}
          </div>

          {errorMessage && <p className="text-sm text-danger">{errorMessage}</p>}
          {stage === "verifying_otp" && (
            <p className="text-sm text-muted-foreground">Verifying…</p>
          )}
        </div>
      )}

      {stage === "completed" && transaction && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <CheckCircle2 size={56} className="text-success" />
          <h2 className="text-xl font-semibold">Transfer complete</h2>
          <p className="text-3xl font-semibold tabular-nums">
            {formatCurrency(transaction.amount)}
          </p>
          <p className="text-sm text-muted-foreground">
            to {transaction.receiverAccountNumber}
          </p>
          <Button
            size="lg"
            className="mt-6 w-full"
            onClick={() => {
              reset();
              onCompleted?.();
              onClose();
            }}
          >
            Done
          </Button>
        </div>
      )}

      {(stage === "flagged" || stage === "failed") && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <XCircle size={56} className="text-danger" />
          <h2 className="text-xl font-semibold">
            {stage === "flagged" ? "Transfer was flagged" : "Transfer failed"}
          </h2>
          {errorMessage && <p className="text-sm text-muted-foreground">{errorMessage}</p>}
          <Button
            size="lg"
            className="mt-6 w-full"
            onClick={() => {
              reset();
              onCompleted?.();
              onClose();
            }}
          >
            Done
          </Button>
        </div>
      )}

      {stage === "forbidden" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <XCircle size={56} className="text-muted-foreground" />
          <h2 className="text-xl font-semibold">You don't have access</h2>
          <p className="text-sm text-muted-foreground">
            This isn't your account or transaction.
          </p>
          <Button size="lg" className="mt-6 w-full" onClick={onClose}>
            Close
          </Button>
        </div>
      )}
    </div>
  );
}
