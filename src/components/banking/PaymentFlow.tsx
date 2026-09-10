import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePayment } from "@/hooks/usePayment";
import { formatCurrency } from "@/lib/format";
import { isStripeConfigured, stripePromise } from "@/lib/stripe";
import { cn } from "@/lib/utils";
import { isPositiveAmount } from "@/lib/validation";

interface PaymentFlowProps {
  accountNumber: string;
  onClose: () => void;
  onCompleted?: () => void;
}

type PaymentHook = ReturnType<typeof usePayment>;

interface CheckoutFormProps {
  accountNumber: string;
  amount: number;
  description: string;
  payment: PaymentHook;
}

function CheckoutForm({ accountNumber, amount, description, payment }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { stage, startPayment, order } = payment;
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isBusy = stage === "creating_order" || stage === "confirming_with_stripe" || stage === "polling_status";
  const isRetryableError = (stage === "rate_limited" || stage === "error") && !order;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitError(null);

    const { error } = await elements.submit();
    if (error) {
      setSubmitError(error.message ?? "Check your card details and try again.");
      return;
    }

    await startPayment({
      accountNumber,
      amount,
      description,
      stripe,
      elements,
      returnUrl: window.location.href,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4" noValidate>
      <PaymentElement />

      {submitError && <p className="text-sm text-danger">{submitError}</p>}
      {isRetryableError && payment.errorMessage && (
        <p className="text-sm text-danger">{payment.errorMessage}</p>
      )}

      <div className="flex-1" />

      <Button type="submit" size="lg" disabled={!stripe || !elements || isBusy}>
        {stage === "creating_order"
          ? "Preparing…"
          : stage === "confirming_with_stripe"
            ? "Confirming…"
            : stage === "polling_status"
              ? "Confirming…"
              : `Pay ${formatCurrency(amount)}`}
      </Button>
    </form>
  );
}

export function PaymentFlow({ accountNumber, onClose, onCompleted }: PaymentFlowProps) {
  const payment = usePayment();
  const { stage, order, finalPayment, errorMessage, reset } = payment;

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [confirmedAmount, setConfirmedAmount] = useState<number | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);

  const isProcessingTimeout = stage === "error" && !!order;
  const isTerminal =
    stage === "completed" || stage === "failed" || stage === "forbidden" || isProcessingTimeout;
  const showAmountForm = stage === "idle" && confirmedAmount === null;

  function handleAmountSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isPositiveAmount(amount)) {
      setAmountError("Enter an amount greater than 0.");
      return;
    }
    setAmountError(null);
    setConfirmedAmount(Number(amount));
  }

  const showHeader = !isTerminal;

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col px-4 pb-10 pt-6 md:min-h-0 md:max-w-lg md:my-10 md:rounded-card md:border md:border-border md:bg-card md:px-8 md:pb-8 md:shadow-xl">
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
          <h1 className="text-lg font-semibold">Add money</h1>
        </header>
      )}

      {showAmountForm && (
        <form onSubmit={handleAmountSubmit} className="flex flex-1 flex-col gap-4" noValidate>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Amount
            </label>
            <div
              className={cn(
                "flex items-center rounded-2xl border border-border bg-card px-4",
                amountError && "border-danger"
              )}
            >
              <span className="text-2xl font-semibold text-muted-foreground">$</span>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                type="number"
                min="0.01"
                step="0.01"
                required
                autoFocus
                className="h-14 rounded-none border-0 bg-transparent px-2 text-2xl font-semibold focus:border-0"
              />
            </div>
            {amountError && <p className="mt-1 text-xs text-danger">{amountError}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Description (optional)
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
            />
          </div>

          <div className="flex-1" />

          <Button type="submit" size="lg">
            Continue
          </Button>
        </form>
      )}

      {confirmedAmount !== null && !isTerminal && !isStripeConfigured && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <p className="text-sm text-danger">Payments aren't configured yet.</p>
          <p className="text-sm text-muted-foreground">
            Missing VITE_STRIPE_PUBLISHABLE_KEY — see .env.example.
          </p>
        </div>
      )}

      {confirmedAmount !== null && !isTerminal && isStripeConfigured && (
        <Elements
          stripe={stripePromise}
          options={{ mode: "payment", amount: Math.round(confirmedAmount * 100), currency: "usd" }}
        >
          <CheckoutForm
            accountNumber={accountNumber}
            amount={confirmedAmount}
            description={description}
            payment={payment}
          />
        </Elements>
      )}

      {stage === "completed" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <CheckCircle2 size={56} className="text-success" />
          <h2 className="text-xl font-semibold">Payment complete</h2>
          {finalPayment && (
            <p className="text-3xl font-semibold tabular-nums">
              {formatCurrency(finalPayment.amount, finalPayment.currency)}
            </p>
          )}
          <Button
            size="lg"
            className="mt-6 w-full"
            onClick={() => {
              reset();
              setConfirmedAmount(null);
              setAmount("");
              onCompleted?.();
              onClose();
            }}
          >
            Done
          </Button>
        </div>
      )}

      {isProcessingTimeout && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <Clock size={56} className="text-warning" />
          <h2 className="text-xl font-semibold">Still processing</h2>
          <p className="text-sm text-muted-foreground">
            {errorMessage ??
              "This is taking longer than usual. Check your activity feed shortly for the result."}
          </p>
          <Button
            size="lg"
            className="mt-6 w-full"
            onClick={() => {
              reset();
              setConfirmedAmount(null);
              setAmount("");
              onCompleted?.();
              onClose();
            }}
          >
            Done
          </Button>
        </div>
      )}

      {stage === "failed" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <XCircle size={56} className="text-danger" />
          <h2 className="text-xl font-semibold">Payment failed</h2>
          {errorMessage && <p className="text-sm text-muted-foreground">{errorMessage}</p>}
          <Button
            size="lg"
            className="mt-6 w-full"
            onClick={() => {
              reset();
              setConfirmedAmount(null);
            }}
          >
            Try again
          </Button>
        </div>
      )}

      {stage === "forbidden" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <XCircle size={56} className="text-muted-foreground" />
          <h2 className="text-xl font-semibold">You don't have access</h2>
          <p className="text-sm text-muted-foreground">This isn't your account.</p>
          <Button size="lg" className="mt-6 w-full" onClick={onClose}>
            Close
          </Button>
        </div>
      )}
    </div>
  );
}
