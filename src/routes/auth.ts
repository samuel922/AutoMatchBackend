import express from 'express';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();
const router = express.Router();

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secure-secret-key-here';
const JWT_EXPIRES_IN: number = 
  Number(process.env.JWT_EXPIRES_IN_SECONDS)   // e.g. set env as "86400"
  || 24 * 60 * 60;
const RESET_TOKEN_EXPIRY = 3600000; // 1 hour in ms
const EMAIL_CONFIG = {
  service: process.env.EMAIL_SERVICE || 'Gmail',
  user: process.env.EMAIL_USER || 'your-email@gmail.com',
  pass: process.env.EMAIL_PASS || 'your-email-password'
};
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

// Email transporter
const transporter = nodemailer.createTransport({
  service: EMAIL_CONFIG.service,
  auth: {
    user: EMAIL_CONFIG.user,
    pass: EMAIL_CONFIG.pass
  }
});

// Types
interface JwtPayload {
  userId: number;
  role: string;
}

interface UserResponse {
  id: number;
  name: string | null;
  email: string;
  role: string;
  buyerId?: number;
  sellerId?: number;
  adminId?: number;
}



// Helper function to generate JWT token
const generateToken = (payload: JwtPayload): string => {
  // now expiresIn is a number, so it matches SignOptions.expiresIn
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};
// Register
router.post('/register', async (req, res) => {
  const { email, password, role, name } = req.body;
  
  if (!['BUYER', 'SELLER', 'ADMIN'].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + RESET_TOKEN_EXPIRY);
    
    const userData = {
      email,
      name,
      password: hashedPassword,
      role,
      isActive: role !== 'ADMIN',
      emailVerificationToken,
      emailVerificationExpires,
      ...(role === 'BUYER' && { buyerProfile: { create: {} } }),
      ...(role === 'SELLER' && { sellerProfile: { create: {} } }),
      ...(role === 'ADMIN' && { adminProfile: { create: {} } })
    };

    const user = await prisma.user.create({ data: userData });

    // Send verification email
    const verificationUrl = `${APP_URL}/auth/verify-email?token=${emailVerificationToken}`;
    await sendEmail(
      user.email,
      'Verify Your Email',
      `Please click this link to verify your email: ${verificationUrl}`
    );

    if (role !== 'ADMIN') {
      const token = generateToken({ userId: user.id, role: user.role });
      return res.json({ 
        token,
        message: "Registration successful. Please verify your email."
      });
    }

    res.json({ message: "Admin account created, awaiting activation" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const user = await prisma.user.findUnique({ 
      where: { email },
      include: {
        buyerProfile: true,
        sellerProfile: true,
        adminProfile: true
      }
    });
    
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    if (!user.isActive) return res.status(403).json({ error: "Account inactive" });
    if (!user.emailVerified) return res.status(403).json({ error: "Email not verified" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: "Invalid credentials" });

    const token = generateToken({ userId: user.id, role: user.role });
    const userResponse: UserResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      ...(user.buyerProfile && { buyerId: user.buyerProfile.id }),
      ...(user.sellerProfile && { sellerId: user.sellerProfile.id }),
      ...(user.adminProfile && { adminId: user.adminProfile.id })
    };

    res.json({ token, user: userResponse });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Verify Email
router.get('/verify-email', async (req, res) => {
  const { token } = req.query;

  if (typeof token !== 'string') {
    return res.status(400).json({ error: "Invalid token format" });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: { gt: new Date() }
      }
    });

    if (!user) return res.status(400).json({ error: "Invalid or expired token" });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null
      }
    });

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Email verification failed" });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.json({ message: "If account exists, reset email sent" });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + RESET_TOKEN_EXPIRY);

    await prisma.user.update({
      where: { id: user.id },
      data: { 
        resetToken,
        resetTokenExpires 
      }
    });

    const resetUrl = `${APP_URL}/auth/reset-password?token=${resetToken}`;
    await sendEmail(
      user.email,
      'Password Reset',
      `Click this link to reset your password: ${resetUrl}`
    );

    res.json({ message: "Password reset email sent" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Password reset failed" });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;

  try {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: { gt: new Date() }
      }
    });

    if (!user) return res.status(400).json({ error: "Invalid or expired token" });

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null
      }
    });

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Password reset failed" });
  }
});

// Helper function to send emails
async function sendEmail(to: string, subject: string, text: string) {
  try {
    await transporter.sendMail({
      from: `"SeatSnags" <${EMAIL_CONFIG.user}>`,
      to,
      subject,
      text,
      html: `<p>${text.replace(/\n/g, '<br>')}</p>`
    });
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

export default router;