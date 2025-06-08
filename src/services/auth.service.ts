import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import config from '../config';
import { ApiError } from '../utils/apiError';
import { IUser, IRegisterRequest, ILoginRequest } from '../interfaces/auth.interfaces';
import tokenService from './token.service';
import emailService from './email.service';

const prisma = new PrismaClient();

class AuthService {
  async register(userData: IRegisterRequest): Promise<{ user: IUser; verificationToken: string }> {
    const { email, password, role } = userData;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ApiError(400, 'Email already in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = tokenService.generateRandomToken();

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
        isActive: role !== 'ADMIN',
        emailVerificationToken: verificationToken,
        emailVerificationExpires: new Date(Date.now() + config.RESET_TOKEN_EXPIRY)
      }
    });

    await emailService.sendVerificationEmail(user.email, verificationToken);

    return { user, verificationToken };
  }

  async login(loginData: ILoginRequest): Promise<{ token: string; user: IUser }> {
    const { email, password } = loginData;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new ApiError(401, 'Invalid credentials');
    }

    if (!user.isActive) {
      throw new ApiError(403, 'Account is not active');
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      throw new ApiError(401, 'Invalid credentials');
    }

    const token = tokenService.generateAuthToken({ userId: user.id, role: user.role });

    return { token, user };
  }

  async verifyEmail(token: string): Promise<void> {
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: { gt: new Date() }
      }
    });

    if (!user) {
      throw new ApiError(400, 'Invalid or expired token');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null
      }
    });
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return; // Don't reveal if user exists

    const resetToken = tokenService.generateRandomToken();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpires: new Date(Date.now() + config.RESET_TOKEN_EXPIRY)
      }
    });

    await emailService.sendPasswordResetEmail(user.email, resetToken);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: { gt: new Date() }
      }
    });

    if (!user) {
      throw new ApiError(400, 'Invalid or expired token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null
      }
    });
  }
}

export default new AuthService();