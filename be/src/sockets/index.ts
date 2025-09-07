import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { AuthUser } from '../types';
import config from '../utils/config';
import logger from '../utils/logger';
import SupabaseService from '../services/supabase';

// Socket user management
const connectedUsers = new Map<string, Socket>();
const userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds

export const initializeSocketHandlers = (io: SocketIOServer): void => {
  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, config.JWT_SECRET) as any;
      
      // Verify with Supabase
      const supabase = SupabaseService.getInstance().getClient();
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        return next(new Error('Invalid token'));
      }

      // Attach user info to socket
      socket.data.user = {
        id: user.id,
        email: user.email || '',
        role: user.role || 'authenticated',
        aud: user.aud || '',
        exp: decoded.exp,
        iat: decoded.iat,
      } as AuthUser;

      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    const user = socket.data.user as AuthUser;
    logger.info(`User connected: ${user.email} (${socket.id})`);

    // Track connected user
    connectedUsers.set(socket.id, socket);
    
    if (!userSockets.has(user.id)) {
      userSockets.set(user.id, new Set());
    }
    userSockets.get(user.id)!.add(socket.id);

    // Update user online status
    try {
      const supabase = SupabaseService.getInstance().getAdminClient();
      await supabase
        .from('user_profiles')
        .update({ 
          is_online: true,
          last_active: new Date().toISOString(),
        })
        .eq('id', user.id);
    } catch (error) {
      logger.error('Failed to update user online status:', error);
    }

    // Join user to their rooms
    await joinUserRooms(socket, user.id);

    // Socket event handlers
    socket.on('join_room', (data) => handleJoinRoom(socket, data));
    socket.on('leave_room', (data) => handleLeaveRoom(socket, data));
    socket.on('send_message', (data) => handleSendMessage(io, socket, data));
    socket.on('send_direct_message', (data) => handleSendDirectMessage(io, socket, data));
    socket.on('typing_start', (data) => handleTypingStart(socket, data));
    socket.on('typing_stop', (data) => handleTypingStop(socket, data));
    socket.on('morse_audio_start', (data) => handleMorseAudioStart(socket, data));
    socket.on('morse_audio_stop', (data) => handleMorseAudioStop(socket, data));
    socket.on('user_presence', (data) => handleUserPresence(socket, data));

    // Handle disconnection
    socket.on('disconnect', async () => {
      logger.info(`User disconnected: ${user.email} (${socket.id})`);
      
      // Remove from tracking
      connectedUsers.delete(socket.id);
      const userSocketSet = userSockets.get(user.id);
      if (userSocketSet) {
        userSocketSet.delete(socket.id);
        
        // If user has no more connections, mark as offline
        if (userSocketSet.size === 0) {
          userSockets.delete(user.id);
          
          try {
            const supabase = SupabaseService.getInstance().getAdminClient();
            await supabase
              .from('user_profiles')
              .update({ 
                is_online: false,
                last_active: new Date().toISOString(),
              })
              .eq('id', user.id);
          } catch (error) {
            logger.error('Failed to update user offline status:', error);
          }
        }
      }
    });
  });
};

// Join user to all their rooms
const joinUserRooms = async (socket: Socket, userId: string): Promise<void> => {
  try {
    const supabase = SupabaseService.getInstance().getAdminClient();
    
    const { data: memberships, error } = await supabase
      .from('room_members')
      .select('room_id')
      .eq('user_id', userId);

    if (!error && memberships) {
      for (const membership of memberships) {
        socket.join(`room:${membership.room_id}`);
      }
    }
  } catch (error) {
    logger.error('Failed to join user rooms:', error);
  }
};

// Handle joining a room
const handleJoinRoom = async (socket: Socket, data: { roomId: string }): Promise<void> => {
  try {
    const user = socket.data.user as AuthUser;
    const { roomId } = data;

    if (!roomId) {
      socket.emit('error', { message: 'Room ID is required' });
      return;
    }

    // Verify user is a member of the room
    const supabase = SupabaseService.getInstance().getAdminClient();
    const { data: membership, error } = await supabase
      .from('room_members')
      .select('id')
      .eq('room_id', roomId)
      .eq('user_id', user.id)
      .single();

    if (error || !membership) {
      socket.emit('error', { message: 'Access denied to room' });
      return;
    }

    socket.join(`room:${roomId}`);
    socket.emit('joined_room', { roomId });
    
    // Notify others in room
    socket.to(`room:${roomId}`).emit('user_joined_room', {
      userId: user.id,
      email: user.email,
    });

    logger.info(`User ${user.email} joined room ${roomId}`);
  } catch (error) {
    logger.error('Handle join room error:', error);
    socket.emit('error', { message: 'Failed to join room' });
  }
};

