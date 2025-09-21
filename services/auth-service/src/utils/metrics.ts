// Prometheus metrics for Auth Service
import { register, Counter, Histogram, Gauge } from 'prom-client';

// Authentication metrics
export const authCounter = new Counter({
  name: 'auth_operations_total',
  help: 'Total number of authentication operations',
  labelNames: ['operation', 'status', 'user_id']
});

export const authDuration = new Histogram({
  name: 'auth_operation_duration_seconds',
  help: 'Duration of authentication operations in seconds',
  labelNames: ['operation', 'user_id'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
});

// JWT metrics
export const jwtTokenGenerated = new Counter({
  name: 'jwt_tokens_generated_total',
  help: 'Total number of JWT tokens generated',
  labelNames: ['token_type', 'user_id']
});

export const jwtTokenValidated = new Counter({
  name: 'jwt_tokens_validated_total',
  help: 'Total number of JWT tokens validated',
  labelNames: ['status', 'user_id']
});

// User metrics
export const userRegistrations = new Counter({
  name: 'user_registrations_total',
  help: 'Total number of user registrations',
  labelNames: ['status']
});

export const userLogins = new Counter({
  name: 'user_logins_total',
  help: 'Total number of user logins',
  labelNames: ['status', 'user_id']
});

export const userLogouts = new Counter({
  name: 'user_logouts_total',
  help: 'Total number of user logouts',
  labelNames: ['user_id']
});

// Service health metrics
export const activeSessions = new Gauge({
  name: 'auth_service_active_sessions',
  help: 'Number of active user sessions'
});

export const serviceUptime = new Gauge({
  name: 'auth_service_uptime_seconds',
  help: 'Service uptime in seconds'
});

// Error metrics
export const errorCounter = new Counter({
  name: 'auth_service_errors_total',
  help: 'Total number of errors in auth service',
  labelNames: ['error_type', 'endpoint', 'user_id']
});

// Request metrics
export const requestCounter = new Counter({
  name: 'auth_service_requests_total',
  help: 'Total number of requests to auth service',
  labelNames: ['method', 'endpoint', 'status_code', 'user_id']
});

export const requestDuration = new Histogram({
  name: 'auth_service_request_duration_seconds',
  help: 'Duration of requests to auth service',
  labelNames: ['method', 'endpoint', 'status_code', 'user_id'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
});

// Helper functions for metrics
export const recordAuthOperation = (operation: string, status: 'success' | 'error', userId?: string, duration?: number) => {
  authCounter.inc({ operation, status, user_id: userId || 'anonymous' });
  
  if (duration !== undefined) {
    authDuration.observe({ operation, user_id: userId || 'anonymous' }, duration / 1000);
  }
};

export const recordJWTGeneration = (tokenType: 'access' | 'refresh', userId?: string) => {
  jwtTokenGenerated.inc({ token_type: tokenType, user_id: userId || 'anonymous' });
};

export const recordJWTValidation = (status: 'valid' | 'invalid' | 'expired', userId?: string) => {
  jwtTokenValidated.inc({ status, user_id: userId || 'anonymous' });
};

export const recordUserRegistration = (status: 'success' | 'error') => {
  userRegistrations.inc({ status });
};

export const recordUserLogin = (status: 'success' | 'error', userId?: string) => {
  userLogins.inc({ status, user_id: userId || 'anonymous' });
};

export const recordUserLogout = (userId?: string) => {
  userLogouts.inc({ user_id: userId || 'anonymous' });
};

export const recordError = (errorType: string, endpoint: string, userId?: string) => {
  errorCounter.inc({ error_type: errorType, endpoint, user_id: userId || 'anonymous' });
};

export const recordRequest = (method: string, endpoint: string, statusCode: number, userId?: string, duration?: number) => {
  requestCounter.inc({ method, endpoint, status_code: statusCode.toString(), user_id: userId || 'anonymous' });
  
  if (duration !== undefined) {
    requestDuration.observe({ method, endpoint, status_code: statusCode.toString(), user_id: userId || 'anonymous' }, duration / 1000);
  }
};

// Initialize uptime tracking
const startTime = Date.now();
setInterval(() => {
  serviceUptime.set((Date.now() - startTime) / 1000);
}, 1000);

export default register;
