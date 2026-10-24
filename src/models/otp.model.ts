import { query } from '../db/index.js';

export interface OtpVerification {
  id: string;
  phone: string;
  otp_code: string;
  expires_at: Date;
  consumed_at: Date | null;
  created_at: Date;
}

export class OtpModel {
  async invalidateActiveOtps(phone: string): Promise<void> {
    await query(
      `UPDATE otp_verifications 
       SET consumed_at = NOW() 
       WHERE phone = $1 AND consumed_at IS NULL`,
      [phone]
    );
  }

  async createOtp(phone: string, otpCode: string, expiryMinutes: number): Promise<OtpVerification> {
    const res = await query<OtpVerification>(
      `INSERT INTO otp_verifications (phone, otp_code, expires_at)
       VALUES ($1, $2, NOW() + ($3 || ' minutes')::INTERVAL)
       RETURNING id, phone, otp_code, expires_at, consumed_at, created_at`,
      [phone, otpCode, expiryMinutes.toString()]
    );
    return res.rows[0];
  }

  async findActiveOtp(phone: string, otpCode: string): Promise<OtpVerification | null> {
    const res = await query<OtpVerification>(
      `SELECT id, phone, otp_code, expires_at, consumed_at, created_at 
       FROM otp_verifications 
       WHERE phone = $1 
         AND otp_code = $2 
         AND consumed_at IS NULL 
         AND expires_at > NOW()
       ORDER BY created_at DESC 
       LIMIT 1`,
      [phone, otpCode]
    );
    return res.rows[0] || null;
  }

  async consumeOtp(id: string): Promise<void> {
    await query(
      `UPDATE otp_verifications 
       SET consumed_at = NOW() 
       WHERE id = $1`,
      [id]
    );
  }
}

export const otpModel = new OtpModel();
