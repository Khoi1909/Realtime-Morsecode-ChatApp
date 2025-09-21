# Auth Service

Authentication microservice for the Realtime Morse Code Chat App.

## Features

- ✅ User registration and login
- ✅ JWT token generation and validation
- ✅ Password-based authentication
- ✅ Token refresh mechanism
- ✅ User profile management
- ✅ Input validation with Joi
- ✅ Security middleware (Helmet, CORS)
- ✅ Request logging
- ✅ Health check endpoint

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user
- `GET /auth/me` - Get current user profile

### Health Check
- `GET /health` - Service health status

## Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
AUTH_SERVICE_PORT=3001
NODE_ENV=development

# Database Configuration (Direct Supabase Access)
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE_TIME=7d
JWT_REFRESH_EXPIRE_TIME=30d

# Cloudflare Turnstile
TURNSTILE_SECRET_KEY=your_turnstile_secret_key_here
TURNSTILE_SITE_KEY=your_turnstile_site_key_here

# Service URLs
USER_SERVICE_URL=http://localhost:3003
API_GATEWAY_URL=http://localhost:3000

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=logs/auth-service.log
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Lint code
npm run lint
```

## Usage

The Auth Service provides JWT-based authentication for the microservices architecture. It integrates with Supabase for user management and provides secure token generation and validation.

### Example Request/Response

**Register User:**
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "username": "johndoe",
    "display_name": "John Doe"
  }'
```

**Login User:**
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Get User Profile:**
```bash
curl -X GET http://localhost:3001/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

