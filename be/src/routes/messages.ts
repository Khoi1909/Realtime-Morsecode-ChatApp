import express, { Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { validate, validateQuery, schemas, querySchemas } from '../middleware/validation';
import SupabaseService from '../services/supabase';
import ApiResponseUtil from '../utils/ApiResponse';
import ApiError from '../utils/ApiError';

const router = express.Router();

// Get messages for a room
router.get('/room/:roomId', authenticate, validateQuery(querySchemas.messageHistory), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roomId } = req.params;
    const { page, limit, before, after } = req.query;
    const supabase = SupabaseService.getInstance().getClient();
    const offset = (Number(page) - 1) * Number(limit);

    // Check if user is a member of the room
    const { data: membership, error: memberError } = await supabase
      .from('room_members')
      .select('id')
      .eq('room_id', roomId)
      .eq('user_id', req.user!.id)
      .single();

    if (memberError || !membership) {
      throw new ApiError('Access denied. You must be a member of this room.', 403);
    }

    let query = supabase
      .from('messages')
      .select(`
        id,
        content,
        message_type,
        reply_to,
        thread_id,
        is_deleted,
        created_at,
        updated_at,
        user_profiles!messages_user_id_fkey(
          id,
          username,
          display_name,
          avatar_url
        )
      `, { count: 'exact' })
      .eq('room_id', roomId)
      .eq('is_deleted', false)
      .range(offset, offset + Number(limit) - 1)
      .order('created_at', { ascending: false });

    // Add time filters if provided
    if (before) {
      query = query.lt('created_at', before);
    }
    if (after) {
      query = query.gt('created_at', after);
    }

    const { data: messages, error, count } = await query;

    if (error) {
      throw new ApiError('Failed to fetch messages', 400);
    }

    // Reverse to show oldest first
    const sortedMessages = (messages || []).reverse();

    res.json(ApiResponseUtil.paginated(
      sortedMessages,
      Number(page),
      Number(limit),
      count || 0
    ));

  } catch (error) {
    next(error);
  }
});

// Send message to room
router.post('/room/:roomId', authenticate, validate(schemas.sendMessage), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roomId } = req.params;
    const { content, message_type = 'text', reply_to } = req.body;
    const supabase = SupabaseService.getInstance().getClient();

    // Check if user is a member of the room
    const { data: membership, error: memberError } = await supabase
      .from('room_members')
      .select('id')
      .eq('room_id', roomId)
      .eq('user_id', req.user!.id)
      .single();

    if (memberError || !membership) {
      throw new ApiError('Access denied. You must be a member of this room.', 403);
    }

    // Verify reply_to message exists in the same room if provided
    if (reply_to) {
      const { data: replyMessage, error: replyError } = await supabase
        .from('messages')
        .select('room_id')
        .eq('id', reply_to)
        .eq('room_id', roomId)
        .single();

      if (replyError || !replyMessage) {
        throw new ApiError('Reply target message not found in this room', 400);
      }
    }

    // Create message
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        room_id: roomId,
        user_id: req.user!.id,
        content,
        message_type,
        reply_to: reply_to || null,
      })
      .select(`
        id,
        content,
        message_type,
        reply_to,
        thread_id,
        is_deleted,
        created_at,
        updated_at,
        user_profiles!messages_user_id_fkey(
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      throw new ApiError('Failed to send message', 400);
    }

    res.status(201).json(ApiResponseUtil.success(message, 'Message sent successfully'));

  } catch (error) {
    next(error);
  }
});

// Edit message
router.put('/:messageId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const supabase = SupabaseService.getInstance().getClient();

    if (!content || !content.text || !content.morse) {
      throw new ApiError('Content with text and morse is required', 400);
    }

    // Get current message
    const { data: currentMessage, error: fetchError } = await supabase
      .from('messages')
      .select('user_id, content, edit_history')
      .eq('id', messageId)
      .eq('user_id', req.user!.id)
      .single();

    if (fetchError || !currentMessage) {
      throw new ApiError('Message not found or access denied', 404);
    }

    // Add current content to edit history
    const editHistory = Array.isArray(currentMessage.edit_history) 
      ? currentMessage.edit_history 
      : [];
    
    editHistory.push({
      content: currentMessage.content,
      edited_at: new Date().toISOString(),
    });

    // Update message
    const { data: updatedMessage, error } = await supabase
      .from('messages')
      .update({
        content,
        edit_history: editHistory,
      })
      .eq('id', messageId)
      .select(`
        id,
        content,
        message_type,
        reply_to,
        thread_id,
        edit_history,
        is_deleted,
        created_at,
        updated_at,
        user_profiles!messages_user_id_fkey(
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      throw new ApiError('Failed to update message', 400);
    }

    res.json(ApiResponseUtil.success(updatedMessage, 'Message updated successfully'));

  } catch (error) {
    next(error);
  }
});

