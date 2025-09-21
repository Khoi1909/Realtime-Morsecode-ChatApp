import { Router, Request, Response } from 'express';
import { MorseTranslator, MorseTranslationRequest } from '../services/morseTranslator';
import { ApiResponse } from '@shared/utils/ApiResponse';
import { ApiError } from '@shared/utils/ApiError';
import { logTranslationRequest, logTranslationSuccess, logTranslationError, logValidationRequest, logValidationResult } from '../utils/logger';
import { recordTranslation, recordValidation, recordRequest } from '../utils/metrics';

const router = Router();

/**
 * POST /translate
 * Translate text to morse or morse to text
 */
router.post('/translate', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const { text, morse, direction }: MorseTranslationRequest = req.body;

    if (!direction || !['text-to-morse', 'morse-to-text'].includes(direction)) {
      throw new ApiError('Invalid direction. Must be "text-to-morse" or "morse-to-text"', 400);
    }

    // Log translation request
    logTranslationRequest({
      userId: (req as any).userId,
      userEmail: (req as any).userEmail,
      sessionId: (req as any).sessionId,
      requestSource: (req as any).requestSource,
      correlationId: (req as any).correlationId,
      direction,
      inputLength: (text || morse)?.length || 0
    });

    const result = MorseTranslator.translate({ text, morse, direction });
    const duration = Date.now() - startTime;
    const inputLength = (text || morse)?.length || 0;
    const outputLength = result.translated.length;
    
    // Record metrics
    recordTranslation(direction, 'success', (req as any).userId, duration, inputLength, outputLength);
    recordRequest('POST', '/translate', 200, (req as any).userId, duration);
    
    // Log successful translation
    logTranslationSuccess({
      userId: (req as any).userId,
      userEmail: (req as any).userEmail,
      sessionId: (req as any).sessionId,
      requestSource: (req as any).requestSource,
      correlationId: (req as any).correlationId,
      direction,
      inputLength,
      outputLength,
      duration: `${duration}ms`
    });
    
    res.json(new ApiResponse(true, 'Translation successful', result));
  } catch (error: any) {
    const duration = Date.now() - startTime;
    const direction = req.body.direction;
    const inputLength = (req.body.text || req.body.morse)?.length || 0;
    
    // Record error metrics
    recordTranslation(direction, 'error', (req as any).userId, duration, inputLength);
    recordRequest('POST', '/translate', error instanceof ApiError ? error.statusCode : 500, (req as any).userId, duration);
    
    // Log translation failure
    logTranslationError(error, {
      userId: (req as any).userId,
      userEmail: (req as any).userEmail,
      sessionId: (req as any).sessionId,
      requestSource: (req as any).requestSource,
      correlationId: (req as any).correlationId,
      direction,
      inputLength,
      duration: `${duration}ms`
    });
    
    if (error instanceof ApiError) {
      res.status(error.statusCode).json(new ApiResponse(false, error.message));
    } else {
      res.status(500).json(new ApiResponse(false, 'Translation failed', null, error?.message || 'Unknown error'));
    }
  }
});

/**
 * POST /text-to-morse
 * Convert text to morse code
 */
router.post('/text-to-morse', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      throw new ApiError('Text is required and must be a string', 400);
    }

    // Log translation request
    logTranslationRequest({
      userId: (req as any).userId,
      userEmail: (req as any).userEmail,
      sessionId: (req as any).sessionId,
      requestSource: (req as any).requestSource,
      correlationId: (req as any).correlationId,
      direction: 'text-to-morse',
      inputLength: text.length
    });

    const morse = MorseTranslator.textToMorse(text);
    const duration = Date.now() - startTime;
    const inputLength = text.length;
    const outputLength = morse.length;
    
    // Record metrics
    recordTranslation('text-to-morse', 'success', (req as any).userId, duration, inputLength, outputLength);
    recordRequest('POST', '/text-to-morse', 200, (req as any).userId, duration);
    
    // Log successful translation
    logTranslationSuccess({
      userId: (req as any).userId,
      userEmail: (req as any).userEmail,
      sessionId: (req as any).sessionId,
      requestSource: (req as any).requestSource,
      correlationId: (req as any).correlationId,
      direction: 'text-to-morse',
      inputLength,
      outputLength,
      duration: `${duration}ms`
    });
    
    res.json(new ApiResponse(true, 'Text to morse conversion successful', {
      original: text,
      morse,
      timestamp: new Date().toISOString()
    }));
  } catch (error: any) {
    const duration = Date.now() - startTime;
    const inputLength = req.body.text?.length || 0;
    
    // Record error metrics
    recordTranslation('text-to-morse', 'error', (req as any).userId, duration, inputLength);
    recordRequest('POST', '/text-to-morse', error instanceof ApiError ? error.statusCode : 500, (req as any).userId, duration);
    
    // Log translation failure
    logTranslationError(error, {
      userId: (req as any).userId,
      userEmail: (req as any).userEmail,
      sessionId: (req as any).sessionId,
      requestSource: (req as any).requestSource,
      correlationId: (req as any).correlationId,
      direction: 'text-to-morse',
      inputLength,
      duration: `${duration}ms`
    });
    
    if (error instanceof ApiError) {
      res.status(error.statusCode).json(new ApiResponse(false, error.message));
    } else {
      res.status(500).json(new ApiResponse(false, 'Text to morse conversion failed', null, error?.message || 'Unknown error'));
    }
  }
});

