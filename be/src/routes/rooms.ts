import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validate, validateQuery, schemas, querySchemas } from '../middleware/validation';
import SupabaseService from '../services/supabase';
import ApiResponseUtil from '../utils/ApiResponse';
import ApiError from '../utils/ApiError';

const router = express.Router();

// Get all public rooms or user's accessible rooms
router.get('/', optionalAuth, validateQuery(querySchemas.pagination), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = req.query;
    const supabase = SupabaseService.getInstance().getClient();
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('rooms')
      .select(`
        *,
        room_members!inner(count),
        user_profiles!rooms_created_by_fkey(username, display_name)
      `, { count: 'exact' })
      .range(offset, offset + Number(limit) - 1)
      .order('created_at', { ascending: false });

    // If user is not authenticated, only show public rooms
    if (!req.user) {
      query = query.eq('is_private', false);
    } else {
      // Show public rooms + private rooms user is a member of
      query = query.or(`is_private.eq.false,room_members.user_id.eq.${req.user.id}`);
    }

    const { data: rooms, error, count } = await query;

    if (error) {
      throw new ApiError('Failed to fetch rooms', 400);
    }

    res.json(ApiResponseUtil.paginated(
      rooms || [],
      Number(page),
      Number(limit),
      count || 0
    ));

  } catch (error) {
    next(error);
  }
});

