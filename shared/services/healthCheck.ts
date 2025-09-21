import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Health check result interface
export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  responseTime: number;
  details: {
    connection: boolean;
    query: boolean;
    error?: string;
  };
}

// Database health checker
export class DatabaseHealthChecker {
  private client: SupabaseClient<Database>;
  private serviceName: string;

  constructor(client: SupabaseClient<Database>, serviceName: string = 'database') {
    this.client = client;
    this.serviceName = serviceName;
  }

  // Perform comprehensive health check
  public async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Test basic connection
      const connectionTest = await this.testConnection();
      
      // Test query execution
      const queryTest = await this.testQuery();
      
      const responseTime = Date.now() - startTime;
      
      const status = connectionTest && queryTest ? 'healthy' : 'unhealthy';
      
      return {
        service: this.serviceName,
        status,
        timestamp: new Date().toISOString(),
        responseTime,
        details: {
          connection: connectionTest,
          query: queryTest,
        },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        service: this.serviceName,
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime,
        details: {
          connection: false,
          query: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  // Test basic connection
  private async testConnection(): Promise<boolean> {
    try {
      const { error } = await this.client
        .from('user_profiles')
        .select('count')
        .limit(1);

      return !error;
    } catch {
      return false;
    }
  }

  // Test query execution
  private async testQuery(): Promise<boolean> {
    try {
      const { data, error } = await this.client
        .from('user_profiles')
        .select('id')
        .limit(1);

      return !error && Array.isArray(data);
    } catch {
      return false;
    }
  }

  // Test specific table access
  public async testTableAccess(tableName: string): Promise<boolean> {
    try {
      const { error } = await this.client
        .from(tableName as any)
        .select('count')
        .limit(1);

      return !error;
    } catch {
      return false;
    }
  }

  // Test RLS policies
  public async testRLSPolicies(): Promise<{
    userProfiles: boolean;
    rooms: boolean;
    messages: boolean;
    friends: boolean;
  }> {
    const results = await Promise.allSettled([
      this.testTableAccess('user_profiles'),
      this.testTableAccess('rooms'),
      this.testTableAccess('messages'),
      this.testTableAccess('friends'),
    ]);

    return {
      userProfiles: results[0].status === 'fulfilled' && results[0].value,
      rooms: results[1].status === 'fulfilled' && results[1].value,
      messages: results[2].status === 'fulfilled' && results[2].value,
      friends: results[3].status === 'fulfilled' && results[3].value,
    };
  }
}

// Health check endpoint handler
export const createHealthCheckHandler = (client: SupabaseClient<Database>, serviceName: string) => {
  const healthChecker = new DatabaseHealthChecker(client, serviceName);

  return async (): Promise<HealthCheckResult> => {
    return healthChecker.performHealthCheck();
  };
};

// Batch health check for multiple services
export const performBatchHealthCheck = async (
  clients: Array<{ client: SupabaseClient<Database>; name: string }>
): Promise<HealthCheckResult[]> => {
  const healthCheckers = clients.map(({ client, name }) => 
    new DatabaseHealthChecker(client, name)
  );

  const results = await Promise.allSettled(
    healthCheckers.map(checker => checker.performHealthCheck())
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        service: clients[index].name,
        status: 'unhealthy' as const,
        timestamp: new Date().toISOString(),
        responseTime: 0,
        details: {
          connection: false,
          query: false,
          error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
        },
      };
    }
  });
};

export default DatabaseHealthChecker;