// Handle leaving a room
const handleLeaveRoom = (socket: Socket, data: { roomId: string }): void => {
  try {
    const user = socket.data.user as AuthUser;
    const { roomId } = data;

    if (!roomId) {
      socket.emit('error', { message: 'Room ID is required' });
      return;
    }

    socket.leave(`room:${roomId}`);
    socket.emit('left_room', { roomId });
    
    // Notify others in room
    socket.to(`room:${roomId}`).emit('user_left_room', {
      userId: user.id,
      email: user.email,
    });

    logger.info(`User ${user.email} left room ${roomId}`);
  } catch (error) {
    logger.error('Handle leave room error:', error);
    socket.emit('error', { message: 'Failed to leave room' });
  }
};

// Handle sending a message
const handleSendMessage = async (
  io: SocketIOServer,
  socket: Socket,
  data: { roomId: string; content: { text: string; morse: string }; messageType?: string; replyTo?: string }
): Promise<void> => {
  try {
    const user = socket.data.user as AuthUser;
    const { roomId, content, messageType = 'text', replyTo } = data;

    if (!roomId || !content?.text || !content?.morse) {
      socket.emit('error', { message: 'Room ID and content are required' });
      return;
    }

    // Verify user is a member of the room
    const supabase = SupabaseService.getInstance().getAdminClient();
    const { data: membership, error: memberError } = await supabase
      .from('room_members')
      .select('id')
      .eq('room_id', roomId)
      .eq('user_id', user.id)
      .single();

    if (memberError || !membership) {
      socket.emit('error', { message: 'Access denied to room' });
      return;
    }

    // Create message in database
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        room_id: roomId,
        user_id: user.id,
        content,
        message_type: messageType,
        reply_to: replyTo || null,
      })
      .select(`
        id,
        content,
        message_type,
        reply_to,
        created_at,
        user_profiles!messages_user_id_fkey(
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      socket.emit('error', { message: 'Failed to send message' });
      return;
    }

    // Broadcast message to room
    io.to(`room:${roomId}`).emit('new_message', {
      id: message.id,
      room_id: roomId,
      user: message.user_profiles,
      content: message.content,
      message_type: message.message_type,
      reply_to: message.reply_to,
      created_at: message.created_at,
    });

    logger.info(`Message sent by ${user.email} in room ${roomId}`);
  } catch (error) {
    logger.error('Handle send message error:', error);
    socket.emit('error', { message: 'Failed to send message' });
  }
};

// Handle sending a direct message
const handleSendDirectMessage = async (
  io: SocketIOServer,
  socket: Socket,
  data: { receiverId: string; content: { text: string; morse: string }; messageType?: string; replyTo?: string }
): Promise<void> => {
  try {
    const user = socket.data.user as AuthUser;
    const { receiverId, content, messageType = 'text', replyTo } = data;

    if (!receiverId || !content?.text || !content?.morse) {
      socket.emit('error', { message: 'Receiver ID and content are required' });
      return;
    }

    if (receiverId === user.id) {
      socket.emit('error', { message: 'Cannot send message to yourself' });
      return;
    }

    // Create direct message in database
    const supabase = SupabaseService.getInstance().getAdminClient();
    const { data: message, error } = await supabase
      .from('direct_messages')
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        content,
        message_type: messageType,
        reply_to: replyTo || null,
      })
      .select(`
        id,
        content,
        message_type,
        reply_to,
        created_at,
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
      socket.emit('error', { message: 'Failed to send direct message' });
      return;
    }

    // Send to receiver if online
    const receiverSockets = userSockets.get(receiverId);
    if (receiverSockets) {
      receiverSockets.forEach(socketId => {
        const receiverSocket = connectedUsers.get(socketId);
        if (receiverSocket) {
          receiverSocket.emit('new_direct_message', {
            id: message.id,
            sender: message.sender,
            receiver: message.receiver,
            content: message.content,
            message_type: message.message_type,
            reply_to: message.reply_to,
            created_at: message.created_at,
          });
        }
      });
    }

    // Confirm to sender
    socket.emit('direct_message_sent', {
      id: message.id,
      receiver: message.receiver,
      content: message.content,
      created_at: message.created_at,
    });

    logger.info(`Direct message sent by ${user.email} to ${receiverId}`);
  } catch (error) {
    logger.error('Handle send direct message error:', error);
    socket.emit('error', { message: 'Failed to send direct message' });
  }
};

