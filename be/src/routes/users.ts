import express, { Request, Response, NextFunction } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validate, validateQuery, schemas, querySchemas } from '../middleware/validation';
import SupabaseService from '../services/supabase';
import ApiResponseUtil from '../utils/ApiResponse';
import ApiError from '../utils/ApiError';

const router = express.Router();

// Get user profile by ID
router.get('/:id', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const supabase = SupabaseService.getInstance().getClient();

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select(`
        id,
        username,
        display_name,
        morse_skill_level,
        preferred_speed,
        avatar_url,
        bio,
        total_messages_count,
        is_online,
        last_active,
        created_at
      `)
      .eq('id', id)
      .single();

    if (error || !profile) {
      throw new ApiError('User not found', 404);
    }

    res.json(ApiResponseUtil.success(profile));

  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/profile', authenticate, validate(schemas.updateProfile), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updates = req.body;
    const supabase = SupabaseService.getInstance().getClient();

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', req.user!.id)
      .select()
      .single();

    if (error) {
      throw new ApiError('Failed to update profile', 400);
    }

    res.json(ApiResponseUtil.success(data, 'Profile updated successfully'));

  } catch (error) {
    next(error);
  }
});

// Search users by username
router.get('/search', validateQuery(querySchemas.searchUsers), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, limit } = req.query;
    const supabase = SupabaseService.getInstance().getClient();

    const { data: users, error } = await supabase
      .from('user_profiles')
      .select(`
        id,
        username,
        display_name,
        avatar_url,
        morse_skill_level,
        is_online
      `)
      .ilike('username', `%${q}%`)
      .limit(Number(limit))
      .order('username');

    if (error) {
      throw new ApiError('Search failed', 400);
    }

    res.json(ApiResponseUtil.success(users || []));

  } catch (error) {
    next(error);
  }
});

// Get user's learning sessions
router.get('/:id/learning-sessions', authenticate, validateQuery(querySchemas.pagination), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { page, limit } = req.query;
    
    // Only allow users to view their own learning sessions
    if (req.user!.id !== id) {
      throw new ApiError('Unauthorized to view learning sessions', 403);
    }

    const supabase = SupabaseService.getInstance().getClient();
    const offset = (Number(page) - 1) * Number(limit);

    const { data: sessions, error, count } = await supabase
      .from('learning_sessions')
      .select('*', { count: 'exact' })
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) {
      throw new ApiError('Failed to fetch learning sessions', 400);
    }

    res.json(ApiResponseUtil.paginated(
      sessions || [],
      Number(page),
      Number(limit),
      count || 0
    ));

  } catch (error) {
    next(error);
  }
});

// Create learning session
router.post('/learning-sessions', authenticate, validate(schemas.createLearningSession), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { session_type, difficulty_level } = req.body;
    const supabase = SupabaseService.getInstance().getClient();

    const { data: session, error } = await supabase
      .from('learning_sessions')
      .insert({
        user_id: req.user!.id,
        session_type,
        difficulty_level,
      })
      .select()
      .single();

    if (error) {
      throw new ApiError('Failed to create learning session', 400);
    }

    res.status(201).json(ApiResponseUtil.success(session, 'Learning session created'));

  } catch (error) {
    next(error);
  }
});

// Update learning session
router.put('/learning-sessions/:sessionId', authenticate, validate(schemas.updateLearningSession), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    const updates = req.body;
    const supabase = SupabaseService.getInstance().getClient();

    // Verify session belongs to user
    const { data: existingSession, error: fetchError } = await supabase
      .from('learning_sessions')
      .select('user_id, completed_at')
      .eq('id', sessionId)
      .single();

    if (fetchError || !existingSession) {
      throw new ApiError('Learning session not found', 404);
    }

    if (existingSession.user_id !== req.user!.id) {
      throw new ApiError('Unauthorized to update this session', 403);
    }

    // Add completion timestamp if session is being completed
    if (updates.score !== undefined && !existingSession.completed_at) {
      updates.completed_at = new Date().toISOString();
    }

    const { data: updatedSession, error } = await supabase
      .from('learning_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      throw new ApiError('Failed to update learning session', 400);
    }

    res.json(ApiResponseUtil.success(updatedSession, 'Learning session updated'));

  } catch (error) {
    next(error);
  }
});

// Get user statistics
router.get('/:id/stats', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const supabase = SupabaseService.getInstance().getClient();

    // Get basic user stats
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('total_messages_count, morse_skill_level, created_at')
      .eq('id', id)
      .single();

    if (!profile) {
      throw new ApiError('User not found', 404);
    }

    // Get learning session stats
    const { data: sessionStats } = await supabase
      .from('learning_sessions')
      .select('session_type, score, wpm_achieved, completed_at')
      .eq('user_id', id)
      .not('completed_at', 'is', null);

    const stats = {
      total_messages: profile.total_messages_count,
      morse_skill_level: profile.morse_skill_level,
      member_since: profile.created_at,
      learning_sessions: {
        total_completed: sessionStats?.length || 0,
        average_score: sessionStats?.length ? 
          sessionStats.reduce((sum, session) => sum + session.score, 0) / sessionStats.length : 0,
        best_wpm: sessionStats?.length ?
          Math.max(...sessionStats.map(s => s.wpm_achieved || 0)) : 0,
        sessions_by_type: sessionStats?.reduce((acc, session) => {
          acc[session.session_type] = (acc[session.session_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {},
      },
    };

    res.json(ApiResponseUtil.success(stats));

  } catch (error) {
    next(error);
  }
});

// Update user online status
router.patch('/status', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { is_online } = req.body;
    const supabase = SupabaseService.getInstance().getClient();

    const { error } = await supabase
      .from('user_profiles')
      .update({ 
        is_online: Boolean(is_online),
        last_active: new Date().toISOString(),
      })
      .eq('id', req.user!.id);

    if (error) {
      throw new ApiError('Failed to update status', 400);
    }

    res.json(ApiResponseUtil.success(null, 'Status updated'));

  } catch (error) {
    next(error);
  }
});

export default router;