// Delete message
router.delete('/:messageId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { messageId } = req.params;
    const supabase = SupabaseService.getInstance().getClient();

    // Check if user owns the message
    const { data: message, error: fetchError } = await supabase
      .from('messages')
      .select('user_id, room_id')
      .eq('id', messageId)
      .single();

    if (fetchError || !message) {
      throw new ApiError('Message not found', 404);
    }

    // Check if user is message owner or room admin
    const isOwner = message.user_id === req.user!.id;
    let isAdmin = false;

    if (!isOwner) {
      const { data: membership } = await supabase
        .from('room_members')
        .select('role')
        .eq('room_id', message.room_id)
        .eq('user_id', req.user!.id)
        .single();

      isAdmin = membership?.role === 'admin' || membership?.role === 'moderator';
    }

    if (!isOwner && !isAdmin) {
      throw new ApiError('Access denied. You can only delete your own messages.', 403);
    }

    // Soft delete the message
    const { error } = await supabase
      .from('messages')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq('id', messageId);

    if (error) {
      throw new ApiError('Failed to delete message', 400);
    }

    res.json(ApiResponseUtil.success(null, 'Message deleted successfully'));

  } catch (error) {
    next(error);
  }
});

// Get direct messages with a user
router.get('/direct/:userId', authenticate, validateQuery(querySchemas.messageHistory), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { page, limit, before, after } = req.query;
    const supabase = SupabaseService.getInstance().getClient();
    const offset = (Number(page) - 1) * Number(limit);

    // Verify the other user exists
    const { data: otherUser, error: userError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError || !otherUser) {
      throw new ApiError('User not found', 404);
    }

    let query = supabase
      .from('direct_messages')
      .select(`
        id,
        content,
        message_type,
        reply_to,
        is_read,
        is_deleted,
        created_at,
        updated_at,
        sender:user_profiles!direct_messages_sender_id_fkey(
          id,
          username,
          display_name,
          avatar_url
        ),
        receiver:user_profiles!direct_messages_receiver_id_fkey(
          id,
          username,
          display_name,
          avatar_url
        )
      `, { count: 'exact' })
      .or(`and(sender_id.eq.${req.user!.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${req.user!.id})`)
      .eq('is_deleted', false)
      .range(offset, offset + Number(limit) - 1)
      .order('created_at', { ascending: false });

    // Add time filters if provided
    if (before) {
      query = query.lt('created_at', before);
    }
    if (after) {
      query = query.gt('created_at', after);
    }

    const { data: messages, error, count } = await query;

    if (error) {
      throw new ApiError('Failed to fetch direct messages', 400);
    }

    // Mark received messages as read
    if (messages && messages.length > 0) {
      await supabase
        .from('direct_messages')
        .update({ is_read: true })
        .eq('receiver_id', req.user!.id)
        .eq('sender_id', userId)
        .eq('is_read', false);
    }

    // Reverse to show oldest first
    const sortedMessages = (messages || []).reverse();

    res.json(ApiResponseUtil.paginated(
      sortedMessages,
      Number(page),
      Number(limit),
      count || 0
    ));

  } catch (error) {
    next(error);
  }
});

// Send direct message
router.post('/direct', authenticate, validate(schemas.sendDirectMessage), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { receiver_id, content, message_type = 'text', reply_to } = req.body;
    const supabase = SupabaseService.getInstance().getClient();

    // Verify receiver exists
    const { data: receiver, error: receiverError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', receiver_id)
      .single();

    if (receiverError || !receiver) {
      throw new ApiError('Receiver not found', 404);
    }

    // Can't send message to yourself
    if (receiver_id === req.user!.id) {
      throw new ApiError('Cannot send direct message to yourself', 400);
    }

    // Verify reply_to message exists in conversation if provided
    if (reply_to) {
      const { data: replyMessage, error: replyError } = await supabase
        .from('direct_messages')
        .select('id')
        .eq('id', reply_to)
        .or(`and(sender_id.eq.${req.user!.id},receiver_id.eq.${receiver_id}),and(sender_id.eq.${receiver_id},receiver_id.eq.${req.user!.id})`)
        .single();

      if (replyError || !replyMessage) {
        throw new ApiError('Reply target message not found in this conversation', 400);
      }
    }

    // Create direct message
    const { data: message, error } = await supabase
      .from('direct_messages')
      .insert({
        sender_id: req.user!.id,
        receiver_id,
        content,
        message_type,
        reply_to: reply_to || null,
      })
      .select(`
        id,
        content,
        message_type,
        reply_to,
        is_read,
        is_deleted,
        created_at,
        updated_at,
        sender:user_profiles!direct_messages_sender_id_fkey(
          id,
          username,
          display_name,
          avatar_url
        ),
        receiver:user_profiles!direct_messages_receiver_id_fkey(
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      throw new ApiError('Failed to send direct message', 400);
    }

    res.status(201).json(ApiResponseUtil.success(message, 'Direct message sent successfully'));

  } catch (error) {
    next(error);
  }
});

// Get unread direct message count
router.get('/direct/unread', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supabase = SupabaseService.getInstance().getClient();

    const { count, error } = await supabase
      .from('direct_messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', req.user!.id)
      .eq('is_read', false)
      .eq('is_deleted', false);

    if (error) {
      throw new ApiError('Failed to fetch unread count', 400);
    }

    res.json(ApiResponseUtil.success({ unread_count: count || 0 }));

  } catch (error) {
    next(error);
  }
});

// Mark direct messages as read
router.patch('/direct/:userId/read', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const supabase = SupabaseService.getInstance().getClient();

    const { error } = await supabase
      .from('direct_messages')
      .update({ is_read: true })
      .eq('receiver_id', req.user!.id)
      .eq('sender_id', userId)
      .eq('is_read', false);

    if (error) {
      throw new ApiError('Failed to mark messages as read', 400);
    }

    res.json(ApiResponseUtil.success(null, 'Messages marked as read'));

  } catch (error) {
    next(error);
  }
});

export default router;
