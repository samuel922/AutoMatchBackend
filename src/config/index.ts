import dotenv from 'dotenv';

dotenv.config();

export default {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'your-secure-secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  RESET_TOKEN_EXPIRY: 3600000, // 1 hour
  EMAIL: {
    SERVICE: process.env.EMAIL_SERVICE || 'Gmail',
    USER: process.env.EMAIL_USER || 'your-email@gmail.com',
    PASS: process.env.EMAIL_PASS || 'your-email-password'
  },
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
  NODE_ENV: process.env.NODE_ENV || 'development'
};