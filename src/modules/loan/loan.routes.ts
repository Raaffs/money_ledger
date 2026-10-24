import { Router } from 'express';
import { loanController } from './loan.controller.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';

const router = Router();

// All loan endpoints require authentication
router.use(authenticateToken);

router.post('/', loanController.create);

router.get('/summary', loanController.getSummary);

// List user's loans
router.get('/', loanController.list);

// Get specific loan details
router.get('/:id', loanController.getById);

// Record repayment payment installment
router.post('/:id/payments', loanController.recordPayment);

export default router;
