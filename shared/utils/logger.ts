// Simple logger implementation without external dependencies
export interface LogLevel {
  INFO: 'info';
  ERROR: 'error';
  WARN: 'warn';
  DEBUG: 'debug';
}

export const LOG_LEVELS: LogLevel = {
  INFO: 'info',
  ERROR: 'error',
  WARN: 'warn',
  DEBUG: 'debug'
};

// Simple logger class
class SimpleLogger {
  private serviceName: string;
  private logLevel: string;

  constructor(serviceName: string = 'service', logLevel: string = 'info') {
    this.serviceName = serviceName;
    this.logLevel = logLevel;
  }

  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level.toUpperCase()}] [${this.serviceName}]: ${message}${metaStr}`;
  }

  info(message: string, meta?: any): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, meta));
    }
  }

  error(message: string, error?: Error, meta?: any): void {
    if (this.shouldLog('error')) {
      const errorInfo = error ? ` Error: ${error.message}${error.stack ? `\n${error.stack}` : ''}` : '';
      console.error(this.formatMessage('error', message, meta) + errorInfo);
    }
  }

  warn(message: string, meta?: any): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, meta));
    }
  }

  debug(message: string, meta?: any): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, meta));
    }
  }
}

// Create logger instance
const logger = new SimpleLogger('morse-service', process.env.LOG_LEVEL || 'info');

// Add request ID to logs
export const addRequestId = (req: any, res: any, next: any) => {
  const requestId = req.headers['x-request-id'] || 
                   req.headers['x-correlation-id'] || 
                   `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  
  next();
};

// Logging helper functions
export const logInfo = (message: string, meta?: any) => {
  logger.info(message, meta);
};

export const logError = (message: string, error?: Error, meta?: any) => {
  logger.error(message, error, meta);
};

export const logWarn = (message: string, meta?: any) => {
  logger.warn(message, meta);
};

export const logDebug = (message: string, meta?: any) => {
  logger.debug(message, meta);
};

// Express middleware for request logging
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
      ip: req.ip || req.connection.remoteAddress
    };
    
    if (res.statusCode >= 400) {
      logWarn(`HTTP ${req.method} ${req.url}`, logData);
    } else {
      logInfo(`HTTP ${req.method} ${req.url}`, logData);
    }
  });
  
  next();
};

export default logger;
