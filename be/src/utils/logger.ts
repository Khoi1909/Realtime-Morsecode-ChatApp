import winston from 'winston';
import config from './config';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define different colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Chose the aspect of your log customizing the log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define which transports the logger must use to print out messages
const transports = [
  // Allow console logging
  new winston.transports.Console({
    level: config.LOG_LEVEL,
    handleExceptions: true,
  }),
];

// Create the logger instance that has to be exported 
// and used to log messages.
const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  levels,
  format,
  transports,
});

export default logger;
