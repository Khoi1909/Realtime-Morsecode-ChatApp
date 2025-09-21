import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Query result interface
export interface QueryResult<T> {
  data: T | null;
  error: any;
  count?: number;
}

// Pagination parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

// Sort parameters
export interface SortParams {
  column: string;
  ascending?: boolean;
}

// Filter parameters
export interface FilterParams {
  column: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'is';
  value: any;
}

// Database utilities
export class DatabaseUtils {
  private client: SupabaseClient<Database>;

  constructor(client: SupabaseClient<Database>) {
    this.client = client;
  }

  // Generic query builder
  public async query<T>(
    table: keyof Database['public']['Tables'],
    options: {
      select?: string;
      filters?: FilterParams[];
      sort?: SortParams;
      pagination?: PaginationParams;
    } = {}
  ): Promise<QueryResult<T[]>> {
    try {
      let query = this.client.from(table as string);

      // Apply select
      if (options.select) {
        query = query.select(options.select);
      }

      // Apply filters
      if (options.filters) {
        for (const filter of options.filters) {
          query = query.filter(filter.column, filter.operator, filter.value);
        }
      }

      // Apply sorting
      if (options.sort) {
        query = query.order(filter.column, { ascending: options.sort.ascending ?? true });
      }

      // Apply pagination
      if (options.pagination) {
        const { page = 1, limit = 10, offset } = options.pagination;
        
        if (offset !== undefined) {
          query = query.range(offset, offset + limit - 1);
        } else {
          const start = (page - 1) * limit;
          query = query.range(start, start + limit - 1);
        }
      }

      const { data, error, count } = await query;
      
      return {
        data: data as T[] | null,
        error,
        count: count || undefined,
      };
    } catch (error) {
      return {
        data: null,
        error,
      };
    }
  }

  // Get single record by ID
  public async getById<T>(
    table: keyof Database['public']['Tables'],
    id: string,
    select?: string
  ): Promise<QueryResult<T>> {
    try {
      let query = this.client.from(table as string).select(select || '*').eq('id', id);
      
      const { data, error } = await query.single();
      
      return {
        data: data as T | null,
        error,
      };
    } catch (error) {
      return {
        data: null,
        error,
      };
    }
  }

  // Insert record
  public async insert<T>(
    table: keyof Database['public']['Tables'],
    data: any,
    select?: string
  ): Promise<QueryResult<T>> {
    try {
      let query = this.client.from(table as string).insert(data);
      
      if (select) {
        query = query.select(select);
      }

      const { data: result, error } = await query.single();
      
      return {
        data: result as T | null,
        error,
      };
    } catch (error) {
      return {
        data: null,
        error,
      };
    }
  }

  // Update record
  public async update<T>(
    table: keyof Database['public']['Tables'],
    id: string,
    data: any,
    select?: string
  ): Promise<QueryResult<T>> {
    try {
      let query = this.client.from(table as string).update(data).eq('id', id);
      
      if (select) {
        query = query.select(select);
      }

      const { data: result, error } = await query.single();
      
      return {
        data: result as T | null,
        error,
      };
    } catch (error) {
      return {
        data: null,
        error,
      };
    }
  }

  // Delete record
  public async delete(
    table: keyof Database['public']['Tables'],
    id: string
  ): Promise<QueryResult<boolean>> {
    try {
      const { error } = await this.client
        .from(table as string)
        .delete()
        .eq('id', id);

      return {
        data: !error,
        error,
      };
    } catch (error) {
      return {
        data: false,
        error,
      };
    }
  }

  // Count records
  public async count(
    table: keyof Database['public']['Tables'],
    filters?: FilterParams[]
  ): Promise<QueryResult<number>> {
    try {
      let query = this.client.from(table as string).select('*', { count: 'exact', head: true });

      // Apply filters
      if (filters) {
        for (const filter of filters) {
          query = query.filter(filter.column, filter.operator, filter.value);
        }
      }

      const { count, error } = await query;
      
      return {
        data: count || 0,
        error,
      };
    } catch (error) {
      return {
        data: 0,
        error,
      };
    }
  }

  // Execute raw SQL (if RPC is available)
  public async executeRPC<T>(
    functionName: string,
    params?: Record<string, any>
  ): Promise<QueryResult<T>> {
    try {
      const { data, error } = await this.client.rpc(functionName, params);
      
      return {
        data: data as T | null,
        error,
      };
    } catch (error) {
      return {
        data: null,
        error,
      };
    }
  }

  // Batch operations
  public async batchInsert<T>(
    table: keyof Database['public']['Tables'],
    records: any[],
    select?: string
  ): Promise<QueryResult<T[]>> {
    try {
      let query = this.client.from(table as string).insert(records);
      
      if (select) {
        query = query.select(select);
      }

      const { data, error } = await query;
      
      return {
        data: data as T[] | null,
        error,
      };
    } catch (error) {
      return {
        data: null,
        error,
      };
    }
  }

  // Transaction-like operations (using RPC)
  public async transaction<T>(
    operations: Array<{
      type: 'insert' | 'update' | 'delete';
      table: keyof Database['public']['Tables'];
      data?: any;
      id?: string;
    }>
  ): Promise<QueryResult<T[]>> {
    try {
      // This would require a custom RPC function in Supabase
      // For now, we'll execute operations sequentially
      const results: T[] = [];
      
      for (const operation of operations) {
        let result: QueryResult<T>;
        
        switch (operation.type) {
          case 'insert':
            result = await this.insert(operation.table, operation.data);
            break;
          case 'update':
            result = await this.update(operation.table, operation.id!, operation.data);
            break;
          case 'delete':
            result = await this.delete(operation.table, operation.id!);
            break;
        }
        
        if (result.error) {
          throw new Error(`Transaction failed at ${operation.type}: ${result.error}`);
        }
        
        if (result.data) {
          results.push(result.data as T);
        }
      }
      
      return {
        data: results,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error,
      };
    }
  }
}

// Create database utils
export const createDatabaseUtils = (client: SupabaseClient<Database>): DatabaseUtils => {
  return new DatabaseUtils(client);
};

export default DatabaseUtils;
