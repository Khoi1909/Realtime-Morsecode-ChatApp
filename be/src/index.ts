#!/usr/bin/env node

import Server from './server';
import logger from './utils/logger';

const startServer = async (): Promise<void> => {
  try {
    console.log('🚀 Console: Starting Morse Code Chat Server...');
    logger.info('🚀 Logger: Starting Morse Code Chat Server...');
    
    const server = new Server();
    await server.start();
    
  } catch (error) {
    console.error('❌ Console: Failed to start server:', error);
    logger.error('❌ Logger: Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();
