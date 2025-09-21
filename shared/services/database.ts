import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Database configuration interface
export interface DatabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
  options?: {
    auth?: {
      persistSession?: boolean;
      autoRefreshToken?: boolean;
    };
    global?: {
      headers?: Record<string, string>;
    };
  };
}

// Database connection manager
export class DatabaseService {
  private static instance: DatabaseService;
  private adminClient: SupabaseClient<Database> | null = null;
  private anonClient: SupabaseClient<Database> | null = null;
  private config: DatabaseConfig | null = null;

  private constructor() {}

  // Singleton pattern
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // Initialize database connections
  public initialize(config: DatabaseConfig): void {
    this.config = config;
    
    // Create anonymous client
    this.anonClient = createClient<Database>(
      config.url,
      config.anonKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        ...config.options
      }
    );

    // Create admin client if service role key is provided
    if (config.serviceRoleKey) {
      this.adminClient = createClient<Database>(
        config.url,
        config.serviceRoleKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
          ...config.options
        }
      );
    }

    console.log('Database service initialized successfully');
  }

  // Get anonymous client (for public operations)
  public getAnonClient(): SupabaseClient<Database> {
    if (!this.anonClient) {
      throw new Error('Database service not initialized. Call initialize() first.');
    }
    return this.anonClient;
  }

  // Get admin client (for privileged operations)
  public getAdminClient(): SupabaseClient<Database> {
    if (!this.adminClient) {
      throw new Error('Admin client not available. Service role key not provided.');
    }
    return this.adminClient;
  }

  // Test database connection
  public async testConnection(): Promise<boolean> {
    try {
      if (!this.anonClient) {
        throw new Error('Database service not initialized');
      }

      const { data, error } = await this.anonClient
        .from('user_profiles')
        .select('count')
        .limit(1);

      if (error) {
        console.error('Database connection test failed:', error);
        return false;
      }

      console.log('Database connection test successful');
      return true;
    } catch (error) {
      console.error('Database connection test error:', error);
      return false;
    }
  }

  // Get database health status
  public async getHealthStatus(): Promise<{
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    details?: any;
  }> {
    try {
      const isConnected = await this.testConnection();
      
      return {
        status: isConnected ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        details: {
          hasAnonClient: !!this.anonClient,
          hasAdminClient: !!this.adminClient,
          configUrl: this.config?.url
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  // Close all connections
  public async closeConnections(): Promise<void> {
    try {
      // Supabase clients don't have explicit close methods
      // but we can clear the references
      this.anonClient = null;
      this.adminClient = null;
      this.config = null;
      
      console.log('Database connections closed');
    } catch (error) {
      console.error('Error closing database connections:', error);
    }
  }

  // Reconnect to database
  public async reconnect(): Promise<void> {
    if (!this.config) {
      throw new Error('Cannot reconnect: no configuration available');
    }
    
    await this.closeConnections();
    this.initialize(this.config);
  }
}

// Convenience functions for easy access
export const dbService = DatabaseService.getInstance();

// Helper function to initialize database service
export const initializeDatabase = (config: DatabaseConfig): void => {
  dbService.initialize(config);
};

// Helper function to get anonymous client
export const getDbClient = (): SupabaseClient<Database> => {
  return dbService.getAnonClient();
};

// Helper function to get admin client
export const getAdminDbClient = (): SupabaseClient<Database> => {
  return dbService.getAdminClient();
};

// Helper function to test connection
export const testDbConnection = async (): Promise<boolean> => {
  return dbService.testConnection();
};

// Helper function to get health status
export const getDbHealthStatus = async () => {
  return dbService.getHealthStatus();
};

export default dbService;
