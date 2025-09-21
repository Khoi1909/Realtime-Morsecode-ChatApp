import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

// Validation schemas
const schemas = {
  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required'
    }),
    turnstileToken: Joi.string().optional()
  }),

  register: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required'
    }),
    username: Joi.string().alphanum().min(3).max(20).required().messages({
      'string.alphanum': 'Username must contain only letters and numbers',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username must be no more than 20 characters long',
      'any.required': 'Username is required'
    }),
    display_name: Joi.string().min(1).max(50).optional().messages({
      'string.min': 'Display name must be at least 1 character long',
      'string.max': 'Display name must be no more than 50 characters long'
    }),
    turnstileToken: Joi.string().optional()
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().required().messages({
      'any.required': 'Refresh token is required'
    })
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required().messages({
      'any.required': 'Current password is required'
    }),
    newPassword: Joi.string().min(6).required().messages({
      'string.min': 'New password must be at least 6 characters long',
      'any.required': 'New password is required'
    })
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    })
  }),

  resetPassword: Joi.object({
    token: Joi.string().required().messages({
      'any.required': 'Reset token is required'
    }),
    newPassword: Joi.string().min(6).required().messages({
      'string.min': 'New password must be at least 6 characters long',
      'any.required': 'New password is required'
    })
  })
};

// Validation middleware factory
const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Please check your input data',
        details: errorMessages
      });
      return;
    }

    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
};

// Export validation middleware for each endpoint
export const validateLogin = validate(schemas.login);
export const validateRegister = validate(schemas.register);
export const validateRefreshToken = validate(schemas.refreshToken);
export const validateChangePassword = validate(schemas.changePassword);
export const validateForgotPassword = validate(schemas.forgotPassword);
export const validateResetPassword = validate(schemas.resetPassword);

export default {
  validateLogin,
  validateRegister,
  validateRefreshToken,
  validateChangePassword,
  validateForgotPassword,
  validateResetPassword
};
