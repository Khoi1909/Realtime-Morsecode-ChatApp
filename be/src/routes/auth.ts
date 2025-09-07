import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validate, schemas } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import SupabaseService from '../services/supabase';
import ApiResponseUtil from '../utils/ApiResponse';
import ApiError from '../utils/ApiError';
import config from '../utils/config';
import logger from '../utils/logger';
import validateTurnstileToken from '../utils/turnstile';

const router = express.Router();

// Sign up
router.post('/signup', validate(schemas.signUp), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, username, displayName, turnstileToken } = req.body;
    
    // Validate Turnstile token
    if (turnstileToken) {
      const isValidToken = await validateTurnstileToken(turnstileToken, req.ip);
      if (!isValidToken) {
        throw new ApiError('Security verification failed. Please try again.', 400);
      }
    }
    
    const supabase = SupabaseService.getInstance().getClient();

    // Check if username is already taken
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('username')
      .eq('username', username)
      .single();

    if (existingUser) {
      throw new ApiError('Username is already taken', 400);
    }

    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          display_name: displayName || username,
        },
      },
    });

    if (error) {
      throw new ApiError(error.message, 400);
    }

    if (!data.user) {
      throw new ApiError('Failed to create user', 400);
    }

    logger.info(`New user registered: ${email}`);

    res.status(201).json(ApiResponseUtil.success({
      user: {
        id: data.user.id,
        email: data.user.email,
        username,
        displayName: displayName || username,
        avatarUrl: null,
        isOnline: false,
        lastSeen: new Date().toISOString(),
        createdAt: new Date().toISOString()
      },
      token: data.session?.access_token || null,
    }, 'User registered successfully'));

  } catch (error) {
    next(error);
  }
});

// Sign in
router.post('/login', validate(schemas.signIn), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, turnstileToken } = req.body;
    
    // Validate Turnstile token
    if (turnstileToken) {
      const isValidToken = await validateTurnstileToken(turnstileToken, req.ip);
      if (!isValidToken) {
        throw new ApiError('Security verification failed. Please try again.', 400);
      }
    }
    
    const supabase = SupabaseService.getInstance().getClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new ApiError('Invalid email or password', 401);
    }

    if (!data.user || !data.session) {
      throw new ApiError('Authentication failed', 401);
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      logger.error('Failed to fetch user profile:', profileError);
    }

    logger.info(`User signed in: ${email}`);

    res.json(ApiResponseUtil.success({
      user: {
        id: data.user.id,
        email: data.user.email,
        username: profile?.username || '',
        displayName: profile?.display_name || '',
        avatarUrl: profile?.avatar_url || null,
        bio: profile?.bio || '',
        isOnline: true,
        lastSeen: new Date().toISOString(),
        createdAt: profile?.created_at || new Date().toISOString()
      },
      token: data.session.access_token,
    }, 'Login successful'));

  } catch (error) {
    next(error);
  }
});

// Sign out
router.post('/logout', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supabase = SupabaseService.getInstance().getClient();
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw new ApiError(error.message, 400);
    }

    logger.info(`User signed out: ${req.user?.email}`);

    res.json(ApiResponseUtil.success(null, 'Logout successful'));

  } catch (error) {
    next(error);
  }
});

// Refresh token
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      throw new ApiError('Refresh token is required', 400);
    }

    const supabase = SupabaseService.getInstance().getClient();
    
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token,
    });

    if (error || !data.session) {
      throw new ApiError('Invalid refresh token', 401);
    }

    res.json(ApiResponseUtil.success({
      token: data.session.access_token,
    }, 'Token refreshed successfully'));

  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supabase = SupabaseService.getInstance().getClient();
    
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', req.user!.id)
      .single();

    if (error) {
      throw new ApiError('User profile not found', 404);
    }

    res.json(ApiResponseUtil.success({
      id: req.user!.id,
      email: req.user!.email,
      username: profile.username,
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
      bio: profile.bio,
      isOnline: profile.is_online,
      lastSeen: profile.last_seen,
      createdAt: profile.created_at
    }, 'User profile retrieved'));

  } catch (error) {
    next(error);
  }
});

// Verify email
router.post('/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, type } = req.body;

    if (!token || !type) {
      throw new ApiError('Token and type are required', 400);
    }

    const supabase = SupabaseService.getInstance().getClient();
    
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: type as any,
    });

    if (error) {
      throw new ApiError(error.message, 400);
    }

    res.json(ApiResponseUtil.success(data, 'Email verified successfully'));

  } catch (error) {
    next(error);
  }
});

// Reset password request
router.post('/reset-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new ApiError('Email is required', 400);
    }

    const supabase = SupabaseService.getInstance().getClient();
    
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      throw new ApiError(error.message, 400);
    }

    res.json(ApiResponseUtil.success(null, 'Password reset email sent'));

  } catch (error) {
    next(error);
  }
});

export default router;
