import { apiClient } from './client';
import {
  Loan,
  LoanSummary,
  CreateLoanPayload,
  RecordPaymentPayload,
  LoanPayment,
  ApiResponse,
} from '../types/index';

export const loansApi = {
  getSummary: async (): Promise<LoanSummary> => {
    const res = await apiClient<ApiResponse<LoanSummary>>('/loans/summary');
    return res.data || { total_lent: 0, total_repaid: 0, overdue_amount: 0 };
  },

  getLoans: async (filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Loan[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient<ApiResponse<Loan[]>>(`/loans${qs}`);
    return res.data || [];
  },

  getLoanById: async (id: string): Promise<Loan> => {
    const res = await apiClient<ApiResponse<Loan>>(`/loans/${id}`);
    if (!res.data) {
      throw new Error('Loan data not found');
    }
    return res.data;
  },

  createLoan: async (payload: CreateLoanPayload): Promise<Loan> => {
    const res = await apiClient<ApiResponse<Loan>>('/loans', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res.data) {
      throw new Error('Failed to create loan');
    }
    return res.data;
  },

  recordPayment: async (
    loanId: string,
    payload: RecordPaymentPayload
  ): Promise<{ payment: LoanPayment; loan: Loan }> => {
    const res = await apiClient<
      ApiResponse<{ payment: LoanPayment; loan: Loan }>
    >(`/loans/${loanId}/payments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res.data) {
      throw new Error('Failed to record payment');
    }
    return res.data;
  },
};
