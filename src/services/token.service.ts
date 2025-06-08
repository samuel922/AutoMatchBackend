import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../config';
import { JwtPayload } from '../interfaces/auth.interfaces';

class TokenService {
  public JWT_EXPIRES_IN: number = 
  Number(process.env.JWT_EXPIRES_IN_SECONDS)   // e.g. set env as "86400"
  || 24 * 60 * 60; 
  
  private JWT_SECRET = process.env.JWT_SECRET || 'your-secure-secret-key-here';

  generateAuthToken(payload: JwtPayload): string {
    return jwt.sign(payload, this.JWT_SECRET, { expiresIn: this.JWT_EXPIRES_IN });
  }

  generateRandomToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  verifyToken(token: string): { userId: number; role: string } {
    return jwt.verify(token, config.JWT_SECRET) as { userId: number; role: string };
  }
}

export default new TokenService();