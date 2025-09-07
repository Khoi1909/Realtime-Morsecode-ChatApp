import dotenv from 'dotenv';
import path from 'path';
import { EnvConfig } from '../types';

// Load environment variables from root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config: EnvConfig = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3001', 10),
  HOST: process.env.HOST || 'localhost',
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret_key_change_in_production',
  JWT_EXPIRE_TIME: process.env.JWT_EXPIRE_TIME || '7d',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
  UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  REDIS_URL: process.env.REDIS_URL,
  TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
};

// Validate required environment variables
const requiredVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
const missingVars = requiredVars.filter(varName => !config[varName as keyof EnvConfig]);

// Log environment variable status for debugging
console.log('Environment variables status:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  console.log(`  ${varName}: ${value ? 'SET' : 'MISSING'}`);
});

if (missingVars.length > 0 && config.NODE_ENV === 'production') {
  console.warn(`Warning: Missing environment variables: ${missingVars.join(', ')}`);
  console.warn('Server will start but database functionality may not work properly');
}

export default config;
