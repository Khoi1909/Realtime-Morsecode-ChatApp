import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from root directory
// Go up from services/auth-service/ to root (2 levels up)
const rootDir = path.resolve(process.cwd(), '../../');
const envPath = path.join(rootDir, '.env');

// Load the environment file
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.warn('Warning: Could not load .env file from:', envPath);
  console.warn('Error:', result.error.message);
}

// Environment configuration interface
export interface EnvironmentConfig {
  // Server Configuration
  NODE_ENV: string;
  AUTH_SERVICE_PORT: number;
  USER_SERVICE_PORT: number;
  CHAT_SERVICE_PORT: number;
  ROOM_SERVICE_PORT: number;
  API_GATEWAY_PORT: number;
  
  // Database Configuration
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  
  // Service URLs
  AUTH_SERVICE_URL: string;
  USER_SERVICE_URL: string;
  CHAT_SERVICE_URL: string;
  ROOM_SERVICE_URL: string;
  
  // Authentication & Security
  JWT_SECRET: string;
  JWT_EXPIRE_TIME: string;
  JWT_REFRESH_EXPIRE_TIME: string;
  TURNSTILE_SECRET_KEY: string;
  TURNSTILE_SITE_KEY: string;
  
  // CORS Configuration
  CORS_ORIGINS: string[];
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  
  // Logging
  LOG_LEVEL: string;
  LOG_FILE_PATH: string;
  ERROR_LOG_FILE_PATH: string;
  
  // Optional Services
  REDIS_URL?: string;
  WEBSOCKET_PORT?: number;
  MAX_FILE_SIZE?: number;
  ALLOWED_FILE_TYPES?: string;
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  OPENAI_API_KEY?: string;
  GOOGLE_MAPS_API_KEY?: string;
  
  // Development
  DEBUG: boolean;
  HOT_RELOAD: boolean;
  MOCK_EXTERNAL_SERVICES: boolean;
}

// Validate required environment variables
const validateEnvVar = (name: string, value: string | undefined): string => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

// Create environment configuration
export const createEnvironmentConfig = (): EnvironmentConfig => {
  return {
    // Server Configuration
    NODE_ENV: process.env.NODE_ENV || 'development',
    AUTH_SERVICE_PORT: parseInt(process.env.AUTH_SERVICE_PORT || '3001'),
    USER_SERVICE_PORT: parseInt(process.env.USER_SERVICE_PORT || '3006'),
    CHAT_SERVICE_PORT: parseInt(process.env.CHAT_SERVICE_PORT || '3007'),
    ROOM_SERVICE_PORT: parseInt(process.env.ROOM_SERVICE_PORT || '3008'),
    API_GATEWAY_PORT: parseInt(process.env.API_GATEWAY_PORT || '2004'),
    
    // Database Configuration
    SUPABASE_URL: validateEnvVar('SUPABASE_URL', process.env.SUPABASE_URL),
    SUPABASE_ANON_KEY: validateEnvVar('SUPABASE_ANON_KEY', process.env.SUPABASE_ANON_KEY),
    SUPABASE_SERVICE_ROLE_KEY: validateEnvVar('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY),
    
    // Service URLs
    AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    USER_SERVICE_URL: process.env.USER_SERVICE_URL || 'http://localhost:3006',
    CHAT_SERVICE_URL: process.env.CHAT_SERVICE_URL || 'http://localhost:3007',
    ROOM_SERVICE_URL: process.env.ROOM_SERVICE_URL || 'http://localhost:3008',
    
    // Authentication & Security
    JWT_SECRET: validateEnvVar('JWT_SECRET', process.env.JWT_SECRET),
    JWT_EXPIRE_TIME: process.env.JWT_EXPIRE_TIME || '7d',
    JWT_REFRESH_EXPIRE_TIME: process.env.JWT_REFRESH_EXPIRE_TIME || '30d',
    TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY || '',
    TURNSTILE_SITE_KEY: process.env.TURNSTILE_SITE_KEY || '',
    
    // CORS Configuration
    CORS_ORIGINS: process.env.CORS_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:3004',
      'http://localhost:3005'
    ],
    
    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    
    // Logging
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    LOG_FILE_PATH: process.env.LOG_FILE_PATH || './logs/app.log',
    ERROR_LOG_FILE_PATH: process.env.ERROR_LOG_FILE_PATH || './logs/error.log',
    
    // Optional Services
    REDIS_URL: process.env.REDIS_URL,
    WEBSOCKET_PORT: process.env.WEBSOCKET_PORT ? parseInt(process.env.WEBSOCKET_PORT) : undefined,
    MAX_FILE_SIZE: process.env.MAX_FILE_SIZE ? parseInt(process.env.MAX_FILE_SIZE) : undefined,
    ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : undefined,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
    
    // Development
    DEBUG: process.env.DEBUG === 'true',
    HOT_RELOAD: process.env.HOT_RELOAD === 'true',
    MOCK_EXTERNAL_SERVICES: process.env.MOCK_EXTERNAL_SERVICES === 'true'
  };
};

// Export the configuration instance
export const env = createEnvironmentConfig();

// Helper functions
export const isDevelopment = (): boolean => env.NODE_ENV === 'development';
export const isProduction = (): boolean => env.NODE_ENV === 'production';
export const isStaging = (): boolean => env.NODE_ENV === 'staging';

// Service-specific configurations
export const getServiceConfig = (serviceName: string) => {
  const servicePorts = {
    auth: env.AUTH_SERVICE_PORT,
    user: env.USER_SERVICE_PORT,
    chat: env.CHAT_SERVICE_PORT,
    room: env.ROOM_SERVICE_PORT,
    gateway: env.API_GATEWAY_PORT
  };
  
  const serviceUrls = {
    auth: env.AUTH_SERVICE_URL,
    user: env.USER_SERVICE_URL,
    chat: env.CHAT_SERVICE_URL,
    room: env.ROOM_SERVICE_URL,
    gateway: `http://localhost:${env.API_GATEWAY_PORT}`
  };
  
  return {
    port: servicePorts[serviceName as keyof typeof servicePorts],
    url: serviceUrls[serviceName as keyof typeof serviceUrls]
  };
};

export default env;
