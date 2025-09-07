import dotenv from 'dotenv';
import path from 'path';
import { EnvConfig } from '../types';

// Only try to load .env in development
if (process.env.NODE_ENV !== 'production') {
  // Log current working directory and paths for debugging
  console.log('Current working directory:', process.cwd());
  console.log('__dirname:', __dirname);

  // Try multiple .env file locations
  const envPaths = [
    path.resolve(__dirname, '../../.env'),           // /app/be/.env
    path.resolve(__dirname, '../../../.env'),        // /app/.env
    path.resolve(process.cwd(), '.env'),             // {cwd}/.env
    path.resolve(process.cwd(), '../.env'),          // {cwd}/../.env
  ];

  console.log('Trying .env paths:', envPaths);

  // Try to load .env from multiple locations
  let envLoaded = false;
  for (const envPath of envPaths) {
    console.log(`Attempting to load .env from: ${envPath}`);
    const result = dotenv.config({ path: envPath });
    if (!result.error) {
      console.log(`✅ Successfully loaded .env from: ${envPath}`);
      envLoaded = true;
      break;
    } else {
      console.log(`❌ Failed to load from ${envPath}:`, result.error.message);
    }
  }

  if (!envLoaded) {
    console.log('⚠️  No .env file loaded - relying on system environment variables');
  }
} else {
  console.log('Production mode - skipping .env file, using Railway environment variables');
}

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

// Log all environment variables for debugging
console.log('=== ENVIRONMENT VARIABLES DEBUG ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('Available env vars:', Object.keys(process.env).filter(key => key.startsWith('SUPABASE') || key.includes('JWT')));

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
