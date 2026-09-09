import { isValidPhoneNumber } from "libphonenumber-js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ACCOUNT_NUMBER_RE = /^\d{6,20}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function isValidPhone(phone: string): boolean {
  const trimmed = phone.trim();
  if (!trimmed) return false;
  try {
    return isValidPhoneNumber(trimmed);
  } catch {
    return false;
  }
}

export function isValidAccountNumber(value: string): boolean {
  return ACCOUNT_NUMBER_RE.test(value.trim());
}

export function isNonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

export function isPositiveAmount(value: string): boolean {
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
}
