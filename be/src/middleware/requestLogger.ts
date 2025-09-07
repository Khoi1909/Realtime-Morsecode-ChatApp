import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  // Override res.end to log response time
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any): Response {
    const duration = Date.now() - start;
    
    logger.http(
      `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms - ${req.ip}`
    );

    originalEnd.call(this, chunk, encoding);
    return this;
  };

  next();
};
