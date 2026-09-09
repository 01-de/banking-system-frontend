import { loadStripe } from "@stripe/stripe-js";

const STRIPE_PUBLISHABLE_KEY =
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "";

if (!STRIPE_PUBLISHABLE_KEY) {
  console.warn(
    "VITE_STRIPE_PUBLISHABLE_KEY is not set — Stripe Elements will fail to load. " +
      "Add it to a .env.local file (see .env.example)."
  );
}

export const isStripeConfigured = Boolean(STRIPE_PUBLISHABLE_KEY);

export const stripePromise = isStripeConfigured
  ? loadStripe(STRIPE_PUBLISHABLE_KEY)
  : Promise.resolve(null);
