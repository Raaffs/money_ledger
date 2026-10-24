import { LoanModel, loanModel, LoanStatus } from '../../models/loan.model.js';
import { PaymentModel, paymentModel } from '../../models/payment.model.js';
import { UserModel, userModel } from '../../models/user.model.js';

export interface CreateLoanParams {
  lenderId: string;
  borrowerIdentifier: string;
  amount: number;
  dueDate: string;
  notes?: string;
}

export interface RecordPaymentParams {
  loanId: string;
  userId: string;
  amount: number;
  notes?: string;
}

export class LoanService {
  constructor(
    private loanRepo: LoanModel = loanModel,
    private paymentRepo: PaymentModel = paymentModel,
    private userRepo: UserModel = userModel
  ) {}

  async createLoan(params: CreateLoanParams) {
    const { lenderId, borrowerIdentifier, amount, dueDate, notes } = params;
    const cleanIdentifier = borrowerIdentifier.trim();

    let borrower = await this.userRepo.findByUsername(cleanIdentifier);
    if (!borrower) {
      borrower = await this.userRepo.findByPhone(cleanIdentifier);
    }
    if (!borrower) {
      const cleanDigits = cleanIdentifier.replace(/\D/g, '');
      if (cleanDigits.length === 10) {
        borrower = await this.userRepo.findByPhone(`+91${cleanDigits}`);
      }
    }

    if (!borrower) {
      const error: any = new Error(`Borrower with username or phone '${cleanIdentifier}' not found`);
      error.status = 404;
      throw error;
    }

    if (borrower.id === lenderId) {
      const error: any = new Error('You cannot create a loan to yourself');
      error.status = 400;
      throw error;
    }

    const created = await this.loanRepo.create({
      lender_id: lenderId,
      borrower_id: borrower.id,
      principal_amount: amount,
      due_date: dueDate,
      notes,
    });

    return this.loanRepo.findDetailById(created.id);
  }

  async getLoanById(loanId: string, userId: string) {
    const loan = await this.loanRepo.findDetailById(loanId);

    if (!loan) {
      const error: any = new Error('Loan not found');
      error.status = 404;
      throw error;
    }

    if (loan.lender_id !== userId && loan.borrower_id !== userId) {
      const error: any = new Error('You are not authorized to view this loan');
      error.status = 403;
      throw error;
    }

    const payments = await this.paymentRepo.findByLoanId(loanId);

    return {
      ...loan,
      payments,
    };
  }

  async getUserLoans(params: {
    userId: string;
    status?: LoanStatus;
    startDate?: string;
    endDate?: string;
  }) {
    return this.loanRepo.findUserLoans(params);
  }

  async recordPayment(params: RecordPaymentParams) {
    const { loanId, userId, amount, notes } = params;

    const loan = await this.loanRepo.findById(loanId);
    if (!loan) {
      const error: any = new Error('Loan not found');
      error.status = 404;
      throw error;
    }

    if (loan.lender_id !== userId && loan.borrower_id !== userId) {
      const error: any = new Error('You are not authorized to modify this loan');
      error.status = 403;
      throw error;
    }

    if (loan.status === 'REPAID') {
      const error: any = new Error('This loan has already been fully repaid');
      error.status = 400;
      throw error;
    }

    const currentTotalPaid = await this.paymentRepo.getTotalPaidForLoan(loanId);
    const principal = parseFloat(loan.principal_amount);
    const remainingBalance = principal - currentTotalPaid;

    if (amount > remainingBalance) {
      const error: any = new Error(`Payment amount (${amount}) exceeds remaining balance (${remainingBalance.toFixed(2)})`);
      error.status = 400;
      throw error;
    }

    const payment = await this.paymentRepo.create({
      loan_id: loanId,
      amount,
      notes,
    });

    const newTotalPaid = currentTotalPaid + amount;
    const newStatus: LoanStatus = newTotalPaid >= principal ? 'REPAID' : 'PARTIALLY_PAID';

    await this.loanRepo.updateStatus(loanId, newStatus);

    const updatedLoan = await this.getLoanById(loanId, userId);

    return {
      payment,
      loan: updatedLoan,
    };
  }

  async getSummary(userId: string) {
    const summary = await this.loanRepo.getSummary(userId);
    return {
      total_lent: parseFloat(summary.total_lent),
      total_repaid: parseFloat(summary.total_repaid),
      overdue_amount: parseFloat(summary.overdue_amount),
    };
  }
}

export const loanService = new LoanService();
