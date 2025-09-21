// Dedicated logger for Auth Service
import { env } from '../config/environment';

// Simple logger implementation for Auth Service
class AuthServiceLogger {
  private serviceName: string;
  private logLevel: string;

  constructor(serviceName: string, logLevel: string = 'info') {
    this.serviceName = serviceName;
    this.logLevel = logLevel;
  }

  private shouldLog(level: string): boolean {
    const levels = ['error', 'warn', 'info', 'debug'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= currentLevelIndex;
  }

  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level.toUpperCase()}] [${this.serviceName}]: ${message}${metaStr}`;
  }

  info(message: string, meta?: any) {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, meta));
    }
  }

  error(message: string, error?: Error, meta?: any) {
    if (this.shouldLog('error')) {
      const errorMeta = error ? { error: error.message, stack: error.stack, ...meta } : meta;
      console.error(this.formatMessage('error', message, errorMeta));
    }
  }

  warn(message: string, meta?: any) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, meta));
    }
  }

  debug(message: string, meta?: any) {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, meta));
    }
  }
}

// Create Auth Service logger instance
const authLogger = new AuthServiceLogger('auth-service', env.LOG_LEVEL);

// Export logger functions
export const logInfo = (message: string, meta?: any) => authLogger.info(message, meta);
export const logError = (message: string, error?: Error, meta?: any) => authLogger.error(message, error, meta);
export const logWarn = (message: string, meta?: any) => authLogger.warn(message, meta);
export const logDebug = (message: string, meta?: any) => authLogger.debug(message, meta);

// Request logging middleware
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      userId: req.userId || 'anonymous',
      ip: req.ip || req.connection.remoteAddress
    };
    
    if (res.statusCode >= 400) {
      logError('HTTP Request Error', undefined, logData);
    } else {
      logInfo('HTTP Request', logData);
    }
  });
  
  next();
};

export default authLogger;