// Get room by ID
router.get('/:id', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const supabase = SupabaseService.getInstance().getClient();

    const { data: room, error } = await supabase
      .from('rooms')
      .select(`
        *,
        user_profiles!rooms_created_by_fkey(username, display_name),
        room_members(
          id,
          role,
          joined_at,
          user_profiles!room_members_user_id_fkey(
            id,
            username,
            display_name,
            avatar_url,
            is_online
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error || !room) {
      throw new ApiError('Room not found', 404);
    }

    // Check if room is private and user has access
    if (room.is_private) {
      if (!req.user) {
        throw new ApiError('Authentication required for private rooms', 401);
      }

      const isMember = room.room_members.some((member: any) => 
        member.user_profiles.id === req.user!.id
      );

      if (!isMember) {
        throw new ApiError('Access denied to private room', 403);
      }
    }

    res.json(ApiResponseUtil.success(room));

  } catch (error) {
    next(error);
  }
});

// Create new room
router.post('/', authenticate, validate(schemas.createRoom), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, is_private, password, room_type, max_members } = req.body;
    const supabase = SupabaseService.getInstance().getClient();

    // Hash password if room is private and password is provided
    let password_hash: string | undefined;
    if (is_private && password) {
      password_hash = await bcrypt.hash(password, 12);
    }

    // Create room
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .insert({
        name,
        description: description || null,
        is_private,
        password_hash,
        room_type,
        max_members: max_members || 100,
        created_by: req.user!.id,
      })
      .select()
      .single();

    if (roomError) {
      throw new ApiError('Failed to create room', 400);
    }

    // Add creator as admin member
    const { error: memberError } = await supabase
      .from('room_members')
      .insert({
        room_id: room.id,
        user_id: req.user!.id,
        role: 'admin',
      });

    if (memberError) {
      throw new ApiError('Failed to add creator as member', 400);
    }

    res.status(201).json(ApiResponseUtil.success(room, 'Room created successfully'));

  } catch (error) {
    next(error);
  }
});

// Update room
router.put('/:id', authenticate, validate(schemas.updateRoom), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const supabase = SupabaseService.getInstance().getClient();

    // Check if user is room creator or admin
    const { data: membership, error: memberError } = await supabase
      .from('room_members')
      .select('role')
      .eq('room_id', id)
      .eq('user_id', req.user!.id)
      .single();

    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('created_by')
      .eq('id', id)
      .single();

    if (memberError || roomError || !room) {
      throw new ApiError('Room not found', 404);
    }

    const isCreator = room.created_by === req.user!.id;
    const isAdmin = membership?.role === 'admin';

    if (!isCreator && !isAdmin) {
      throw new ApiError('Insufficient permissions to update room', 403);
    }

    // Hash password if provided
    if (updates.password) {
      updates.password_hash = await bcrypt.hash(updates.password, 12);
      delete updates.password;
    }

    const { data: updatedRoom, error } = await supabase
      .from('rooms')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new ApiError('Failed to update room', 400);
    }

    res.json(ApiResponseUtil.success(updatedRoom, 'Room updated successfully'));

  } catch (error) {
    next(error);
  }
});

// Delete room
router.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const supabase = SupabaseService.getInstance().getClient();

    // Check if user is room creator
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('created_by')
      .eq('id', id)
      .single();

    if (roomError || !room) {
      throw new ApiError('Room not found', 404);
    }

    if (room.created_by !== req.user!.id) {
      throw new ApiError('Only room creator can delete room', 403);
    }

    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', id);

    if (error) {
      throw new ApiError('Failed to delete room', 400);
    }

    res.json(ApiResponseUtil.success(null, 'Room deleted successfully'));

  } catch (error) {
    next(error);
  }
});

// Join room
router.post('/:id/join', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    const supabase = SupabaseService.getInstance().getClient();

    // Get room details
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('is_private, password_hash, max_members')
      .eq('id', id)
      .single();

    if (roomError || !room) {
      throw new ApiError('Room not found', 404);
    }

    // Check if room is private and password is required
    if (room.is_private && room.password_hash) {
      if (!password) {
        throw new ApiError('Password required for private room', 400);
      }

      const isPasswordValid = await bcrypt.compare(password, room.password_hash);
      if (!isPasswordValid) {
        throw new ApiError('Invalid room password', 401);
      }
    }

    // Check if already a member
    const { data: existingMember } = await supabase
      .from('room_members')
      .select('id')
      .eq('room_id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (existingMember) {
      throw new ApiError('Already a member of this room', 400);
    }

    // Check room capacity
    const { count: memberCount } = await supabase
      .from('room_members')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', id);

    if (memberCount && memberCount >= room.max_members) {
      throw new ApiError('Room is at maximum capacity', 400);
    }

    // Add user to room
    const { data: membership, error } = await supabase
      .from('room_members')
      .insert({
        room_id: id,
        user_id: req.user!.id,
        role: 'member',
      })
      .select()
      .single();

    if (error) {
      throw new ApiError('Failed to join room', 400);
    }

    res.json(ApiResponseUtil.success(membership, 'Joined room successfully'));

  } catch (error) {
    next(error);
  }
});

// Leave room
router.post('/:id/leave', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const supabase = SupabaseService.getInstance().getClient();

    // Check if user is a member
    const { data: membership, error: memberError } = await supabase
      .from('room_members')
      .select('role')
      .eq('room_id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (memberError || !membership) {
      throw new ApiError('Not a member of this room', 400);
    }

    // Check if user is the room creator
    const { data: room } = await supabase
      .from('rooms')
      .select('created_by')
      .eq('id', id)
      .single();

    if (room?.created_by === req.user!.id) {
      throw new ApiError('Room creator cannot leave room. Transfer ownership or delete room instead.', 400);
    }

    // Remove user from room
    const { error } = await supabase
      .from('room_members')
      .delete()
      .eq('room_id', id)
      .eq('user_id', req.user!.id);

    if (error) {
      throw new ApiError('Failed to leave room', 400);
    }

    res.json(ApiResponseUtil.success(null, 'Left room successfully'));

  } catch (error) {
    next(error);
  }
});

// Get room members
router.get('/:id/members', optionalAuth, validateQuery(querySchemas.pagination), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { page, limit } = req.query;
    const supabase = SupabaseService.getInstance().getClient();
    const offset = (Number(page) - 1) * Number(limit);

    // Check if room exists and user has access
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('is_private')
      .eq('id', id)
      .single();

    if (roomError || !room) {
      throw new ApiError('Room not found', 404);
    }

    if (room.is_private && !req.user) {
      throw new ApiError('Authentication required for private rooms', 401);
    }

    if (room.is_private && req.user) {
      const { data: membership } = await supabase
        .from('room_members')
        .select('id')
        .eq('room_id', id)
        .eq('user_id', req.user.id)
        .single();

      if (!membership) {
        throw new ApiError('Access denied to private room', 403);
      }
    }

    const { data: members, error, count } = await supabase
      .from('room_members')
      .select(`
        id,
        role,
        joined_at,
        user_profiles!room_members_user_id_fkey(
          id,
          username,
          display_name,
          avatar_url,
          morse_skill_level,
          is_online,
          last_active
        )
      `, { count: 'exact' })
      .eq('room_id', id)
      .range(offset, offset + Number(limit) - 1)
      .order('joined_at', { ascending: false });

    if (error) {
      throw new ApiError('Failed to fetch room members', 400);
    }

    res.json(ApiResponseUtil.paginated(
      members || [],
      Number(page),
      Number(limit),
      count || 0
    ));

  } catch (error) {
    next(error);
  }
});

export default router;
