import { createClient, SupabaseClient } from '@supabase/supabase-js';
import config from '../utils/config';
import logger from '../utils/logger';

class SupabaseService {
  private static instance: SupabaseService;
  private supabase: SupabaseClient;
  private adminClient: SupabaseClient;

  private constructor() {
    // Public client for regular operations
    this.supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
    
    // Admin client for privileged operations
    this.adminClient = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

    logger.info('Supabase clients initialized');
  }

  public static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  public getClient(): SupabaseClient {
    return this.supabase;
  }

  public getAdminClient(): SupabaseClient {
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
