import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET || 'fallback_jwt_secret_value_12389',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback_jwt_refresh_secret_value_12389',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  nodeEnv: process.env.NODE_ENV || 'development'
};
