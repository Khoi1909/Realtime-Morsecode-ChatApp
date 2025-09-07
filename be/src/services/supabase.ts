import { createClient, SupabaseClient } from '@supabase/supabase-js';
import config from '../utils/config';
import logger from '../utils/logger';

class SupabaseService {
  private static instance: SupabaseService;
  private supabase: SupabaseClient | null = null;
  private adminClient: SupabaseClient | null = null;
  private isInitialized: boolean = false;

  private constructor() {
    // Only initialize if we have the required environment variables
    if (config.SUPABASE_URL && config.SUPABASE_ANON_KEY && config.SUPABASE_SERVICE_ROLE_KEY) {
      // Public client for regular operations
      this.supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
      
      // Admin client for privileged operations
      this.adminClient = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);
      
      this.isInitialized = true;
      logger.info('Supabase clients initialized');
    } else {
      logger.warn('Supabase not initialized - missing environment variables');
    }
  }

  public static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  public isReady(): boolean {
    return this.isInitialized;
  }

  public getClient(): SupabaseClient {
    if (!this.isInitialized || !this.supabase) {
      throw new Error('Supabase client not initialized - check environment variables');
    }
    return this.supabase;
  }

  public getAdminClient(): SupabaseClient {
    if (!this.isInitialized || !this.adminClient) {
      throw new Error('Supabase admin client not initialized - check environment variables');
    }
    return this.adminClient;
  }

  // Set user session for authenticated requests
  public setSession(accessToken: string): SupabaseClient {
    return createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });
  }

  // Test database connection
  public async testConnection(): Promise<boolean> {
    try {
      if (!this.isInitialized || !this.supabase) {
        logger.warn('Cannot test connection - Supabase not initialized');
        return false;
      }

      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('count', { count: 'exact', head: true });

      if (error) {
        logger.error('Supabase connection test failed:', error);
        return false;
      }

      logger.info('Supabase connection test successful');
      return true;
    } catch (error) {
      logger.error('Supabase connection test error:', error);
      return false;
    }
  }
}

export default SupabaseService;
