import express, { Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { validate, validateQuery, schemas, querySchemas } from '../middleware/validation';
import SupabaseService from '../services/supabase';
import ApiResponseUtil from '../utils/ApiResponse';
import ApiError from '../utils/ApiError';

const router = express.Router();

// Get user's friends
router.get('/', authenticate, validateQuery(querySchemas.pagination), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = req.query;
    const supabase = SupabaseService.getInstance().getClient();
    const offset = (Number(page) - 1) * Number(limit);

    const { data: friends, error, count } = await supabase
      .from('friends')
      .select(`
        id,
        status,
        created_at,
        requester:user_profiles!friends_requester_id_fkey(
          id,
          username,
          display_name,
          avatar_url,
          is_online,
          last_active
        ),
        addressee:user_profiles!friends_addressee_id_fkey(
          id,
          username,
          display_name,
          avatar_url,
          is_online,
          last_active
        )
      `, { count: 'exact' })
      .or(`requester_id.eq.${req.user!.id},addressee_id.eq.${req.user!.id}`)
      .eq('status', 'accepted')
      .range(offset, offset + Number(limit) - 1)
      .order('created_at', { ascending: false });

    if (error) {
      throw new ApiError('Failed to fetch friends', 400);
    }

    // Transform the data to show the friend (not the current user)
    const transformedFriends = (friends || []).map((friendship: any) => {
      const friend = friendship.requester.id === req.user!.id 
        ? friendship.addressee 
        : friendship.requester;
      
      return {
        id: friendship.id,
        friend,
        status: friendship.status,
        created_at: friendship.created_at,
      };
    });

    res.json(ApiResponseUtil.paginated(
      transformedFriends,
      Number(page),
      Number(limit),
      count || 0
    ));

  } catch (error) {
    next(error);
  }
});

// Get pending friend requests (received)
router.get('/requests/received', authenticate, validateQuery(querySchemas.pagination), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = req.query;
    const supabase = SupabaseService.getInstance().getClient();
    const offset = (Number(page) - 1) * Number(limit);

    const { data: requests, error, count } = await supabase
      .from('friends')
      .select(`
        id,
        status,
        created_at,
        requester:user_profiles!friends_requester_id_fkey(
          id,
          username,
          display_name,
          avatar_url,
          morse_skill_level
        )
      `, { count: 'exact' })
      .eq('addressee_id', req.user!.id)
      .eq('status', 'pending')
      .range(offset, offset + Number(limit) - 1)
      .order('created_at', { ascending: false });

    if (error) {
      throw new ApiError('Failed to fetch friend requests', 400);
    }

    res.json(ApiResponseUtil.paginated(
      requests || [],
      Number(page),
      Number(limit),
      count || 0
    ));

  } catch (error) {
    next(error);
  }
});

// Get pending friend requests (sent)
router.get('/requests/sent', authenticate, validateQuery(querySchemas.pagination), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = req.query;
    const supabase = SupabaseService.getInstance().getClient();
    const offset = (Number(page) - 1) * Number(limit);

    const { data: requests, error, count } = await supabase
      .from('friends')
      .select(`
        id,
        status,
        created_at,
        addressee:user_profiles!friends_addressee_id_fkey(
          id,
          username,
          display_name,
          avatar_url,
          morse_skill_level
        )
      `, { count: 'exact' })
      .eq('requester_id', req.user!.id)
      .eq('status', 'pending')
      .range(offset, offset + Number(limit) - 1)
      .order('created_at', { ascending: false });

    if (error) {
      throw new ApiError('Failed to fetch sent friend requests', 400);
    }

    res.json(ApiResponseUtil.paginated(
      requests || [],
      Number(page),
      Number(limit),
      count || 0
    ));

  } catch (error) {
    next(error);
  }
});

