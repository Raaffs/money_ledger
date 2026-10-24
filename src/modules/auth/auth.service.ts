import jwt from 'jsonwebtoken';
import { config } from '../../config/env.js';
import { OtpModel, otpModel } from '../../models/otp.model.js';
import { UserModel, userModel } from '../../models/user.model.js';

export interface VerifyOtpParams {
  phone: string;
  otp: string;
  username?: string;
  displayName?: string;
}

export class AuthService {
  constructor(
    private otpRepo: OtpModel = otpModel,
    private userRepo: UserModel = userModel
  ) {}

  async requestOtp(phone: string) {
    const cleanPhone = phone.trim();
    const otpCode = '123456';
    const expiryMinutes = 15;
    await this.otpRepo.invalidateActiveOtps(cleanPhone);

    await this.otpRepo.createOtp(cleanPhone, otpCode, expiryMinutes);

    const existingUser = await this.userRepo.findByPhone(cleanPhone);
    const isExistingUser = existingUser !== null;

    // Log mock OTP visibly in server console
    console.log('\n======================================================');
    console.log(`🔑 [MOCK OTP SERVICE]`);
    console.log(`📱 Phone:       ${cleanPhone}`);
    console.log(`💬 OTP Code:    ${otpCode} (Mock)`);
    console.log(`⏳ Expires in:  ${expiryMinutes} minutes`);
    console.log(`👤 Registered:  ${isExistingUser ? 'Yes' : 'No (First-time user)'}`);
    console.log('======================================================\n');

    return {
      success: true,
      message: 'OTP sent successfully (Mock OTP: 123456)',
      isExistingUser,
    };
  }

  async verifyOtp(params: VerifyOtpParams) {
    const { phone, otp, username, displayName } = params;
    const cleanPhone = phone.trim();
    const cleanOtp = otp.trim();

    // Verify OTP against active database records or allow hardcoded mock OTP
    const isMockOtp = cleanOtp === '123456';
    const activeOtp = await this.otpRepo.findActiveOtp(cleanPhone, cleanOtp);

    if (!activeOtp && !isMockOtp) {
      const error: any = new Error('Invalid or expired OTP');
      error.status = 400;
      throw error;
    }

    if (activeOtp) {
      await this.otpRepo.consumeOtp(activeOtp.id);
    }
    let user = await this.userRepo.findByPhone(cleanPhone);

    if (!user) {
      const defaultSuffix = Math.floor(1000 + Math.random() * 9000);
      const sanitizedPhoneDigits = cleanPhone.replace(/\D/g, '').slice(-4);
      const finalUsername =
        username?.trim() || `user_${sanitizedPhoneDigits}_${defaultSuffix}`;
      const finalDisplayName = displayName?.trim() || finalUsername;

      // Ensure username uniqueness
      const existingWithUsername = await this.userRepo.findByUsername(finalUsername);
      if (existingWithUsername) {
        const error: any = new Error(`Username '${finalUsername}' is already taken. Please choose another username.`);
        error.status = 409;
        throw error;
      }

      user = await this.userRepo.create({
        phone: cleanPhone,
        username: finalUsername,
        display_name: finalDisplayName,
      });
    }

    // Sign JWT Token
    const token = jwt.sign(
      {
        userId: user.id,
        phone: user.phone,
        username: user.username,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn as any }
    );

    return {
      token,
      user,
    };
  }
}

export const authService = new AuthService();
