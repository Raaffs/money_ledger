import { Request, Response, NextFunction } from 'express';
import { LoanService, loanService } from './loan.service.js';
import { LoanStatus } from '../../models/loan.model.js';

export class LoanController {
  constructor(private service: LoanService = loanService) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { borrowerIdentifier, amount, dueDate, notes } = req.body || {};

      const cleanBorrower = typeof borrowerIdentifier === 'string' ? borrowerIdentifier.trim() : '';
      if (!cleanBorrower) {
        res.status(400).json({
          success: false,
          message: 'Borrower username or phone is required',
        });
        return;
      }

      const numAmount = Number(amount);
      if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
        res.status(400).json({
          success: false,
          message: 'Amount must be a positive number',
        });
        return;
      }

      const cleanDueDate = typeof dueDate === 'string' ? dueDate.trim() : '';
      if (!cleanDueDate || isNaN(Date.parse(cleanDueDate))) {
        res.status(400).json({
          success: false,
          message: 'A valid due date is required (YYYY-MM-DD)',
        });
        return;
      }

      const loan = await this.service.createLoan({
        lenderId: req.user!.id,
        borrowerIdentifier: cleanBorrower,
        amount: numAmount,
        dueDate: cleanDueDate,
        notes: typeof notes === 'string' ? notes.trim() : undefined,
      });

      res.status(201).json({
        success: true,
        message: 'Loan entry created successfully',
        data: loan,
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const loanId = req.params.id as string;
      if (!loanId) {
        res.status(400).json({ success: false, message: 'Loan ID is required' });
        return;
      }

      const loan = await this.service.getLoanById(loanId, req.user!.id);

      res.status(200).json({
        success: true,
        data: loan,
      });
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, startDate, endDate } = req.query;

      const validStatuses: LoanStatus[] = ['PENDING', 'PARTIALLY_PAID', 'REPAID'];
      const filterStatus = typeof status === 'string' && validStatuses.includes(status as LoanStatus)
        ? (status as LoanStatus)
        : undefined;

      const loans = await this.service.getUserLoans({
        userId: req.user!.id,
        status: filterStatus,
        startDate: typeof startDate === 'string' ? startDate : undefined,
        endDate: typeof endDate === 'string' ? endDate : undefined,
      });

      res.status(200).json({
        success: true,
        data: loans,
      });
    } catch (error) {
      next(error);
    }
  };

  recordPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const loanId = req.params.id as string;
      const { amount, notes } = req.body || {};

      const numAmount = Number(amount);
      if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
        res.status(400).json({
          success: false,
          message: 'Payment amount must be greater than 0',
        });
        return;
      }

      const result = await this.service.recordPayment({
        loanId,
        userId: req.user!.id,
        amount: numAmount,
        notes: typeof notes === 'string' ? notes.trim() : undefined,
      });

      res.status(200).json({
        success: true,
        message: 'Payment recorded successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const summary = await this.service.getSummary(req.user!.id);

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const loanController = new LoanController();
