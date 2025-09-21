import { DatabaseConfig } from './database';

// Environment variable validation
const validateEnvVar = (name: string, value: string | undefined): string => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

// Database configuration factory
export const createDatabaseConfig = (): DatabaseConfig => {
  const url = validateEnvVar('SUPABASE_URL', process.env.SUPABASE_URL);
  const anonKey = validateEnvVar('SUPABASE_ANON_KEY', process.env.SUPABASE_ANON_KEY);
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  return {
    url,
    anonKey,
    serviceRoleKey,
    options: {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          'X-Client-Info': 'morse-chat-app-microservices',
        },
      },
    },
  };
};

// Database configuration for different environments
export const getDatabaseConfig = (environment: 'development' | 'staging' | 'production' = 'development'): DatabaseConfig => {
  switch (environment) {
    case 'development':
      return createDatabaseConfig();
    
    case 'staging':
      return {
        ...createDatabaseConfig(),
        options: {
          ...createDatabaseConfig().options,
          global: {
            headers: {
              'X-Client-Info': 'morse-chat-app-microservices-staging',
            },
          },
        },
      };
    
    case 'production':
      return {
        ...createDatabaseConfig(),
        options: {
          ...createDatabaseConfig().options,
          global: {
            headers: {
              'X-Client-Info': 'morse-chat-app-microservices-production',
            },
          },
        },
      };
    
    default:
      throw new Error(`Unknown environment: ${environment}`);
  }
};

// Validate database configuration
export const validateDatabaseConfig = (config: DatabaseConfig): boolean => {
  try {
    if (!config.url || !config.anonKey) {
      return false;
    }

    // Basic URL validation
    try {
      new URL(config.url);
    } catch {
      return false;
    }

    // Check if service role key is provided for admin operations
    if (!config.serviceRoleKey) {
      console.warn('Service role key not provided. Admin operations will not be available.');
    }

    return true;
  } catch {
    return false;
  }
};

// Get database connection string for logging (without sensitive data)
export const getDatabaseConnectionString = (config: DatabaseConfig): string => {
  try {
    const url = new URL(config.url);
    return `${url.protocol}//${url.hostname}:${url.port || (url.protocol === 'https:' ? '443' : '80')}`;
  } catch {
    return 'Invalid database URL';
  }
};

export default createDatabaseConfig;
