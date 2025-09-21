// Simple environment configuration without external dependencies
// This file should be self-contained and not require Node.js types

// Environment configuration interface
export interface EnvironmentConfig {
  // Server Configuration
  NODE_ENV: string;
  AUTH_SERVICE_PORT: number;
  DATABASE_SERVICE_PORT: number;
  USER_SERVICE_PORT: number;
  CHAT_SERVICE_PORT: number;
  ROOM_SERVICE_PORT: number;
  MORSE_SERVICE_PORT: number;
  API_GATEWAY_PORT: number;
  
  // Database Configuration
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  
  // Service URLs
  DATABASE_SERVICE_URL: string;
  AUTH_SERVICE_URL: string;
  USER_SERVICE_URL: string;
  CHAT_SERVICE_URL: string;
  ROOM_SERVICE_URL: string;
  MORSE_SERVICE_URL: string;
  
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

// Helper function to get environment variable safely
const getEnvVar = (name: string, defaultValue?: string): string => {
  // This will be implemented by individual services that have access to process.env
  return defaultValue || '';
};

// Helper function to get environment variable as number
const getEnvNumber = (name: string, defaultValue: number): number => {
  const value = getEnvVar(name);
  return value ? parseInt(value, 10) : defaultValue;
};

// Helper function to get environment variable as boolean
const getEnvBoolean = (name: string, defaultValue: boolean): boolean => {
  const value = getEnvVar(name);
  return value ? value === 'true' : defaultValue;
};

// Validate required environment variables
const validateEnvVar = (name: string, value: string): string => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

// Create environment configuration factory
export const createEnvironmentConfig = (envVars: Record<string, string | undefined>): EnvironmentConfig => {
  return {
    // Server Configuration
    NODE_ENV: envVars.NODE_ENV || 'development',
    AUTH_SERVICE_PORT: getEnvNumber('AUTH_SERVICE_PORT', 3001),
    DATABASE_SERVICE_PORT: getEnvNumber('DATABASE_SERVICE_PORT', 3002),
    USER_SERVICE_PORT: getEnvNumber('USER_SERVICE_PORT', 3003),
    CHAT_SERVICE_PORT: getEnvNumber('CHAT_SERVICE_PORT', 3004),
    ROOM_SERVICE_PORT: getEnvNumber('ROOM_SERVICE_PORT', 3005),
    MORSE_SERVICE_PORT: getEnvNumber('MORSE_SERVICE_PORT', 3007),
    API_GATEWAY_PORT: getEnvNumber('API_GATEWAY_PORT', 3000),
    
    // Database Configuration
    SUPABASE_URL: validateEnvVar('SUPABASE_URL', envVars.SUPABASE_URL || ''),
    SUPABASE_ANON_KEY: validateEnvVar('SUPABASE_ANON_KEY', envVars.SUPABASE_ANON_KEY || ''),
    SUPABASE_SERVICE_ROLE_KEY: validateEnvVar('SUPABASE_SERVICE_ROLE_KEY', envVars.SUPABASE_SERVICE_ROLE_KEY || ''),
    
    // Service URLs
    DATABASE_SERVICE_URL: envVars.DATABASE_SERVICE_URL || 'http://localhost:3002',
    AUTH_SERVICE_URL: envVars.AUTH_SERVICE_URL || 'http://localhost:3001',
    USER_SERVICE_URL: envVars.USER_SERVICE_URL || 'http://localhost:3003',
    CHAT_SERVICE_URL: envVars.CHAT_SERVICE_URL || 'http://localhost:3004',
    ROOM_SERVICE_URL: envVars.ROOM_SERVICE_URL || 'http://localhost:3005',
    MORSE_SERVICE_URL: envVars.MORSE_SERVICE_URL || 'http://localhost:3007',
    
    // Authentication & Security
    JWT_SECRET: validateEnvVar('JWT_SECRET', envVars.JWT_SECRET || ''),
    JWT_EXPIRE_TIME: envVars.JWT_EXPIRE_TIME || '7d',
    JWT_REFRESH_EXPIRE_TIME: envVars.JWT_REFRESH_EXPIRE_TIME || '30d',
    TURNSTILE_SECRET_KEY: envVars.TURNSTILE_SECRET_KEY || '',
    TURNSTILE_SITE_KEY: envVars.TURNSTILE_SITE_KEY || '',
    
    // CORS Configuration
    CORS_ORIGINS: envVars.CORS_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:3004',
      'http://localhost:3005',
      'http://localhost:3007'
    ],
    
    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: getEnvNumber('RATE_LIMIT_WINDOW_MS', 900000), // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: getEnvNumber('RATE_LIMIT_MAX_REQUESTS', 100),
    
    // Logging
    LOG_LEVEL: envVars.LOG_LEVEL || 'info',
    LOG_FILE_PATH: envVars.LOG_FILE_PATH || './logs/app.log',
    ERROR_LOG_FILE_PATH: envVars.ERROR_LOG_FILE_PATH || './logs/error.log',
    
    // Optional Services
    REDIS_URL: envVars.REDIS_URL,
    WEBSOCKET_PORT: envVars.WEBSOCKET_PORT ? parseInt(envVars.WEBSOCKET_PORT, 10) : undefined,
    MAX_FILE_SIZE: envVars.MAX_FILE_SIZE ? parseInt(envVars.MAX_FILE_SIZE, 10) : undefined,
    ALLOWED_FILE_TYPES: envVars.ALLOWED_FILE_TYPES,
    SMTP_HOST: envVars.SMTP_HOST,
    SMTP_PORT: envVars.SMTP_PORT ? parseInt(envVars.SMTP_PORT, 10) : undefined,
    SMTP_USER: envVars.SMTP_USER,
    SMTP_PASS: envVars.SMTP_PASS,
    OPENAI_API_KEY: envVars.OPENAI_API_KEY,
    GOOGLE_MAPS_API_KEY: envVars.GOOGLE_MAPS_API_KEY,
    
    // Development
    DEBUG: getEnvBoolean('DEBUG', false),
    HOT_RELOAD: getEnvBoolean('HOT_RELOAD', false),
    MOCK_EXTERNAL_SERVICES: getEnvBoolean('MOCK_EXTERNAL_SERVICES', false)
  };
};

// Helper functions
export const isDevelopment = (config: EnvironmentConfig): boolean => config.NODE_ENV === 'development';
export const isProduction = (config: EnvironmentConfig): boolean => config.NODE_ENV === 'production';
export const isStaging = (config: EnvironmentConfig): boolean => config.NODE_ENV === 'staging';

// Service-specific configurations
export const getServiceConfig = (config: EnvironmentConfig, serviceName: string) => {
  const servicePorts = {
    auth: config.AUTH_SERVICE_PORT,
    database: config.DATABASE_SERVICE_PORT,
    user: config.USER_SERVICE_PORT,
    chat: config.CHAT_SERVICE_PORT,
    room: config.ROOM_SERVICE_PORT,
    gateway: config.API_GATEWAY_PORT
  };
  
  const serviceUrls = {
    auth: config.AUTH_SERVICE_URL,
    database: config.DATABASE_SERVICE_URL,
    user: config.USER_SERVICE_URL,
    chat: config.CHAT_SERVICE_URL,
    room: config.ROOM_SERVICE_URL,
    gateway: `http://localhost:${config.API_GATEWAY_PORT}`
  };
  
  return {
    port: servicePorts[serviceName as keyof typeof servicePorts],
    url: serviceUrls[serviceName as keyof typeof serviceUrls]
  };
};

export default createEnvironmentConfig;
