// src/interfaces/request.interface.ts
import { Request } from 'express';
import { User } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: Omit<User, 'password'>; // Exclude sensitive fields
}