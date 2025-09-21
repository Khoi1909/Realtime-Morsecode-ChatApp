import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/environment';

// JWT helper functions
export const jwtHelpers = {
  // Generate access token
  generateAccessToken(payload: { userId: string; email: string; username: string }): string {
    return jwt.sign(
      {
        sub: payload.userId,
        email: payload.email,
        username: payload.username,
        type: 'access'
      },
      env.JWT_SECRET,
      {
        expiresIn: env.JWT_EXPIRE_TIME,
        issuer: 'auth-service',
        audience: 'morse-chat-app'
      } as SignOptions
    );
  },

  // Generate refresh token
  generateRefreshToken(payload: { userId: string; email: string }): string {
    return jwt.sign(
      {
        sub: payload.userId,
        email: payload.email,
        type: 'refresh'
      },
      env.JWT_SECRET,
      {
        expiresIn: env.JWT_REFRESH_EXPIRE_TIME,
        issuer: 'auth-service',
        audience: 'morse-chat-app'
      } as SignOptions
    );
  },

  // Verify access token
  verifyAccessToken(token: string): { userId: string; email: string; username: string } | null {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET, {
        issuer: 'auth-service',
        audience: 'morse-chat-app'
      }) as any;

      if (decoded.type !== 'access') {
        return null;
      }

      return {
        userId: decoded.sub,
        email: decoded.email,
        username: decoded.username
      };
    } catch (error) {
      return null;
    }
  },

  // Verify refresh token
  verifyRefreshToken(token: string): { userId: string; email: string } | null {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET, {
        issuer: 'auth-service',
        audience: 'morse-chat-app'
      }) as any;

      if (decoded.type !== 'refresh') {
        return null;
      }

      return {
        userId: decoded.sub,
        email: decoded.email
      };
    } catch (error) {
      return null;
    }
  },

  // Extract token from Authorization header
  extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }
    
    return parts[1];
  },

  // Generate token pair
  generateTokenPair(user: { id: string; email: string; username: string }) {
    const accessToken = this.generateAccessToken({
      userId: user.id,
      email: user.email,
      username: user.username
    });

    const refreshToken = this.generateRefreshToken({
      userId: user.id,
      email: user.email
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: env.JWT_EXPIRE_TIME
    };
  }
};

export default jwtHelpers;
