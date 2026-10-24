import { UserModel, userModel, User } from '../../models/user.model.js';

export class UserService {
  constructor(private userRepo: UserModel = userModel) {}

  async getProfile(userId: string): Promise<User> {
    const user = await this.userRepo.findById(userId);

    if (!user) {
      const error: any = new Error('User not found');
      error.status = 404;
      throw error;
    }

    return user;
  }
}

export const userService = new UserService();