// Handle typing indicators
const handleTypingStart = (socket: Socket, data: { roomId?: string; receiverId?: string }): void => {
  const user = socket.data.user as AuthUser;
  const { roomId, receiverId } = data;

  if (roomId) {
    socket.to(`room:${roomId}`).emit('user_typing', {
      userId: user.id,
      email: user.email,
      roomId,
    });
  } else if (receiverId) {
    const receiverSockets = userSockets.get(receiverId);
    if (receiverSockets) {
      receiverSockets.forEach(socketId => {
        const receiverSocket = connectedUsers.get(socketId);
        if (receiverSocket) {
          receiverSocket.emit('user_typing_direct', {
            userId: user.id,
            email: user.email,
          });
        }
      });
    }
  }
};

const handleTypingStop = (socket: Socket, data: { roomId?: string; receiverId?: string }): void => {
  const user = socket.data.user as AuthUser;
  const { roomId, receiverId } = data;

  if (roomId) {
    socket.to(`room:${roomId}`).emit('user_stopped_typing', {
      userId: user.id,
      email: user.email,
      roomId,
    });
  } else if (receiverId) {
    const receiverSockets = userSockets.get(receiverId);
    if (receiverSockets) {
      receiverSockets.forEach(socketId => {
        const receiverSocket = connectedUsers.get(socketId);
        if (receiverSocket) {
          receiverSocket.emit('user_stopped_typing_direct', {
            userId: user.id,
            email: user.email,
          });
        }
      });
    }
  }
};

// Handle morse audio transmission
const handleMorseAudioStart = (socket: Socket, data: { roomId: string; audioSettings: any }): void => {
  const user = socket.data.user as AuthUser;
  const { roomId, audioSettings } = data;

  socket.to(`room:${roomId}`).emit('morse_audio_started', {
    userId: user.id,
    email: user.email,
    roomId,
    audioSettings,
  });
};

const handleMorseAudioStop = (socket: Socket, data: { roomId: string }): void => {
  const user = socket.data.user as AuthUser;
  const { roomId } = data;

  socket.to(`room:${roomId}`).emit('morse_audio_stopped', {
    userId: user.id,
    email: user.email,
    roomId,
  });
};

// Handle user presence updates
const handleUserPresence = async (socket: Socket, data: { status: 'online' | 'away' | 'busy' }): Promise<void> => {
  try {
    const user = socket.data.user as AuthUser;
    const { status } = data;

    // Update user presence in database
    const supabase = SupabaseService.getInstance().getAdminClient();
    await supabase
      .from('user_profiles')
      .update({ 
        last_active: new Date().toISOString(),
        // You can extend the schema to include presence status if needed
      })
      .eq('id', user.id);

    // Broadcast presence update to friends/rooms
    socket.broadcast.emit('user_presence_updated', {
      userId: user.id,
      email: user.email,
      status,
      last_active: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('Handle user presence error:', error);
  }
};

// Utility function to emit to user across all their connections
export const emitToUser = (userId: string, event: string, data: any): void => {
  const userSocketSet = userSockets.get(userId);
  if (userSocketSet) {
    userSocketSet.forEach(socketId => {
      const socket = connectedUsers.get(socketId);
      if (socket) {
        socket.emit(event, data);
      }
    });
  }
};

// Utility function to get online users count
export const getOnlineUsersCount = (): number => {
  return userSockets.size;
};

// Utility function to check if user is online
export const isUserOnline = (userId: string): boolean => {
  return userSockets.has(userId);
};
