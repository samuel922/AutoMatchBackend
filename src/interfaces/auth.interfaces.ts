export interface IUser {
  id: number;
  email: string;
  password: string;
  role: 'BUYER' | 'SELLER' | 'ADMIN';
  isActive: boolean;
  emailVerified: boolean;
  resetToken?: string | null;
  resetTokenExpires?: Date | null;
}

export interface IAuthResponse {
  token: string;
  user: {
    id: number;
    email: string;
    role: string;
  };
}

export interface IRegisterRequest {
  email: string;
  password: string;
  role: 'BUYER' | 'SELLER' | 'ADMIN';
  name?: string;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface JwtPayload {
  userId: number;
  role: string;
}