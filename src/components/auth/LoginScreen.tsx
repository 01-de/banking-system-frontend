import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/api/client";

interface LoginScreenProps {
  onSwitchToRegister: () => void;
  banner?: string | null;
  bannerTone?: "success" | "warning";
  prefillEmail?: string;
}

export function LoginScreen({
  onSwitchToRegister,
  banner,
  bannerTone = "success",
  prefillEmail,
}: LoginScreenProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState(prefillEmail ?? "");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
    } catch (err: unknown) {
      setError(
        err instanceof ApiError ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-2xl font-semibold">Log in</h1>
        <p className="mt-1 text-sm text-muted-foreground">Welcome back.</p>
      </div>

      {banner && (
        <p
          className={`rounded-2xl border border-border bg-card px-4 py-3 text-sm ${
            bannerTone === "warning" ? "text-warning" : "text-success"
          }`}
        >
          {banner}
        </p>
      )}

      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
          disabled={isSubmitting}
          autoFocus
          required
        />
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="current-password"
          disabled={isSubmitting}
          required
        />

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <button
        type="button"
        onClick={onSwitchToRegister}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        Don't have an account? <span className="text-accent">Register</span>
      </button>
    </div>
  );
}
