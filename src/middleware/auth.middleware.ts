import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../interfaces/request.interfaces';
import tokenService from '../services/token.service';
import { ApiError } from '../utils/apiError';
import { JwtPayload } from '../interfaces/auth.interfaces';
import { prisma } from '../services/prisma.service'; // Import prisma instance

const authMiddleware = (roles?: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      if (!token) throw new ApiError(401, 'Authentication required');

      const payload = tokenService.verifyToken(token) as JwtPayload;
      
      // Load the user record using the imported prisma instance
      const user = await prisma.user.findUnique({ 
        where: { id: payload.userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          emailVerified: true,
          emailVerificationToken: true,
          emailVerificationExpires: true,
          resetToken: true,
          resetTokenExpires: true
        }
      });
      
      if (!user) throw new ApiError(401, 'User not found');
      if (!user.isActive) throw new ApiError(403, 'Account is inactive');

      req.user = user;
      
      if (roles && !roles.includes(user.role)) {
        throw new ApiError(403, 'Insufficient permissions');
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

export default authMiddleware;