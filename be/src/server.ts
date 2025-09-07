import express, { Application, Request, Response } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import config from './utils/config';
import logger from './utils/logger';
import ApiResponseUtil from './utils/ApiResponse';
import SupabaseService from './services/supabase';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import roomRoutes from './routes/rooms';
import messageRoutes from './routes/messages';
import friendRoutes from './routes/friends';

// Import socket handlers
import { initializeSocketHandlers } from './sockets';

class Server {
  private app: Application;
  private httpServer;
  private io: SocketIOServer;
  private supabaseService: SupabaseService;

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.io = new SocketIOServer(this.httpServer, {
      cors: {
        origin: config.CORS_ORIGIN,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });
    
    // Initialize Supabase service (will handle missing env vars gracefully)
    this.supabaseService = SupabaseService.getInstance();
    
    if (!this.supabaseService.isReady()) {
      logger.warn('⚠️  Server starting without database connection - some features will be disabled');
    }

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeSocketHandlers();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      crossOriginEmbedderPolicy: false,
    }));

    // CORS configuration
    this.app.use(cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // In development, allow all origins
        if (config.NODE_ENV === 'development') {
          return callback(null, true);
        }
        
        // In production, use configured CORS_ORIGIN
        const allowedOrigins = config.CORS_ORIGIN.split(',').map(o => o.trim());
        if (allowedOrigins.includes(origin) || config.CORS_ORIGIN === '*') {
          return callback(null, true);
        }
        
        return callback(new Error('Not allowed by CORS'), false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));

    // Compression middleware
    this.app.use(compression());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.RATE_LIMIT_WINDOW_MS,
      max: config.RATE_LIMIT_MAX_REQUESTS,
      message: ApiResponseUtil.error('Too many requests from this IP, please try again later.'),
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api', limiter);

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use(requestLogger);

    logger.info('Middleware initialized');
  }

  private initializeRoutes(): void {
    // Root endpoint for basic connectivity test
    this.app.get('/', (_req: Request, res: Response) => {
      res.status(200).send('Morse Code Chat API is running!');
    });

    // Ultra-simple health check endpoint
    this.app.get('/health', (_req: Request, res: Response) => {
      res.status(200).send('OK');
    });

    // More detailed health check
    this.app.get('/health-detailed', (_req: Request, res: Response) => {
      const healthStatus = {
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        database: this.supabaseService.isReady() ? 'connected' : 'disconnected'
      };
      
      res.status(200).json(healthStatus);
    });

    // Environment check endpoint (for debugging)
    this.app.get('/env-check', (_req: Request, res: Response) => {
      const allEnvVars = Object.keys(process.env).sort();
      const supabaseVars = allEnvVars.filter(key => key.startsWith('SUPABASE'));
      const jwtVars = allEnvVars.filter(key => key.includes('JWT'));
      
      const envStatus = {
        NODE_ENV: process.env.NODE_ENV || 'undefined',
        PORT: process.env.PORT || 'undefined',
        totalEnvVars: allEnvVars.length,
        allEnvVarNames: allEnvVars,
        supabaseVars: supabaseVars,
        jwtVars: jwtVars,
        specificChecks: {
          SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'MISSING',
          SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
          SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
          JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'MISSING',
          FRONTEND_URL: process.env.FRONTEND_URL || 'undefined',
          DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'MISSING'
        }
      };
      
      res.status(200).json(envStatus);
    });

    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/users', userRoutes);
    this.app.use('/api/rooms', roomRoutes);
    this.app.use('/api/messages', messageRoutes);
    this.app.use('/api/friends', friendRoutes);

    // 404 handler
    this.app.use('*', (_req: Request, res: Response) => {
      res.status(404).json(ApiResponseUtil.error('Route not found'));
    });

    logger.info('Routes initialized');
  }

  private initializeSocketHandlers(): void {
    initializeSocketHandlers(this.io);
    logger.info('Socket.IO handlers initialized');
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
    logger.info('Error handling initialized');
  }

  public async start(): Promise<void> {
    try {
      // Test database connection (but don't fail if it's not available)
      const dbConnected = await this.supabaseService.testConnection();
      if (!dbConnected) {
        logger.warn('⚠️  Database connection failed - server will start without database features');
      } else {
        logger.info('✅ Database connection successful');
      }

      // Start server regardless of database status
      this.httpServer.listen(config.PORT, config.HOST, () => {
        console.log(`🚀 Server successfully started!`);
        console.log(`📍 Binding to: ${config.HOST}:${config.PORT}`);
        console.log(`🌐 Server accessible at: http://${config.HOST}:${config.PORT}`);
        logger.info(`🚀 Server running on http://${config.HOST}:${config.PORT}`);
        logger.info(`📡 Socket.IO server ready for connections`);
        logger.info(`🌍 Environment: ${config.NODE_ENV}`);
        logger.info(`🔗 CORS origin: ${config.CORS_ORIGIN}`);
        if (dbConnected) {
          logger.info(`🗄️  Database: Connected`);
        } else {
          logger.warn(`🗄️  Database: Disconnected (some features disabled)`);
        }
      });

      // Add error handling for server startup
      this.httpServer.on('error', (error: any) => {
        console.error('❌ Server failed to start:', error);
        logger.error('Server startup error:', error);
        throw error;
      });

      // Graceful shutdown handling
      process.on('SIGTERM', () => this.shutdown());
      process.on('SIGINT', () => this.shutdown());

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  private shutdown(): void {
    logger.info('🔄 Shutting down server gracefully...');
    
    this.httpServer.close((err) => {
      if (err) {
        logger.error('Error during server shutdown:', err);
        process.exit(1);
      }
      
      logger.info('✅ Server shut down successfully');
      process.exit(0);
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('⚠️  Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  }

  public getApp(): Application {
    return this.app;
  }

  public getIO(): SocketIOServer {
    return this.io;
  }
}

export default Server;
