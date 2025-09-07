import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types';
import logger from '../utils/logger';
import ApiResponseUtil from '../utils/ApiResponse';
import config from '../utils/config';

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let error = { ...err } as AppError;
  error.message = err.message;

  // Don't log common auth errors as errors (they're expected)
  if (error.statusCode === 401 && 
      (error.message.includes('token') || error.message.includes('unauthorized'))) {
    logger.debug(`Auth error: ${error.message}`);
  } else {
    // Log other errors
    logger.error(err);
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { ...error, statusCode: 404, message };
  }

  // Mongoose duplicate key
  if (err.name === 'MongoError' && 'code' in err && (err as any).code === 11000) {
    const message = 'Duplicate field value entered';
    error = { ...error, statusCode: 400, message };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values((err as any).errors).map((val: any) => val.message).join(', ');
    error = { ...error, statusCode: 400, message };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token. Please log in again!';
    error = { ...error, statusCode: 401, message };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Your token has expired! Please log in again.';
    error = { ...error, statusCode: 401, message };
  }

  // Supabase errors
  if (err.message?.includes('JWT expired')) {
    const message = 'Session expired. Please log in again.';
    error = { ...error, statusCode: 401, message };
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  res.status(statusCode).json(
    ApiResponseUtil.error(
      message,
      config.NODE_ENV === 'development' ? err.stack : undefined
    )
  );
};
