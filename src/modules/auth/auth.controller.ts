import { Request, Response, NextFunction } from 'express';
import { AuthService, authService } from './auth.service.js';

export class AuthController {
  constructor(private service: AuthService = authService) {}

  requestOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { phone } = req.body || {};
      const cleanPhone = typeof phone === 'string' ? phone.trim() : '';

      if (!cleanPhone || cleanPhone.length < 10) {
        res.status(400).json({
          success: false,
          message: 'A valid phone number is required (at least 10 digits)',
        });
        return;
      }

      const result = await this.service.requestOtp(cleanPhone);

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          phone: cleanPhone,
          isExistingUser: result.isExistingUser,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  verifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { phone, otp, username, displayName } = req.body || {};
      const cleanPhone = typeof phone === 'string' ? phone.trim() : '';
      const cleanOtp = typeof otp === 'string' ? otp.trim() : '';

      if (!cleanPhone) {
        res.status(400).json({
          success: false,
          message: 'Phone number is required',
        });
        return;
      }

      if (!cleanOtp || cleanOtp.length !== 6) {
        res.status(400).json({
          success: false,
          message: 'A valid 6-digit OTP is required',
        });
        return;
      }

      const result = await this.service.verifyOtp({
        phone: cleanPhone,
        otp: cleanOtp,
        username: typeof username === 'string' ? username.trim() : undefined,
        displayName: typeof displayName === 'string' ? displayName.trim() : undefined,
      });

      res.status(200).json({
        success: true,
        message: 'Authentication successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
