import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/environment';
import morseRoutes from './routes/morse';
import { requestLogger } from '@shared/utils/logger';
import metrics from './utils/metrics';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// User context middleware
app.use((req: any, res: any, next: any) => {
  // Extract user info from headers (if available)
  req.userId = req.headers['x-user-id'];
  req.userEmail = req.headers['x-user-email'];
  req.sessionId = req.headers['x-session-id'];
  req.requestSource = req.headers['x-request-source']; // 'chat', 'learning', etc.
  req.correlationId = req.headers['x-correlation-id'] || req.headers['x-request-id'];
  
  next();
});

// Request logging
app.use(requestLogger);

// Routes
app.use('/morse', morseRoutes);

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', metrics.contentType);
    res.end(await metrics.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'morse-service',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      translate: 'POST /morse/translate',
      textToMorse: 'POST /morse/text-to-morse',
      morseToText: 'POST /morse/morse-to-text',
      validateMorse: 'GET /morse/validate/morse',
      validateText: 'GET /morse/validate/text',
      characters: 'GET /morse/characters',
      health: 'GET /morse/health'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: env.NODE_ENV === 'development' ? error.message : undefined
  });
});

const PORT = env.PORT;

app.listen(PORT, () => {
  console.log(`🚀 Morse Service running on port ${PORT}`);
  console.log(`📡 Environment: ${env.NODE_ENV}`);
  console.log(`🔗 Service URL: ${env.MORSE_SERVICE_URL}`);
  console.log(`📊 Log Level: ${env.LOG_LEVEL}`);
});

export default app;