// Send friend request
router.post('/request', authenticate, validate(schemas.sendFriendRequest), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username } = req.body;
    const supabase = SupabaseService.getInstance().getClient();

    // Find user by username
    const { data: targetUser, error: userError } = await supabase
      .from('user_profiles')
      .select('id, username')
      .eq('username', username)
      .single();

    if (userError || !targetUser) {
      throw new ApiError('User not found', 404);
    }

    // Can't send friend request to yourself
    if (targetUser.id === req.user!.id) {
      throw new ApiError('Cannot send friend request to yourself', 400);
    }

    // Check if friendship already exists
    const { data: existingFriendship } = await supabase
      .from('friends')
      .select('id, status')
      .or(`and(requester_id.eq.${req.user!.id},addressee_id.eq.${targetUser.id}),and(requester_id.eq.${targetUser.id},addressee_id.eq.${req.user!.id})`)
      .single();

    if (existingFriendship) {
      if (existingFriendship.status === 'accepted') {
        throw new ApiError('You are already friends with this user', 400);
      } else if (existingFriendship.status === 'pending') {
        throw new ApiError('Friend request already sent or received', 400);
      } else if (existingFriendship.status === 'blocked') {
        throw new ApiError('Cannot send friend request to this user', 400);
      }
    }

    // Create friend request
    const { data: friendRequest, error } = await supabase
      .from('friends')
      .insert({
        requester_id: req.user!.id,
        addressee_id: targetUser.id,
        status: 'pending',
      })
      .select(`
        id,
        status,
        created_at,
        addressee:user_profiles!friends_addressee_id_fkey(
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      throw new ApiError('Failed to send friend request', 400);
    }

    res.status(201).json(ApiResponseUtil.success(friendRequest, 'Friend request sent successfully'));

  } catch (error) {
    next(error);
  }
});

// Accept friend request
router.patch('/:requestId/accept', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { requestId } = req.params;
    const supabase = SupabaseService.getInstance().getClient();

    // Verify the request exists and is for the current user
    const { data: friendRequest, error: fetchError } = await supabase
      .from('friends')
      .select('requester_id, addressee_id, status')
      .eq('id', requestId)
      .eq('addressee_id', req.user!.id)
      .eq('status', 'pending')
      .single();

    if (fetchError || !friendRequest) {
      throw new ApiError('Friend request not found', 404);
    }

    // Accept the friend request
    const { data: updatedFriendship, error } = await supabase
      .from('friends')
      .update({ status: 'accepted' })
      .eq('id', requestId)
      .select(`
        id,
        status,
        created_at,
        updated_at,
        requester:user_profiles!friends_requester_id_fkey(
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      throw new ApiError('Failed to accept friend request', 400);
    }

    res.json(ApiResponseUtil.success(updatedFriendship, 'Friend request accepted'));

  } catch (error) {
    next(error);
  }
});

// Decline friend request
router.patch('/:requestId/decline', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { requestId } = req.params;
    const supabase = SupabaseService.getInstance().getClient();

    // Verify the request exists and is for the current user
    const { data: friendRequest, error: fetchError } = await supabase
      .from('friends')
      .select('requester_id, addressee_id, status')
      .eq('id', requestId)
      .eq('addressee_id', req.user!.id)
      .eq('status', 'pending')
      .single();

    if (fetchError || !friendRequest) {
      throw new ApiError('Friend request not found', 404);
    }

    // Delete the friend request (decline)
    const { error } = await supabase
      .from('friends')
      .delete()
      .eq('id', requestId);

    if (error) {
      throw new ApiError('Failed to decline friend request', 400);
    }

    res.json(ApiResponseUtil.success(null, 'Friend request declined'));

  } catch (error) {
    next(error);
  }
});

