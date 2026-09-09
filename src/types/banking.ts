export type AccountType = "SAVINGS" | "CURRENT" | "FIXED_DEPOSIT";
export type AccountStatus = "ACTIVE" | "BLOCKED" | "CLOSED";

export type TransactionType = "DEPOSIT" | "WITHDRAW" | "PAYMENT" | "TRANSFER";
export type TransactionStatus =
  | "PENDING"
  | "PROCESSING"
  | "PENDING_VERIFICATION"
  | "COMPLETED"
  | "FLAGGED"
  | "FAILED";

export type PaymentStatus =
  | "CREATED"
  | "PENDING"
  | "COMPLETED"
  | "FAILED"
  | "REFUNDED";

export interface CreateAccountRequest {
  accountHolderName: string;
  email: string;
  phone: string;
  accountType: AccountType;
  initialDeposit: number;
}

export interface AccountResponse {
  id: string;
  accountHolderName: string;
  accountNumber: string;
  email: string;
  phone: string;
  accountType: AccountType;
  status: AccountStatus;
  balance: number;
  dailyTransactionLimit: number;
}

export interface TransferRequest {
  senderAccountNumber: string;
  receiverAccountNumber: string;
  amount: number;
  description: string;
  idempotencyKey: string;
}

export interface TransactionResponse {
  id: string;
  senderAccountNumber: string;
  receiverAccountNumber: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  description: string;
  failureReason: string | null;
  referenceNumber: string;
  createdAt: string;
  completedAt: string | null;
}

export interface CreatePaymentRequest {
  accountNumber: string;
  amount: number;
  description?: string;
}

export interface PaymentOrderResponse {
  paymentId: string;
  stripePaymentIntentId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  clientSecret: string;
}

export interface PaymentStatusResponse {
  paymentId: string;
  stripePaymentIntentId: string;
  accountNumber: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  description: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SpringDefaultError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}
