import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Migration interface
export interface Migration {
  id: string;
  name: string;
  up: (client: SupabaseClient<Database>) => Promise<void>;
  down: (client: SupabaseClient<Database>) => Promise<void>;
  description?: string;
}

// Migration result
export interface MigrationResult {
  id: string;
  name: string;
  status: 'success' | 'failed' | 'skipped';
  error?: string;
  duration: number;
}

// Migration manager
export class MigrationManager {
  private client: SupabaseClient<Database>;
  private migrations: Migration[] = [];

  constructor(client: SupabaseClient<Database>) {
    this.client = client;
  }

  // Add migration
  public addMigration(migration: Migration): void {
    this.migrations.push(migration);
  }

  // Get all migrations
  public getMigrations(): Migration[] {
    return [...this.migrations];
  }

  // Get applied migrations
  public async getAppliedMigrations(): Promise<string[]> {
    try {
      const { data, error } = await this.client
        .from('migrations')
        .select('id')
        .order('applied_at', { ascending: true });

      if (error) {
        console.error('Error fetching applied migrations:', error);
        return [];
      }

      return data?.map(m => m.id) || [];
    } catch (error) {
      console.error('Error fetching applied migrations:', error);
      return [];
    }
  }

  // Check if migration table exists
  public async checkMigrationTable(): Promise<boolean> {
    try {
      const { error } = await this.client
        .from('migrations')
        .select('count')
        .limit(1);

      return !error;
    } catch {
      return false;
    }
  }

  // Create migration table
  public async createMigrationTable(): Promise<void> {
    try {
      const { error } = await this.client.rpc('create_migration_table');
      if (error) {
        throw new Error(`Failed to create migration table: ${error.message}`);
      }
    } catch (error) {
      console.error('Error creating migration table:', error);
      throw error;
    }
  }

  // Run all pending migrations
  public async runMigrations(): Promise<MigrationResult[]> {
    const results: MigrationResult[] = [];
    
    try {
      // Check if migration table exists
      const tableExists = await this.checkMigrationTable();
      if (!tableExists) {
        await this.createMigrationTable();
      }

      // Get applied migrations
      const appliedMigrations = await this.getAppliedMigrations();
      
      // Run pending migrations
      for (const migration of this.migrations) {
        if (appliedMigrations.includes(migration.id)) {
          results.push({
            id: migration.id,
            name: migration.name,
            status: 'skipped',
            duration: 0,
          });
          continue;
        }

        const startTime = Date.now();
        
        try {
          await migration.up(this.client);
          
          // Record migration as applied
          await this.client
            .from('migrations')
            .insert({
              id: migration.id,
              name: migration.name,
              description: migration.description,
              applied_at: new Date().toISOString(),
            });

          results.push({
            id: migration.id,
            name: migration.name,
            status: 'success',
            duration: Date.now() - startTime,
          });

          console.log(`Migration ${migration.name} applied successfully`);
        } catch (error) {
          results.push({
            id: migration.id,
            name: migration.name,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            duration: Date.now() - startTime,
          });

          console.error(`Migration ${migration.name} failed:`, error);
          break; // Stop on first failure
        }
      }
    } catch (error) {
      console.error('Error running migrations:', error);
    }

    return results;
  }

  // Rollback last migration
  public async rollbackLastMigration(): Promise<MigrationResult | null> {
    try {
      const appliedMigrations = await this.getAppliedMigrations();
      if (appliedMigrations.length === 0) {
        return null;
      }

      const lastMigrationId = appliedMigrations[appliedMigrations.length - 1];
      const migration = this.migrations.find(m => m.id === lastMigrationId);
      
      if (!migration) {
        throw new Error(`Migration ${lastMigrationId} not found`);
      }

      const startTime = Date.now();
      
      try {
        await migration.down(this.client);
        
        // Remove migration record
        await this.client
          .from('migrations')
          .delete()
          .eq('id', lastMigrationId);

        const result: MigrationResult = {
          id: migration.id,
          name: migration.name,
          status: 'success',
          duration: Date.now() - startTime,
        };

        console.log(`Migration ${migration.name} rolled back successfully`);
        return result;
      } catch (error) {
        const result: MigrationResult = {
          id: migration.id,
          name: migration.name,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: Date.now() - startTime,
        };

        console.error(`Migration ${migration.name} rollback failed:`, error);
        return result;
      }
    } catch (error) {
      console.error('Error rolling back migration:', error);
      return null;
    }
  }

  // Get migration status
  public async getMigrationStatus(): Promise<{
    total: number;
    applied: number;
    pending: number;
    appliedMigrations: string[];
  }> {
    const appliedMigrations = await this.getAppliedMigrations();
    
    return {
      total: this.migrations.length,
      applied: appliedMigrations.length,
      pending: this.migrations.length - appliedMigrations.length,
      appliedMigrations,
    };
  }
}

// Create migration manager
export const createMigrationManager = (client: SupabaseClient<Database>): MigrationManager => {
  return new MigrationManager(client);
};

export default MigrationManager;