// Remove friend
router.delete('/:friendshipId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { friendshipId } = req.params;
    const supabase = SupabaseService.getInstance().getClient();

    // Verify the friendship exists and involves the current user
    const { data: friendship, error: fetchError } = await supabase
      .from('friends')
      .select('requester_id, addressee_id, status')
      .eq('id', friendshipId)
      .or(`requester_id.eq.${req.user!.id},addressee_id.eq.${req.user!.id}`)
      .single();

    if (fetchError || !friendship) {
      throw new ApiError('Friendship not found', 404);
    }

    // Delete the friendship
    const { error } = await supabase
      .from('friends')
      .delete()
      .eq('id', friendshipId);

    if (error) {
      throw new ApiError('Failed to remove friend', 400);
    }

    res.json(ApiResponseUtil.success(null, 'Friend removed successfully'));

  } catch (error) {
    next(error);
  }
});

// Block user
router.post('/:friendshipId/block', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { friendshipId } = req.params;
    const supabase = SupabaseService.getInstance().getClient();

    // Verify the friendship exists and involves the current user
    const { data: friendship, error: fetchError } = await supabase
      .from('friends')
      .select('requester_id, addressee_id, status')
      .eq('id', friendshipId)
      .or(`requester_id.eq.${req.user!.id},addressee_id.eq.${req.user!.id}`)
      .single();

    if (fetchError || !friendship) {
      throw new ApiError('Friendship not found', 404);
    }

    // Update status to blocked
    const { data: blockedFriendship, error } = await supabase
      .from('friends')
      .update({ status: 'blocked' })
      .eq('id', friendshipId)
      .select()
      .single();

    if (error) {
      throw new ApiError('Failed to block user', 400);
    }

    res.json(ApiResponseUtil.success(blockedFriendship, 'User blocked successfully'));

  } catch (error) {
    next(error);
  }
});

// Get blocked users
router.get('/blocked', authenticate, validateQuery(querySchemas.pagination), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = req.query;
    const supabase = SupabaseService.getInstance().getClient();
    const offset = (Number(page) - 1) * Number(limit);

    const { data: blocked, error, count } = await supabase
      .from('friends')
      .select(`
        id,
        status,
        created_at,
        updated_at,
        requester:user_profiles!friends_requester_id_fkey(
          id,
          username,
          display_name,
          avatar_url
        ),
        addressee:user_profiles!friends_addressee_id_fkey(
          id,
          username,
          display_name,
          avatar_url
        )
      `, { count: 'exact' })
      .or(`requester_id.eq.${req.user!.id},addressee_id.eq.${req.user!.id}`)
      .eq('status', 'blocked')
      .range(offset, offset + Number(limit) - 1)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new ApiError('Failed to fetch blocked users', 400);
    }

    // Transform the data to show the blocked user (not the current user)
    const transformedBlocked = (blocked || []).map((relationship: any) => {
      const blockedUser = relationship.requester.id === req.user!.id 
        ? relationship.addressee 
        : relationship.requester;
      
      return {
        id: relationship.id,
        blocked_user: blockedUser,
        status: relationship.status,
        blocked_at: relationship.updated_at,
      };
    });

    res.json(ApiResponseUtil.paginated(
      transformedBlocked,
      Number(page),
      Number(limit),
      count || 0
    ));

  } catch (error) {
    next(error);
  }
});

// Unblock user
router.patch('/:friendshipId/unblock', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { friendshipId } = req.params;
    const supabase = SupabaseService.getInstance().getClient();

    // Verify the blocked relationship exists and involves the current user
    const { data: relationship, error: fetchError } = await supabase
      .from('friends')
      .select('requester_id, addressee_id, status')
      .eq('id', friendshipId)
      .or(`requester_id.eq.${req.user!.id},addressee_id.eq.${req.user!.id}`)
      .eq('status', 'blocked')
      .single();

    if (fetchError || !relationship) {
      throw new ApiError('Blocked relationship not found', 404);
    }

    // Remove the blocked relationship
    const { error } = await supabase
      .from('friends')
      .delete()
      .eq('id', friendshipId);

    if (error) {
      throw new ApiError('Failed to unblock user', 400);
    }

    res.json(ApiResponseUtil.success(null, 'User unblocked successfully'));

  } catch (error) {
    next(error);
  }
});

export default router;
