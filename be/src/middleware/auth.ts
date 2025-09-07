import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthUser, JwtPayload } from '../types';
import config from '../utils/config';
import ApiError from '../utils/ApiError';
import SupabaseService from '../services/supabase';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError('Access token is required', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify JWT token
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;
    } catch (error) {
      throw new ApiError('Invalid or expired token', 401);
    }

    // Verify token with Supabase
    const supabase = SupabaseService.getInstance().getClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new ApiError('Invalid token or user not found', 401);
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email || '',
      role: user.role || 'authenticated',
      aud: user.aud || '',
      exp: decoded.exp,
      iat: decoded.iat,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;
      
      const supabase = SupabaseService.getInstance().getClient();
      const { data: { user } } = await supabase.auth.getUser(token);

      if (user) {
        req.user = {
          id: user.id,
          email: user.email || '',
          role: user.role || 'authenticated',
          aud: user.aud || '',
          exp: decoded.exp,
          iat: decoded.iat,
        };
      }
    } catch (error) {
      // Invalid token, but continue without authentication
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new ApiError('Authentication required', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new ApiError('Insufficient permissions', 403);
    }

    next();
  };
};
