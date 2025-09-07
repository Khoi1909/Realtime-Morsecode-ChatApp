import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import ApiError from '../utils/ApiError';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');
      
      throw new ApiError(errorMessage, 400);
    }
    
    next();
  };
};

// Common validation schemas
export const schemas = {
  // User validation
  updateProfile: Joi.object({
    display_name: Joi.string().max(100).optional(),
    bio: Joi.string().max(500).optional(),
    morse_skill_level: Joi.number().integer().min(1).max(10).optional(),
    preferred_speed: Joi.number().integer().min(5).max(50).optional(),
    avatar_url: Joi.string().uri().optional().allow(''),
    preferences: Joi.object().optional(),
  }),

  // Room validation
  createRoom: Joi.object({
    name: Joi.string().required().max(100),
    description: Joi.string().max(500).optional().allow(''),
    is_private: Joi.boolean().required(),
    password: Joi.string().when('is_private', {
      is: true,
      then: Joi.string().min(6).max(50),
      otherwise: Joi.optional(),
    }),
    room_type: Joi.string().valid('general', 'learning', 'practice', 'private').required(),
    max_members: Joi.number().integer().min(2).max(1000).optional(),
  }),

  updateRoom: Joi.object({
    name: Joi.string().max(100).optional(),
    description: Joi.string().max(500).optional().allow(''),
    password: Joi.string().min(6).max(50).optional().allow(''),
    max_members: Joi.number().integer().min(2).max(1000).optional(),
    settings: Joi.object().optional(),
  }),

  // Message validation
  sendMessage: Joi.object({
    room_id: Joi.string().uuid().required(),
    content: Joi.object({
      text: Joi.string().required().max(2000),
      morse: Joi.string().required().max(10000),
    }).required(),
    message_type: Joi.string().valid('text', 'morse_only').optional(),
    reply_to: Joi.string().uuid().optional(),
  }),

  sendDirectMessage: Joi.object({
    receiver_id: Joi.string().uuid().required(),
    content: Joi.object({
      text: Joi.string().required().max(2000),
      morse: Joi.string().required().max(10000),
    }).required(),
    message_type: Joi.string().valid('text', 'morse_only').optional(),
    reply_to: Joi.string().uuid().optional(),
  }),

  // Friend validation
  sendFriendRequest: Joi.object({
    username: Joi.string().required().max(50),
  }),

  // Group invitation validation
  sendInvitation: Joi.object({
    room_id: Joi.string().uuid().required(),
    username: Joi.string().required().max(50),
  }),

  // Auth validation
  signUp: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(100).required(),
    username: Joi.string().alphanum().min(3).max(50).required(),
    displayName: Joi.string().max(100).required(),
    turnstileToken: Joi.string().optional(), // Optional for demo purposes
  }),

  signIn: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    turnstileToken: Joi.string().optional(), // Optional for demo purposes
  }),

  // Learning session validation
  createLearningSession: Joi.object({
    session_type: Joi.string().valid('letters', 'numbers', 'words', 'sentences').required(),
    difficulty_level: Joi.number().integer().min(1).max(10).required(),
  }),

  updateLearningSession: Joi.object({
    score: Joi.number().integer().min(0).optional(),
    total_attempts: Joi.number().integer().min(0).optional(),
    correct_attempts: Joi.number().integer().min(0).optional(),
    wpm_achieved: Joi.number().integer().min(0).optional(),
    session_data: Joi.object().optional(),
  }),
};

// Validate query parameters
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.query, { abortEarly: false });
    
    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');
      
      throw new ApiError(errorMessage, 400);
    }
    
    next();
  };
};

// Common query schemas
export const querySchemas = {
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),

  messageHistory: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(50),
    before: Joi.string().isoDate().optional(),
    after: Joi.string().isoDate().optional(),
  }),

  searchUsers: Joi.object({
    q: Joi.string().required().min(1).max(50),
    limit: Joi.number().integer().min(1).max(20).default(10),
  }),
};
