import { Request, Response } from 'express';
import authService from '../services/auth.service';
import apiResponse from '../utils/apiResponse';

class AuthController {
  async register(req: Request, res: Response) {
    const { email, password, role, name } = req.body;
    
    const { user, verificationToken } = await authService.register({
      email,
      password,
      role,
      name
    });

    apiResponse.sendSuccess(res, {
      message: 'Registration successful. Please check your email to verify your account.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      }
    });
  }

  async login(req: Request, res: Response) {
    const { email, password } = req.body;
    
    const { token, user } = await authService.login({ email, password });

    apiResponse.sendSuccess(res, {
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      }
    });
  }

  async verifyEmail(req: Request, res: Response) {
    const { token } = req.query;
    
    if (typeof token !== 'string') {
      throw new Error('Invalid token format');
    }

    await authService.verifyEmail(token);
    apiResponse.sendSuccess(res, { message: 'Email verified successfully' });
  }

  async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;
    
    await authService.forgotPassword(email);
    apiResponse.sendSuccess(res, { message: 'Password reset email sent if account exists' });
  }

  async resetPassword(req: Request, res: Response) {
    const { token, password } = req.body;
    
    await authService.resetPassword(token, password);
    apiResponse.sendSuccess(res, { message: 'Password reset successful' });
  }
}

export default new AuthController();