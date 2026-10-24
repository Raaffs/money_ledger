import { Router } from 'express';
import { userController } from './user.controller.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';

const router = Router();

router.get('/me', authenticateToken, userController.getMe);

export default router;
