import { Router } from 'express';
import { authController } from './auth.controller.js';

const router = Router();

// Public auth endpoints
router.post('/request-otp', authController.requestOtp);
router.post('/verify-otp', authController.verifyOtp);

export default router;
