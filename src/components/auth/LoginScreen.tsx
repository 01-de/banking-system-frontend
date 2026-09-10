import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/api/client";
import { isNonEmpty, isValidEmail } from "@/lib/validation";

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
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  function validate(): boolean {
    let valid = true;
    if (!isValidEmail(email)) {
      setEmailError("Enter a valid email address.");
      valid = false;
    } else {
      setEmailError(null);
    }
    if (!isNonEmpty(password)) {
      setPasswordError("Password is required.");
      valid = false;
    } else {
      setPasswordError(null);
    }
    return valid;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;
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
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center gap-6 px-4 md:max-w-2xl">
      <div className="flex flex-col gap-6 md:rounded-card md:border md:border-border md:bg-card md:p-10 md:shadow-sm">
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

        <form className="flex flex-col gap-3" onSubmit={handleSubmit} noValidate>
          <div>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="email"
              disabled={isSubmitting}
              autoFocus
              required
              error={!!emailError}
            />
            {emailError && <p className="mt-1 text-xs text-danger">{emailError}</p>}
          </div>
          <div>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              disabled={isSubmitting}
              required
              error={!!passwordError}
            />
            {passwordError && <p className="mt-1 text-xs text-danger">{passwordError}</p>}
          </div>

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
    </div>
  );
}
