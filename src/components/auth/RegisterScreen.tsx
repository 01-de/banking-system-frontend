import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/api/client";
import { isValidEmail, isValidPhone } from "@/lib/validation";

interface RegisterScreenProps {
  onSwitchToLogin: () => void;
  onRegistered: (email: string) => void;
}

export function RegisterScreen({ onSwitchToLogin, onRegistered }: RegisterScreenProps) {
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  function validate(): boolean {
    let valid = true;
    if (!isValidEmail(email)) {
      setEmailError("Enter a valid email address.");
      valid = false;
    } else {
      setEmailError(null);
    }
    if (!isValidPhone(phone)) {
      setPhoneError("Enter a valid phone number, including country code (e.g. +1 555 123 4567).");
      valid = false;
    } else {
      setPhoneError(null);
    }
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      valid = false;
    } else {
      setPasswordError(null);
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords don't match.");
      valid = false;
    } else {
      setConfirmPasswordError(null);
    }
    return valid;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await register({ email: email.trim(), phone: phone.trim(), password });
      onRegistered(email.trim());
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
        <h1 className="text-2xl font-semibold">Create an account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Takes less than a minute.</p>
      </div>

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
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone (e.g. +1 555 123 4567)"
            autoComplete="tel"
            disabled={isSubmitting}
            required
            error={!!phoneError}
          />
          {phoneError && <p className="mt-1 text-xs text-danger">{phoneError}</p>}
        </div>
        <div>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min 8 characters)"
            autoComplete="new-password"
            disabled={isSubmitting}
            required
            error={!!passwordError}
          />
          {passwordError && <p className="mt-1 text-xs text-danger">{passwordError}</p>}
        </div>
        <div>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            autoComplete="new-password"
            disabled={isSubmitting}
            required
            error={!!confirmPasswordError}
          />
          {confirmPasswordError && (
            <p className="mt-1 text-xs text-danger">{confirmPasswordError}</p>
          )}
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <button
        type="button"
        onClick={onSwitchToLogin}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        Already have an account? <span className="text-accent">Log in</span>
      </button>
      </div>
    </div>
  );
}
