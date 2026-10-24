import { Request, Response, NextFunction } from 'express';
import { UserService, userService } from './user.service.js';

export class UserController {
  constructor(private service: UserService = userService) {}

  getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const user = await this.service.getProfile(req.user.id);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const userController = new UserController();
