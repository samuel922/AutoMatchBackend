import nodemailer from 'nodemailer';
import config from '../config';

const transporter = nodemailer.createTransport({
  service: config.EMAIL.SERVICE,
  auth: {
    user: config.EMAIL.USER,
    pass: config.EMAIL.PASS
  }
});

class EmailService {
  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${config.APP_URL}/auth/verify-email?token=${token}`;
    
    await transporter.sendMail({
      from: `"My App" <${config.EMAIL.USER}>`,
      to: email,
      subject: 'Verify Your Email',
      html: `
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>This link will expire in 1 hour.</p>
      `
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${config.APP_URL}/auth/reset-password?token=${token}`;
    
    await transporter.sendMail({
      from: `"My App" <${config.EMAIL.USER}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
      `
    });
  }
}

export default new EmailService();