// Database service exports
export { DatabaseService, dbService, initializeDatabase, getDbClient, getAdminDbClient, testDbConnection, getDbHealthStatus } from './database';
export { DatabaseConfig } from './database';

// Database configuration exports
export { createDatabaseConfig, getDatabaseConfig, validateDatabaseConfig, getDatabaseConnectionString } from './databaseConfig';

// Health check exports
export { DatabaseHealthChecker, createHealthCheckHandler, performBatchHealthCheck } from './healthCheck';
export { HealthCheckResult } from './healthCheck';

// Migration exports
export { MigrationManager, createMigrationManager } from './migrations';
export { Migration, MigrationResult } from './migrations';

// Database utilities exports
export { DatabaseUtils, createDatabaseUtils } from './databaseUtils';
export { QueryResult, PaginationParams, SortParams, FilterParams } from './databaseUtils';

// Re-export Supabase types
export { Database } from '../types/supabase';