/**
 * POST /morse-to-text
 * Convert morse code to text
 */
router.post('/morse-to-text', async (req: Request, res: Response) => {
  try {
    const { morse } = req.body;

    if (!morse || typeof morse !== 'string') {
      throw new ApiError('Morse code is required and must be a string', 400);
    }

    const text = MorseTranslator.morseToText(morse);
    
    res.json(new ApiResponse(true, 'Morse to text conversion successful', {
      original: morse,
      text,
      timestamp: new Date().toISOString()
    }));
  } catch (error: any) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json(new ApiResponse(false, error.message));
    } else {
      res.status(500).json(new ApiResponse(false, 'Morse to text conversion failed', null, error?.message || 'Unknown error'));
    }
  }
});

/**
 * GET /validate/morse
 * Validate morse code format
 */
router.get('/validate/morse', async (req: Request, res: Response) => {
  try {
    const { morse } = req.query;

    if (!morse || typeof morse !== 'string') {
      throw new ApiError('Morse code parameter is required', 400);
    }

    // Log validation request
    logValidationRequest({
      userId: (req as any).userId,
      userEmail: (req as any).userEmail,
      sessionId: (req as any).sessionId,
      requestSource: (req as any).requestSource,
      correlationId: (req as any).correlationId
    });

    const isValid = MorseTranslator.validateMorseCode(morse);
    
    // Log validation result
    logValidationResult(isValid, {
      userId: (req as any).userId,
      userEmail: (req as any).userEmail,
      sessionId: (req as any).sessionId,
      requestSource: (req as any).requestSource,
      correlationId: (req as any).correlationId
    });
    
    res.json(new ApiResponse(true, 'Validation completed', {
      morse,
      isValid,
      timestamp: new Date().toISOString()
    }));
  } catch (error: any) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json(new ApiResponse(false, error.message));
    } else {
      res.status(500).json(new ApiResponse(false, 'Validation failed', null, error?.message || 'Unknown error'));
    }
  }
});

/**
 * GET /validate/text
 * Validate text for morse conversion
 */
router.get('/validate/text', async (req: Request, res: Response) => {
  try {
    const { text } = req.query;

    if (!text || typeof text !== 'string') {
      throw new ApiError('Text parameter is required', 400);
    }

    const isValid = MorseTranslator.validateText(text);
    
    res.json(new ApiResponse(true, 'Validation completed', {
      text,
      isValid,
      timestamp: new Date().toISOString()
    }));
  } catch (error: any) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json(new ApiResponse(false, error.message));
    } else {
      res.status(500).json(new ApiResponse(false, 'Validation failed', null, error?.message || 'Unknown error'));
    }
  }
});

/**
 * GET /characters
 * Get list of supported characters
 */
router.get('/characters', async (req: Request, res: Response) => {
  try {
    const characters = MorseTranslator.getSupportedCharacters();
    
    res.json(new ApiResponse(true, 'Supported characters retrieved', {
      characters,
      count: characters.length,
      timestamp: new Date().toISOString()
    }));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, 'Failed to retrieve characters', null, error?.message || 'Unknown error'));
  }
});

/**
 * GET /health
 * Health check endpoint
 */
router.get('/health', async (req: Request, res: Response) => {
  res.json(new ApiResponse(true, 'Morse Service is healthy', {
    service: 'morse-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  }));
});

export default router;
