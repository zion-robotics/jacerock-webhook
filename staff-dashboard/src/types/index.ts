export type UserRole = 'ADMIN' | 'AGENT' | 'VIEWER';

export interface StaffUser {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type TransactionStatus =
  | 'NEW' | 'KYC_PENDING' | 'KYC_COMPLETED' | 'RATE_SELECTED'
  | 'PAYMENT_METHOD_SELECTED' | 'PAYMENT_INSTRUCTIONS_ISSUED'
  | 'AWAITING_PAYMENT' | 'RECEIPT_UPLOADED' | 'PENDING_PAYMENT_VERIFICATION'
  | 'PAYMENT_VERIFIED' | 'SETTLEMENT_DETAILS_PENDING'
  | 'SETTLEMENT_DETAILS_CONFIRMED' | 'AWAITING_STAFF_APPROVAL'
  | 'SETTLEMENT_PROCESSING' | 'SETTLEMENT_COMPLETED' | 'CLOSED'
  | 'CANCELLED' | 'PAYMENT_FAILED' | 'PAYMENT_MISMATCH'
  | 'KYC_MISMATCH' | 'UNDER_REVIEW' | 'ADDITIONAL_INFORMATION_REQUIRED' | 'REJECTED';

export interface Transaction {
  id: string;
  reference: string;
  customer_id: string;
  whatsapp_number: string;
  kyc_name: string;
  currency_pair: string;
  from_currency: string;
  to_currency: string;
  exchange_rate: number;
  amount: number;
  settlement_amount_ngn: number;
  payment_method: 'BANK_TRANSFER' | 'CASH_DEPOSIT' | 'MOBILE_WALLET';
  selected_bank_id: string;
  receipt_url: string;
  receipt_uploaded_at: string;
  settlement_account_name: string;
  settlement_bank_name: string;
  settlement_account_number: string;
  status: TransactionStatus;
  staff_reviewer: string;
  staff_notes: string;
  rejection_reason: string;
  created_at: string;
  verified_at: string;
  completed_at: string;
  updated_at: string;
}

export interface ExchangeRate {
  id: string;
  currency_pair: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  is_active: boolean;
  updated_by: string;
  updated_at: string;
}

export interface BankAccount {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  currency: string;
  country: string;
  is_active: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  transaction_id: string;
  customer_id: string;
  action: string;
  old_status: string;
  new_status: string;
  performed_by: string;
  notes: string;
  created_at: string;
}

export interface ConversationSession {
  id: string;
  whatsapp_number: string;
  customer_id: string;
  current_step: string;
  transaction_id: string;
  session_data: Record<string, unknown>;
  bot_paused: boolean;
  paused_by: string;
  paused_at: string;
  last_activity: string;
}
