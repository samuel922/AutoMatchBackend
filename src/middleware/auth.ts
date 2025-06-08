import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0';

interface AuthRequest extends Request {
  user?: {
    userId: number;
    role: string;
    [key: string]: any;
  };
}

export const authenticateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number, role: string };
    const user = await prisma.user.findUnique({ 
      where: { id: decoded.userId },
      include: {
        buyerProfile: true,
        sellerProfile: true,
        adminProfile: true
      }
    });

    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    req.user = { 
      userId: user.id,
      role: user.role,
      ...(user.buyerProfile && { buyerId: user.buyerProfile.id }),
      ...(user.sellerProfile && { sellerId: user.sellerProfile.id }),
      ...(user.adminProfile && { adminId: user.adminProfile.id })
    };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const authenticateBuyer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  await authenticateUser(req, res, () => {
    if (req.user?.role !== 'BUYER') {
      return res.status(403).json({ error: 'Buyer access required' });
    }
    next();
  });
};

export const authenticateSeller = async (req: AuthRequest, res: Response, next: NextFunction) => {
  await authenticateUser(req, res, () => {
    if (req.user?.role !== 'SELLER') {
      return res.status(403).json({ error: 'Seller access required' });
    }
    next();
  });
};

export const authenticateAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  await authenticateUser(req, res, () => {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
};