import { createClient } from '@supabase/supabase-js';
import { Database } from '@shared/types/supabase';
import { env } from '../config/environment';

// Create Supabase client for authentication operations
export const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY, // Use service role key for admin operations
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false, // We'll handle sessions manually with JWT
      detectSessionInUrl: false
    },
    global: {
      headers: {
        'X-Client-Info': 'auth-service'
      }
    }
  }
);

// Create client for user operations (with anon key)
export const supabaseAnon = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        'X-Client-Info': 'auth-service-anon'
      }
    }
  }
);

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
    
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection test error:', error);
    return false;
  }
}

// User profile helpers
export const authHelpers = {
  // Get user profile by ID
  async getUserById(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    
    return data;
  },

  // Get user profile by email
  async getUserByEmail(email: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) {
      console.error('Error fetching user by email:', error);
      return null;
    }
    
    return data;
  },

  // Create user profile
  async createUserProfile(userData: {
    id: string;
    email: string;
    username: string;
    display_name?: string;
  }) {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([{
        id: userData.id,
        email: userData.email,
        username: userData.username,
        display_name: userData.display_name || userData.username,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating user profile:', error);
      return null;
    }
    
    return data;
  },

  // Update user profile
  async updateUserProfile(userId: string, updates: {
    username?: string;
    display_name?: string;
    bio?: string;
    avatar_url?: string;
  }) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating user profile:', error);
      return null;
    }
    
    return data;
  }
};

export default supabase;