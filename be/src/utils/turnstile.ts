import config from './config';
import logger from './logger';

interface TurnstileValidationResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
}

export const validateTurnstileToken = async (token: string, remoteip?: string): Promise<boolean> => {
  // Skip validation in development if no secret key is configured
  if (!config.TURNSTILE_SECRET_KEY) {
    logger.warn('Turnstile secret key not configured, skipping validation');
    return true; // Allow in development
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', config.TURNSTILE_SECRET_KEY);
    formData.append('response', token);
    if (remoteip) {
      formData.append('remoteip', remoteip);
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    const result = await response.json() as TurnstileValidationResponse;
    
    if (!result.success) {
      logger.warn('Turnstile validation failed:', result['error-codes']);
      return false;
    }

    logger.debug('Turnstile validation successful');
    return true;
  } catch (error) {
    logger.error('Error validating Turnstile token:', error);
    return false;
  }
};

export default validateTurnstileToken;
