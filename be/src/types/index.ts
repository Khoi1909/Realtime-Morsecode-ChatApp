// Core TypeScript interfaces and types for the morse chat application

export interface UserProfile {
  id: string;
  username: string;
  display_name?: string;
  morse_skill_level: number;
  preferred_speed: number;
  avatar_url?: string;
  bio?: string;
  total_messages_count: number;
  learning_progress: Record<string, any>;
  preferences: Record<string, any>;
  is_online: boolean;
  last_active: string;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  name: string;
  description?: string;
  is_private: boolean;
  password_hash?: string;
  max_members: number;
  room_type: 'general' | 'learning' | 'practice' | 'private';
  settings: Record<string, any>;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface RoomMember {
  id: string;
  room_id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
  last_read_message_id?: string;
  notifications_enabled: boolean;
}

export interface Message {
  id: string;
  room_id: string;
  user_id: string;
  content: {
    text: string;
    morse: string;
  };
  message_type: 'text' | 'system' | 'morse_only';
  reply_to?: string;
  thread_id?: string;
  edit_history: any[];
  metadata: Record<string, any>;
  is_deleted: boolean;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: {
    text: string;
    morse: string;
  };
  message_type: 'text' | 'system' | 'morse_only';
  reply_to?: string;
  edit_history: any[];
  is_read: boolean;
  is_deleted: boolean;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Friend {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  updated_at: string;
}

export interface GroupInvitation {
  id: string;
  room_id: string;
  inviter_id: string;
  invitee_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  invitation_code: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface LearningSession {
  id: string;
  user_id: string;
  session_type: string;
  difficulty_level: number;
  score: number;
  total_attempts: number;
  correct_attempts: number;
  wpm_achieved?: number;
  session_data: Record<string, any>;
  completed_at?: string;
  created_at: string;
}

// API Request/Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Socket.IO event types
export interface SocketUser {
  id: string;
  username: string;
  display_name?: string;
  is_online: boolean;
}

export interface SocketMessage {
  id: string;
  room_id: string;
  user: SocketUser;
  content: {
    text: string;
    morse: string;
  };
  message_type: 'text' | 'system' | 'morse_only';
  reply_to?: string;
  created_at: string;
}

export interface SocketRoom {
  id: string;
  name: string;
  description?: string;
  is_private: boolean;
  room_type: string;
  member_count: number;
}

// Authentication types
export interface AuthUser {
  id: string;
  email: string;
  role: string;
  aud: string;
  exp: number;
  iat: number;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  exp: number;
  iat: number;
}

// Validation types
export interface CreateRoomRequest {
  name: string;
  description?: string;
  is_private: boolean;
  password?: string;
  room_type: 'general' | 'learning' | 'practice' | 'private';
  max_members?: number;
}

export interface UpdateProfileRequest {
  display_name?: string;
  bio?: string;
  morse_skill_level?: number;
  preferred_speed?: number;
  avatar_url?: string;
  preferences?: Record<string, any>;
}

export interface SendMessageRequest {
  room_id: string;
  content: {
    text: string;
    morse: string;
  };
  message_type?: 'text' | 'morse_only';
  reply_to?: string;
}

export interface SendDirectMessageRequest {
  receiver_id: string;
  content: {
    text: string;
    morse: string;
  };
  message_type?: 'text' | 'morse_only';
  reply_to?: string;
}

// Error types
export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}

// Environment types
export interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  HOST: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  JWT_SECRET: string;
  JWT_EXPIRE_TIME: string;
  CORS_ORIGIN: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  MAX_FILE_SIZE: number;
  UPLOAD_PATH: string;
  LOG_LEVEL: string;
  REDIS_URL?: string;
  TURNSTILE_SECRET_KEY?: string;
}
