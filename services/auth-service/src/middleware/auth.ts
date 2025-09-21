import { Request, Response, NextFunction } from 'express';
import { jwtHelpers } from '../utils/jwt';
import { AuthUser } from '@shared/types';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Authentication middleware
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = jwtHelpers.extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access token required',
        message: 'Please provide a valid access token'
      });
      return;
    }

    const payload = jwtHelpers.verifyAccessToken(token);
    if (!payload) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        message: 'Please provide a valid access token'
      });
      return;
    }

    // Add user info to request
    req.user = {
      id: payload.userId,
      email: payload.email,
      username: payload.username,
      created_at: '',
      updated_at: ''
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
      message: 'Internal server error during authentication'
    });
    return;
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = jwtHelpers.extractTokenFromHeader(authHeader);

    if (token) {
      const payload = jwtHelpers.verifyAccessToken(token);
      if (payload) {
        req.user = {
          id: payload.userId,
          email: payload.email,
          username: payload.username,
          created_at: '',
          updated_at: ''
        };
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    // Don't fail, just continue without user
    next();
  }
};

// Admin authentication middleware
export const requireAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Please provide a valid access token'
      });
      return;
    }

    // TODO: Add admin role check when user roles are implemented
    // For now, we'll skip this check
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Admin authentication failed',
      message: 'Internal server error during admin authentication'
    });
    return;
  }
};

export default authenticateToken;
