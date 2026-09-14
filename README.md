# Banking System Frontend

A React + TypeScript single-page app for a banking platform: account creation, balances, money transfers (with OTP step-up verification for unusual transfers), Stripe-powered top-ups, transaction history, and basic admin controls (account block/unblock, cross-account lookup).

Talks to a separate Spring Boot backend over a REST API.

## Tech stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) — dev server & build
- [Tailwind CSS v4](https://tailwindcss.com/) — styling, with `shadcn/ui`-style primitives in `src/components/ui`
- [Stripe.js / React Stripe](https://stripe.com/docs/stripe-js/react) — card payments
- [oxlint](https://oxc.rs/) — linting

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values, see below
npm run dev
```

The app runs at `http://localhost:5173` by default.

### Environment variables

Set these in `.env.local` (git-ignored):

| Variable | Description |
| --- | --- |
| `VITE_API_BASE_URL` | Base URL of the backend API (e.g. `http://localhost:8080` locally, or a deployed backend URL). Defaults to `http://localhost:8080` if unset. |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key used for the "top up" payment flow. Without it, the payment screen shows a "Payments aren't configured yet" message instead of failing. |

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check (`tsc -b`) and build for production into `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run oxlint |

## Project structure

```
src/
  api/            Typed fetch wrappers per backend resource (auth, accounts, transactions, payments)
  components/
    auth/         Login / register / auth gate screens
    banking/      Dashboard, account picker, transfer & payment flows, transaction list, panels
    ui/           Small shared UI primitives (button, card, input, badge, avatar, skeleton)
  contexts/       AuthContext — session state, token refresh wiring
  hooks/          Data-fetching hooks (account, transfer, payment, transaction history)
  lib/            Formatting, validation, Stripe setup, token storage, class-name utils
  types/          Shared TypeScript types for auth & banking API payloads
```

## How auth works

- Access tokens live in memory only; refresh tokens are persisted via `src/lib/tokenStorage.ts`.
- `src/api/client.ts` centralizes all API calls: it attaches the bearer token, retries once on a `401` by silently refreshing the session, and retries `429` responses with exponential backoff.
- `AuthContext` (`src/contexts/AuthContext.tsx`) exposes `login`, `register`, `logout`, and the current `role` (`CUSTOMER` or `ADMIN`), and reacts to forced logout when a refresh fails.

## Transfers & payments

- `TransferFlow` submits a transfer and, if the backend flags it as unusual, prompts for a 6-digit OTP before completing it.
- `PaymentFlow` creates a payment order on the backend, then confirms it client-side with Stripe Elements.
- Both flows poll the backend for final transaction/payment status after submission.

## Responsive layout

The app is a single responsive web app (no separate desktop build): mobile keeps the original single-column, edge-to-edge screens; at `md`/`lg` breakpoints the auth screens and transfer/payment flows become centered floating cards, the account list becomes a 2-column grid, and the dashboard switches to a two-column layout with a sticky "Recent activity" sidebar.

## Deployment

The frontend is deployed to Vercel; the backend runs on AWS. Point `VITE_API_BASE_URL` at the deployed backend when building for production.
