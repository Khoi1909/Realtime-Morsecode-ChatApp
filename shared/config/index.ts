// Simple config without external dependencies or Node.js types

export interface BasicConfig {
  // Server configuration
  PORT: number | string;
  NODE_ENV: string;

  // Database configuration
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;

  // JWT configuration
  JWT_SECRET: string;
  JWT_EXPIRE_TIME: string;
  JWT_REFRESH_EXPIRE_TIME: string;

  // Cloudflare Turnstile
  TURNSTILE_SECRET_KEY: string;
  TURNSTILE_SITE_KEY: string;

  // Service URLs
  USER_SERVICE_URL: string;
  API_GATEWAY_URL: string;

  // CORS configuration
  CORS_ORIGIN: string;

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;

  // Logging
  LOG_LEVEL: string;
  LOG_FILE: string;
}

const getVar = (env: Record<string, string | undefined>, key: string, fallback?: string): string => {
  const value = env[key];
  if (value === undefined || value === '') {
    return fallback !== undefined ? fallback : '';
  }
  return value;
};

const getNum = (env: Record<string, string | undefined>, key: string, fallback: number): number => {
  const value = env[key];
  if (value === undefined || value === '') return fallback;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const requireVar = (env: Record<string, string | undefined>, key: string): string => {
  const value = env[key];
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const createBasicConfig = (env: Record<string, string | undefined>): BasicConfig => ({
  // Server configuration
  PORT: getVar(env, 'AUTH_SERVICE_PORT', '3001'),
  NODE_ENV: getVar(env, 'NODE_ENV', 'development'),

  // Database configuration
  SUPABASE_URL: requireVar(env, 'SUPABASE_URL'),
  SUPABASE_ANON_KEY: requireVar(env, 'SUPABASE_ANON_KEY'),
  SUPABASE_SERVICE_ROLE_KEY: requireVar(env, 'SUPABASE_SERVICE_ROLE_KEY'),

  // JWT configuration
  JWT_SECRET: requireVar(env, 'JWT_SECRET'),
  JWT_EXPIRE_TIME: getVar(env, 'JWT_EXPIRE_TIME', '7d'),
  JWT_REFRESH_EXPIRE_TIME: getVar(env, 'JWT_REFRESH_EXPIRE_TIME', '30d'),

  // Cloudflare Turnstile
  TURNSTILE_SECRET_KEY: requireVar(env, 'TURNSTILE_SECRET_KEY'),
  TURNSTILE_SITE_KEY: requireVar(env, 'TURNSTILE_SITE_KEY'),

  // Service URLs
  USER_SERVICE_URL: getVar(env, 'USER_SERVICE_URL', 'http://localhost:3002'),
  API_GATEWAY_URL: getVar(env, 'API_GATEWAY_URL', 'http://localhost:3000'),

  // CORS configuration
  CORS_ORIGIN: getVar(env, 'CORS_ORIGIN', 'http://localhost:5173'),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: getNum(env, 'RATE_LIMIT_WINDOW_MS', 900000),
  RATE_LIMIT_MAX_REQUESTS: getNum(env, 'RATE_LIMIT_MAX_REQUESTS', 100),

  // Logging
  LOG_LEVEL: getVar(env, 'LOG_LEVEL', 'info'),
  LOG_FILE: getVar(env, 'LOG_FILE', 'logs/auth-service.log'),
});

export default createBasicConfig;
