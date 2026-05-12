import dotenv from 'dotenv';
dotenv.config();

const rawOrigins = process.env.CORS_ORIGINS || 'http://localhost:5173';

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigins: rawOrigins === '*' ? '*' : rawOrigins.split(',').map(o => o.trim()),
};
