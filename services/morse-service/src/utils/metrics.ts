// Prometheus metrics for Morse Service
import { register, Counter, Histogram, Gauge } from 'prom-client';

// Translation metrics
export const translationCounter = new Counter({
  name: 'morse_translations_total',
  help: 'Total number of morse code translations',
  labelNames: ['direction', 'status', 'user_id']
});

export const translationDuration = new Histogram({
  name: 'morse_translation_duration_seconds',
  help: 'Duration of morse code translations in seconds',
  labelNames: ['direction', 'user_id'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
});

export const translationInputLength = new Histogram({
  name: 'morse_translation_input_length',
  help: 'Length of input text/morse code',
  labelNames: ['direction', 'user_id'],
  buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000]
});

export const translationOutputLength = new Histogram({
  name: 'morse_translation_output_length',
  help: 'Length of output morse code/text',
  labelNames: ['direction', 'user_id'],
  buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000]
});

// Validation metrics
export const validationCounter = new Counter({
  name: 'morse_validations_total',
  help: 'Total number of morse code validations',
  labelNames: ['type', 'result', 'user_id']
});

// Service health metrics
export const activeConnections = new Gauge({
  name: 'morse_service_active_connections',
  help: 'Number of active connections to morse service'
});

export const serviceUptime = new Gauge({
  name: 'morse_service_uptime_seconds',
  help: 'Service uptime in seconds'
});

// Error metrics
export const errorCounter = new Counter({
  name: 'morse_service_errors_total',
  help: 'Total number of errors in morse service',
  labelNames: ['error_type', 'endpoint', 'user_id']
});

// Request metrics
export const requestCounter = new Counter({
  name: 'morse_service_requests_total',
  help: 'Total number of requests to morse service',
  labelNames: ['method', 'endpoint', 'status_code', 'user_id']
});

export const requestDuration = new Histogram({
  name: 'morse_service_request_duration_seconds',
  help: 'Duration of requests to morse service',
  labelNames: ['method', 'endpoint', 'status_code', 'user_id'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
});

// Helper functions for metrics
export const recordTranslation = (direction: string, status: 'success' | 'error', userId?: string, duration?: number, inputLength?: number, outputLength?: number) => {
  translationCounter.inc({ direction, status, user_id: userId || 'anonymous' });
  
  if (duration !== undefined) {
    translationDuration.observe({ direction, user_id: userId || 'anonymous' }, duration / 1000);
  }
  
  if (inputLength !== undefined) {
    translationInputLength.observe({ direction, user_id: userId || 'anonymous' }, inputLength);
  }
  
  if (outputLength !== undefined) {
    translationOutputLength.observe({ direction, user_id: userId || 'anonymous' }, outputLength);
  }
};

export const recordValidation = (type: 'morse' | 'text', result: 'valid' | 'invalid', userId?: string) => {
  validationCounter.inc({ type, result, user_id: userId || 'anonymous' });
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
