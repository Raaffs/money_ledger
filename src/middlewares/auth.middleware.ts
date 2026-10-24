import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { userModel } from '../models/user.model.js';

interface JwtPayload {
  userId: string;
  phone: string;
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication token required',
      });
      return;
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    const user = await userModel.findById(decoded.userId);

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User no longer exists',
      });
      return;
    }

    req.user = {
      id: user.id,
      phone: user.phone,
      username: user.username,
      display_name: user.display_name,
    };

    next();
  } catch (err: any) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token',
    });
  }
};
