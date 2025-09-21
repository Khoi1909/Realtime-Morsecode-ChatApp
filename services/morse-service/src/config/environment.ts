// Morse Service Environment Configuration
// This service only needs basic configuration, not database/auth settings

export interface MorseServiceConfig {
  NODE_ENV: string;
  PORT: number;
  MORSE_SERVICE_PORT: number;
  MORSE_SERVICE_URL: string;
  LOG_LEVEL: string;
}

export const env: MorseServiceConfig = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3007', 10),
  MORSE_SERVICE_PORT: parseInt(process.env.MORSE_SERVICE_PORT || '3007', 10),
  MORSE_SERVICE_URL: process.env.MORSE_SERVICE_URL || 'http://localhost:3007',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};
