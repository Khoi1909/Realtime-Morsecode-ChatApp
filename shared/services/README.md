# Database Service

A centralized database service for managing Supabase connections across all microservices in the Morse Chat App.

## 📁 Structure

```
shared/services/
├── database.ts           # Main database service
├── databaseConfig.ts     # Configuration utilities
├── healthCheck.ts       # Health monitoring
├── migrations.ts        # Database migrations
├── databaseUtils.ts     # Query utilities
└── index.ts            # Exports
```

## 🚀 Features

### ✅ **Centralized Connection Management**
- Singleton pattern for consistent connections
- Automatic client initialization
- Connection pooling and reuse

### ✅ **Multiple Client Types**
- **Anonymous Client**: For public operations
- **Admin Client**: For privileged operations
- **Service Role Client**: For admin tasks

### ✅ **Health Monitoring**
- Connection testing
- Query execution validation
- RLS policy verification
- Batch health checks

### ✅ **Migration Management**
- Version-controlled migrations
- Rollback capabilities
- Migration status tracking
- Automatic table creation

### ✅ **Query Utilities**
- Generic query builder
- Pagination support
- Filtering and sorting
- Batch operations
- Transaction support

## 🔧 Usage

### Basic Setup

```typescript
import { initializeDatabase, getDbClient, getAdminDbClient } from '@shared/services';

// Initialize database service
initializeDatabase({
  url: process.env.SUPABASE_URL!,
  anonKey: process.env.SUPABASE_ANON_KEY!,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
});

// Get clients
const supabase = getDbClient();
const adminSupabase = getAdminDbClient();
```

### Health Monitoring

```typescript
import { getDbHealthStatus, DatabaseHealthChecker } from '@shared/services';

// Get health status
const health = await getDbHealthStatus();
console.log(health);

// Create health checker
const healthChecker = new DatabaseHealthChecker(supabase, 'auth-service');
const result = await healthChecker.performHealthCheck();
```

### Database Utilities

```typescript
import { DatabaseUtils } from '@shared/services';

const dbUtils = new DatabaseUtils(supabase);

// Query with filters and pagination
const result = await dbUtils.query('user_profiles', {
  select: 'id, email, username',
  filters: [
    { column: 'email', operator: 'eq', value: 'user@example.com' }
  ],
  pagination: { page: 1, limit: 10 }
});

// Get by ID
const user = await dbUtils.getById('user_profiles', userId);

// Insert record
const newUser = await dbUtils.insert('user_profiles', userData);

// Update record
const updatedUser = await dbUtils.update('user_profiles', userId, updates);

// Delete record
const deleted = await dbUtils.delete('user_profiles', userId);
```

### Migrations

```typescript
import { MigrationManager, Migration } from '@shared/services';

const migrationManager = new MigrationManager(supabase);

// Add migration
migrationManager.addMigration({
  id: '001_create_users_table',
  name: 'Create Users Table',
  description: 'Initial users table creation',
  up: async (client) => {
    // Migration logic
  },
  down: async (client) => {
    // Rollback logic
  }
});

// Run migrations
const results = await migrationManager.runMigrations();

// Rollback last migration
const rollbackResult = await migrationManager.rollbackLastMigration();
```

## 🔧 Configuration

### Environment Variables

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Database Config

```typescript
import { createDatabaseConfig, getDatabaseConfig } from '@shared/services';

// Development config
const devConfig = createDatabaseConfig();

// Environment-specific config
const prodConfig = getDatabaseConfig('production');
```

## 🏗️ Architecture

### Service Pattern
- **Singleton**: Single instance per application
- **Lazy Loading**: Clients created on demand
- **Error Handling**: Comprehensive error management
- **Logging**: Built-in logging and monitoring

### Client Types
- **Anonymous**: Public operations, RLS enforced
- **Admin**: Privileged operations, bypass RLS
- **Service Role**: Full access, admin operations

### Health Monitoring
- **Connection Tests**: Basic connectivity
- **Query Tests**: Execution validation
- **RLS Tests**: Policy verification
- **Batch Tests**: Multiple service monitoring

## 📊 Monitoring

### Health Check Endpoints

```typescript
// Basic health check
GET /health/database

// Detailed health check
GET /health/database/detailed

// Batch health check
GET /health/database/batch
```

### Health Response Format

```json
{
  "service": "database",
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "responseTime": 150,
  "details": {
    "connection": true,
    "query": true,
    "rls": {
      "userProfiles": true,
      "rooms": true,
      "messages": true,
      "friends": true
    }
  }
}
```

## 🔒 Security

### Row Level Security (RLS)
- All tables have RLS enabled
- Policies enforced on anonymous client
- Admin client bypasses RLS for maintenance

### Connection Security
- Encrypted connections (HTTPS)
- API key authentication
- Service role key protection

### Access Control
- **Anonymous**: Limited to public data
- **Admin**: Full table access
- **Service Role**: Complete system access

## 🚀 Performance

### Connection Pooling
- Reused connections
- Automatic reconnection
- Connection health monitoring

### Query Optimization
- Efficient query building
- Pagination support
- Index utilization

### Caching
- Connection caching
- Query result caching
- Health status caching

## 🐛 Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check environment variables
   - Verify Supabase URL
   - Test network connectivity

2. **RLS Policy Errors**
   - Verify user authentication
   - Check policy definitions
   - Test with admin client

3. **Migration Failures**
   - Check migration table
   - Verify permissions
   - Review migration logic

### Debug Steps

1. **Check Health Status**
   ```typescript
   const health = await getDbHealthStatus();
   console.log(health);
   ```

2. **Test Connection**
   ```typescript
   const connected = await testDbConnection();
   console.log('Connected:', connected);
   ```

3. **Verify Configuration**
   ```typescript
   const config = createDatabaseConfig();
   console.log('Config valid:', validateDatabaseConfig(config));
   ```

## 📚 Related Services

- [Auth Service](../services/auth-service/README.md)
- [User Service](../services/user-service/README.md)
- [Chat Service](../services/chat-service/README.md)
- [Room Service](../services/room-service/README.md)

## 🔄 Migration from Direct Supabase

### Before (Direct Supabase)
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);
```

### After (Database Service)
```typescript
import { initializeDatabase, getDbClient } from '@shared/services';

initializeDatabase({ url, anonKey, serviceRoleKey });
const supabase = getDbClient();
```

## 🎯 Benefits

- ✅ **Centralized Management**: Single point of database configuration
- ✅ **Consistent Connections**: Same client across all services
- ✅ **Health Monitoring**: Built-in connection and query testing
- ✅ **Migration Support**: Version-controlled database changes
- ✅ **Query Utilities**: Simplified database operations
- ✅ **Error Handling**: Comprehensive error management
- ✅ **Performance**: Connection pooling and optimization
- ✅ **Security**: RLS enforcement and access control

---

**The Database Service provides a robust foundation for all microservices!** 🚀
