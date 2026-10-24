import { query } from '../db/index.js';

export interface LoanPayment {
  id: string;
  loan_id: string;
  amount: string;
  paid_at: Date;
  notes: string | null;
  created_at: Date;
}

export interface CreatePaymentInput {
  loan_id: string;
  amount: number;
  notes?: string;
}

export class PaymentModel {
  async create(data: CreatePaymentInput): Promise<LoanPayment> {
    const res = await query<LoanPayment>(
      `INSERT INTO loan_payments (loan_id, amount, notes)
       VALUES ($1, $2, $3)
       RETURNING id, loan_id, amount, paid_at, notes, created_at`,
      [data.loan_id, data.amount, data.notes || null]
    );
    return res.rows[0];
  }

  async getTotalPaidForLoan(loanId: string): Promise<number> {
    const res = await query<{ total_paid: string }>(
      `SELECT COALESCE(SUM(amount), 0) AS total_paid
       FROM loan_payments
       WHERE loan_id = $1`,
      [loanId]
    );
    return parseFloat(res.rows[0]?.total_paid || '0');
  }

  async findByLoanId(loanId: string): Promise<LoanPayment[]> {
    const res = await query<LoanPayment>(
      `SELECT id, loan_id, amount, paid_at, notes, created_at
       FROM loan_payments
       WHERE loan_id = $1
       ORDER BY paid_at DESC`,
      [loanId]
    );
    return res.rows;
  }
}

export const paymentModel = new PaymentModel();
