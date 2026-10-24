import { query } from '../db/index.js';

export type LoanStatus = 'PENDING' | 'PARTIALLY_PAID' | 'REPAID';

export interface Loan {
  id: string;
  lender_id: string;
  borrower_id: string;
  principal_amount: string;
  due_date: string;
  status: LoanStatus;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface LoanDetail extends Loan {
  lender_phone: string;
  lender_username: string;
  lender_display_name: string;
  borrower_phone: string;
  borrower_username: string;
  borrower_display_name: string;
  total_paid: string;
  remaining_balance: string;
  is_overdue: boolean;
}

export interface CreateLoanInput {
  lender_id: string;
  borrower_id: string;
  principal_amount: number;
  due_date: string;
  notes?: string;
}

export interface LoanSummaryMetrics {
  total_lent: string;
  total_repaid: string;
  overdue_amount: string;
}

export interface FindUserLoansFilter {
  userId: string;
  status?: LoanStatus;
  startDate?: string;
  endDate?: string;
}

export class LoanModel {
  async findById(id: string): Promise<Loan | null> {
    const res = await query<Loan>(
      `SELECT id, lender_id, borrower_id, principal_amount, due_date, status, notes, created_at, updated_at
       FROM loans
       WHERE id = $1`,
      [id]
    );
    return res.rows[0] || null;
  }

  async findDetailById(id: string): Promise<LoanDetail | null> {
    const res = await query<LoanDetail>(
      `SELECT 
         l.id,
         l.lender_id,
         l.borrower_id,
         l.principal_amount::TEXT,
         l.due_date::TEXT,
         l.status,
         l.notes,
         l.created_at,
         l.updated_at,
         lu.phone AS lender_phone,
         lu.username AS lender_username,
         lu.display_name AS lender_display_name,
         bu.phone AS borrower_phone,
         bu.username AS borrower_username,
         bu.display_name AS borrower_display_name,
         COALESCE(SUM(p.amount), 0)::TEXT AS total_paid,
         GREATEST(0, l.principal_amount - COALESCE(SUM(p.amount), 0))::TEXT AS remaining_balance,
         (l.status <> 'REPAID' AND l.due_date < CURRENT_DATE) AS is_overdue
       FROM loans l
       JOIN users lu ON l.lender_id = lu.id
       JOIN users bu ON l.borrower_id = bu.id
       LEFT JOIN loan_payments p ON l.id = p.loan_id
       WHERE l.id = $1
       GROUP BY l.id, lu.id, bu.id`,
      [id]
    );
    return res.rows[0] || null;
  }

  async findUserLoans(filter: FindUserLoansFilter): Promise<LoanDetail[]> {
    const { userId, status, startDate, endDate } = filter;
    const values: any[] = [userId];
    const whereClauses: string[] = ['(l.lender_id = $1 OR l.borrower_id = $1)'];

    if (status) {
      values.push(status);
      whereClauses.push(`l.status = $${values.length}`);
    }

    if (startDate) {
      values.push(startDate);
      whereClauses.push(`l.due_date >= $${values.length}`);
    }

    if (endDate) {
      values.push(endDate);
      whereClauses.push(`l.due_date <= $${values.length}`);
    }

    const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

    const sql = `
      SELECT 
        l.id,
        l.lender_id,
        l.borrower_id,
        l.principal_amount::TEXT,
        l.due_date::TEXT,
        l.status,
        l.notes,
        l.created_at,
        l.updated_at,
        lu.phone AS lender_phone,
        lu.username AS lender_username,
        lu.display_name AS lender_display_name,
        bu.phone AS borrower_phone,
        bu.username AS borrower_username,
        bu.display_name AS borrower_display_name,
        COALESCE(SUM(p.amount), 0)::TEXT AS total_paid,
        GREATEST(0, l.principal_amount - COALESCE(SUM(p.amount), 0))::TEXT AS remaining_balance,
        (l.status <> 'REPAID' AND l.due_date < CURRENT_DATE) AS is_overdue
      FROM loans l
      JOIN users lu ON l.lender_id = lu.id
      JOIN users bu ON l.borrower_id = bu.id
      LEFT JOIN loan_payments p ON l.id = p.loan_id
      ${whereSql}
      GROUP BY l.id, lu.id, bu.id
      ORDER BY l.created_at DESC
    `;

    const res = await query<LoanDetail>(sql, values);
    return res.rows;
  }

  async create(data: CreateLoanInput): Promise<Loan> {
    const res = await query<Loan>(
      `INSERT INTO loans (lender_id, borrower_id, principal_amount, due_date, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, lender_id, borrower_id, principal_amount, due_date, status, notes, created_at, updated_at`,
      [data.lender_id, data.borrower_id, data.principal_amount, data.due_date, data.notes || null]
    );
    return res.rows[0];
  }

  async updateStatus(id: string, status: LoanStatus): Promise<Loan | null> {
    const res = await query<Loan>(
      `UPDATE loans
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, lender_id, borrower_id, principal_amount, due_date, status, notes, created_at, updated_at`,
      [status, id]
    );
    return res.rows[0] || null;
  }

  async getSummary(userId: string): Promise<LoanSummaryMetrics> {
    const res = await query<LoanSummaryMetrics>(
      `SELECT 
         (
           SELECT COALESCE(SUM(principal_amount), 0)::TEXT 
           FROM loans 
           WHERE lender_id = $1
         ) AS total_lent,
         (
           SELECT COALESCE(SUM(p.amount), 0)::TEXT
           FROM loan_payments p
           JOIN loans l ON p.loan_id = l.id
           WHERE l.borrower_id = $1
         ) AS total_repaid,
         (
           WITH overdue_borrowed AS (
             SELECT 
               l.id,
               GREATEST(0, l.principal_amount - COALESCE(SUM(p.amount), 0)) AS remaining_balance
             FROM loans l
             LEFT JOIN loan_payments p ON l.id = p.loan_id
             WHERE l.borrower_id = $1 
               AND l.status <> 'REPAID' 
               AND l.due_date < CURRENT_DATE
             GROUP BY l.id, l.principal_amount
           )
           SELECT COALESCE(SUM(remaining_balance), 0)::TEXT
           FROM overdue_borrowed
         ) AS overdue_amount;`,
      [userId]
    );
    return res.rows[0];
  }
}

export const loanModel = new LoanModel();
