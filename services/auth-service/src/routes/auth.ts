import { Router, Request, Response } from 'express';
import { supabase, authHelpers } from '../services/supabase';
import { jwtHelpers } from '../utils/jwt';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { 
  validateLogin, 
  validateRegister, 
  validateRefreshToken,
  validateChangePassword,
  validateForgotPassword,
  validateResetPassword
} from '../middleware/validation';
import { AuthResponse, LoginRequest, RegisterRequest } from '@shared/types';

const router = Router();

// POST /auth/register
router.post('/register', validateRegister, async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { email, password, username, display_name, turnstileToken }: RegisterRequest = req.body;

    // TODO: Validate Turnstile token if provided
    if (turnstileToken) {
      // Add Turnstile validation here
    }

    // Check if user already exists
    const existingUser = await authHelpers.getUserByEmail(email);
    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'User already exists',
        message: 'An account with this email already exists'
      });
      return;
    }

    // Check if username is taken
    const existingUsername = await supabase
      .from('user_profiles')
      .select('id')
      .eq('username', username)
      .single();

    if (existingUsername.data) {
      return res.status(409).json({
        success: false,
        error: 'Username taken',
        message: 'This username is already taken'
      });
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          display_name: display_name || username
        }
      }
    });

    if (authError) {
      console.error('Auth signup error:', authError);
      return res.status(400).json({
        success: false,
        error: 'Registration failed',
        message: authError.message
      });
    }

    if (!authData.user) {
      return res.status(400).json({
        success: false,
        error: 'Registration failed',
        message: 'Failed to create user account'
      });
    }

    // Create user profile
    const userProfile = await authHelpers.createUserProfile({
      id: authData.user.id,
      email: authData.user.email!,
      username,
      display_name: display_name || username
    });

    if (!userProfile) {
      return res.status(500).json({
        success: false,
        error: 'Profile creation failed',
        message: 'Account created but profile setup failed'
      });
    }

    // Generate tokens
    const tokens = jwtHelpers.generateTokenPair({
      id: authData.user.id,
      email: authData.user.email!,
      username
    });

    const response: AuthResponse = {
      user: {
        id: userProfile.id,
        email: authData.user.email!,
        username: userProfile.username,
        display_name: userProfile.display_name || undefined,
        created_at: userProfile.created_at || new Date().toISOString(),
        updated_at: userProfile.updated_at || new Date().toISOString()
      },
      ...tokens
    };

    res.status(201).json({
      success: true,
      data: response,
      message: 'Account created successfully'
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: 'Internal server error during registration'
    });
  }
});

// POST /auth/login
router.post('/login', validateLogin, async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { email, password, turnstileToken }: LoginRequest = req.body;

    // TODO: Validate Turnstile token if provided
    if (turnstileToken) {
      // Add Turnstile validation here
    }

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error('Auth login error:', authError);
      return res.status(401).json({
        success: false,
        error: 'Login failed',
        message: 'Invalid email or password'
      });
    }

    if (!authData.user) {
      return res.status(401).json({
        success: false,
        error: 'Login failed',
        message: 'Invalid email or password'
      });
    }

    // Get user profile
    const userProfile = await authHelpers.getUserById(authData.user.id);
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    // Generate tokens
    const tokens = jwtHelpers.generateTokenPair({
      id: userProfile.id,
      email: email, // Use email from request
      username: userProfile.username
    });

    const response: AuthResponse = {
      user: {
        id: userProfile.id,
        email: authData.user.email!,
        username: userProfile.username,
        display_name: userProfile.display_name || undefined,
        created_at: userProfile.created_at || new Date().toISOString(),
        updated_at: userProfile.updated_at || new Date().toISOString()
      },
      ...tokens
    };

    res.json({
      success: true,
      data: response,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      message: 'Internal server error during login'
    });
  }
});

// POST /auth/refresh
router.post('/refresh', validateRefreshToken, async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { refreshToken } = req.body;

    const payload = jwtHelpers.verifyRefreshToken(refreshToken);
    if (!payload) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
        message: 'Please login again'
      });
    }

    // Get user profile
    const userProfile = await authHelpers.getUserById(payload.userId);
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    // Generate new tokens
    const tokens = jwtHelpers.generateTokenPair({
      id: userProfile.id,
      email: payload.email, // Use email from JWT payload
      username: userProfile.username
    });

    res.json({
      success: true,
      data: tokens,
      message: 'Token refreshed successfully'
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Token refresh failed',
      message: 'Internal server error during token refresh'
    });
  }
});

// POST /auth/logout
router.post('/logout', authenticateToken, async (req: Request, res: Response): Promise<Response | void> => {
  try {
    // TODO: Implement token blacklisting if needed
    // For now, we'll just return success since JWT tokens are stateless

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      message: 'Internal server error during logout'
    });
  }
});

// GET /auth/me
router.get('/me', authenticateToken, async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const userProfile = await authHelpers.getUserById(req.user!.id);
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    res.json({
      success: true,
      data: userProfile,
      message: 'User profile retrieved successfully'
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get profile',
      message: 'Internal server error'
    });
  }
});

export default router;
