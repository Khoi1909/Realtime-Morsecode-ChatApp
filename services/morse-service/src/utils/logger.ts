// Enhanced logger for Morse Service
import { env } from '../config/environment';

// Simple logger implementation for Morse Service
class MorseServiceLogger {
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

// Create Morse Service logger instance
const morseLogger = new MorseServiceLogger('morse-service', env.LOG_LEVEL);

// Export logger functions
export const logInfo = (message: string, meta?: any) => morseLogger.info(message, meta);
export const logError = (message: string, error?: Error, meta?: any) => morseLogger.error(message, error, meta);
export const logWarn = (message: string, meta?: any) => morseLogger.warn(message, meta);
export const logDebug = (message: string, meta?: any) => morseLogger.debug(message, meta);

export interface TranslationLogData {
  userId?: string;
  userEmail?: string;
  sessionId?: string;
  requestSource?: string;
  correlationId?: string;
  direction?: string;
  inputLength?: number;
  outputLength?: number;
  duration?: string;
  input?: string;
  output?: string;
}

export const logTranslationRequest = (data: TranslationLogData) => {
  logInfo(`Translation requested`, {
    userId: data.userId || 'anonymous',
    direction: data.direction,
    inputLength: data.inputLength || 0,
    requestSource: data.requestSource || 'unknown',
    correlationId: data.correlationId
  });
};

export const logTranslationSuccess = (data: TranslationLogData) => {
  logInfo(`Translation completed`, {
    userId: data.userId || 'anonymous',
    direction: data.direction,
    inputLength: data.inputLength || 0,
    outputLength: data.outputLength || 0,
    duration: data.duration,
    requestSource: data.requestSource || 'unknown',
    correlationId: data.correlationId
  });
};

export const logTranslationError = (error: Error, data: TranslationLogData) => {
  logError(`Translation failed`, error, {
    userId: data.userId || 'anonymous',
    direction: data.direction,
    inputLength: data.inputLength || 0,
    duration: data.duration,
    requestSource: data.requestSource || 'unknown',
    correlationId: data.correlationId
  });
};

export const logValidationRequest = (data: TranslationLogData) => {
  logDebug(`Validation requested`, {
    userId: data.userId || 'anonymous',
    requestSource: data.requestSource || 'unknown',
    correlationId: data.correlationId
  });
};

export const logValidationResult = (isValid: boolean, data: TranslationLogData) => {
  logInfo(`Validation result: ${isValid ? 'valid' : 'invalid'}`, {
    userId: data.userId || 'anonymous',
    requestSource: data.requestSource || 'unknown',
    correlationId: data.correlationId
  });
};
