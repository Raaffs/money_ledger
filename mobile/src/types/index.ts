export interface User {
  id: string;
  phone: string;
  username: string;
  display_name: string;
  created_at?: string;
  updated_at?: string;
}

export type LoanStatus = 'PENDING' | 'PARTIALLY_PAID' | 'REPAID';

export interface LoanPayment {
  id: string;
  loan_id: string;
  amount: string;
  paid_at: string;
  notes: string | null;
  created_at: string;
}

export interface Loan {
  id: string;
  lender_id: string;
  borrower_id: string;
  principal_amount: string;
  due_date: string;
  status: LoanStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  lender_phone: string;
  lender_username: string;
  lender_display_name: string;
  borrower_phone: string;
  borrower_username: string;
  borrower_display_name: string;
  total_paid: string;
  remaining_balance: string;
  is_overdue: boolean;
  payments?: LoanPayment[];
}

export interface LoanSummary {
  total_lent: number;
  total_repaid: number;
  overdue_amount: number;
}

export interface CreateLoanPayload {
  borrowerIdentifier: string;
  amount: number;
  dueDate: string;
  notes?: string;
}

export interface RecordPaymentPayload {
  amount: number;
  notes?: string;
}

export interface RequestOtpResponse {
  success: boolean;
  message: string;
  data: {
    phone: string;
    isExistingUser: boolean;
  };
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
}
