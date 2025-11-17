# Task Master Backend API

A robust Node.js Express.js backend with modular architecture, JWT authentication, and comprehensive inline documentation.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Swagger API Documentation](#swagger-api-documentation-)
- [API Documentation](#api-documentation)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Security](#security)
- [Security Documentation](#security-documentation-)

## ✨ Features

- **JWT Authentication** - Secure token-based authentication with access and refresh tokens
- **Swagger/OpenAPI** - Interactive API documentation with built-in testing interface
- **Modular Architecture** - Well-organized code structure following best practices
- **Input Validation** - Comprehensive validation using express-validator
- **Error Handling** - Centralized error handling with custom error classes
- **Security** - Helmet, CORS, rate limiting, MongoDB injection prevention, and password hashing
- **Data Sanitization** - Express-mongo-sanitize for NoSQL injection prevention
- **Database** - MongoDB with Mongoose ODM
- **Logging** - Request logging with Morgan
- **Documentation** - Extensive inline documentation + Swagger UI
- **Production Ready** - All standard security checks and validations implemented

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **ODM**: Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **Security**: Helmet, CORS
- **Logging**: Morgan
- **Environment Variables**: dotenv

## 📁 Project Structure

```
task-master-backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── app.js        # App configuration (CORS, rate limiting, etc.)
│   │   ├── database.js   # Database connection
│   │   └── jwt.js        # JWT configuration
│   ├── controllers/      # Route controllers
│   │   └── authController.js
│   ├── middleware/       # Custom middleware
│   │   ├── auth.js       # Authentication & authorization
│   │   └── errorHandler.js
│   ├── models/          # Database models
│   │   └── User.js
│   ├── routes/          # API routes
│   │   ├── authRoutes.js
│   │   └── index.js
│   ├── validators/      # Input validation
│   │   └── authValidator.js
│   ├── utils/           # Utility functions
│   ├── app.js           # Express app configuration
│   └── server.js        # Server entry point
├── .env                 # Environment variables
├── .env.example         # Environment variables example
├── .gitignore
├── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   cd task-master-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

   Update `.env` with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/task-master
   JWT_SECRET=your-super-secret-jwt-key
   JWT_REFRESH_SECRET=your-super-secret-refresh-token-key
   JWT_ACCESS_TOKEN_EXPIRE=15m
   JWT_REFRESH_TOKEN_EXPIRE=7d
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod

   # Or use MongoDB Atlas cloud database
   # Update MONGODB_URI in .env with your Atlas connection string
   ```

5. **Run the server**
   ```bash
   # Development mode with auto-reload
   npm run dev

   # Production mode
   npm start
   ```

6. **Verify server is running**
   ```
   Server should be running at: http://localhost:5000
   API endpoint: http://localhost:5000/api/v1
   Swagger docs: http://localhost:5000/api-docs
   ```

## 📖 Swagger API Documentation

### Interactive API Documentation

We provide a comprehensive **Swagger/OpenAPI** documentation interface for easy testing and exploration of all API endpoints.

**Access Swagger UI:**
```
http://localhost:5000/api-docs
```

**Swagger JSON:**
```
http://localhost:5000/api-docs.json
```

### Features

✅ **Interactive Testing** - Test all endpoints directly from the browser
✅ **Complete API Reference** - All endpoints, parameters, and responses documented
✅ **Authentication Support** - Built-in JWT token authentication
✅ **Request/Response Examples** - Sample payloads for all endpoints
✅ **Schema Definitions** - Detailed data models and validation rules

## 🕒 Timezone Integration Checklist

- [x] **Global resolution middleware** – `src/middleware/timezone.js` normalizes the requester timezone once so every downstream handler can read `req.requestedTimezone`.
- [x] **Controllers** – Task, reminder, and dashboard controllers now consume `req.requestedTimezone || 'UTC'` instead of recalculating per handler to avoid inconsistencies.
- [x] **Localized reminder responses** – `src/controllers/reminderController.js` formats every reminder via `formatReminderResponse`, guaranteeing `localScheduled*` fields in responses.
- [x] **Documentation** – Swagger definitions (`src/routes/swaggerDocs.js`, `src/config/swagger.js`) describe the `timezone` query/body parameters and dedicated request schemas for create/update flows.
- [x] **Verification** – Run `node tests/timezone.test.js` and follow `tests/README.md` for manual reminder/task/dashboard timezone QA scenarios.
✅ **Try It Out** - Execute real API calls with custom parameters

### How to Use Swagger

1. **Start the server**:
   ```bash
   npm run dev
   ```

2. **Open Swagger UI** in your browser:
   ```
   http://localhost:5000/api-docs
   ```

3. **Authenticate** (for protected endpoints):
   - Click the "Authorize" button (top right)
   - Enter your JWT access token in the format: `Bearer <your_token>`
   - Click "Authorize" to apply
   - Now you can test protected endpoints

4. **Test endpoints**:
   - Expand any endpoint
   - Click "Try it out"
   - Fill in parameters/request body
   - Click "Execute"
   - View the response

### Available Endpoints in Swagger

#### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout from current device (requires auth)
- `POST /auth/logout-all` - Logout from all devices (requires auth)

#### Profile
- `GET /auth/profile` - Get user profile (requires auth)
- `PUT /auth/profile` - Update user profile (requires auth)
- `POST /auth/change-password` - Change password (requires auth)

#### Health
- `GET /health` - API health check

## 📚 API Documentation

### Base URL

```
http://localhost:5000/api/v1
```

### Response Format

All API responses follow this format:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message",
  "errors": [ ... ]
}
```

### Authentication Endpoints

#### 1. Register User

Create a new user account.

**Endpoint:** `POST /api/v1/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123",
  "confirmPassword": "Password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "...",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

#### 2. Login

Authenticate user and receive tokens.

**Endpoint:** `POST /api/v1/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "tokens": {
      "accessToken": "...",
      "refreshToken": "..."
    }
  }
}
```

#### 3. Refresh Token

Get a new access token using refresh token.

**Endpoint:** `POST /api/v1/auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 4. Logout

Invalidate refresh token (logout from current device).

**Endpoint:** `POST /api/v1/auth/logout`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### 5. Logout All

Invalidate all refresh tokens (logout from all devices).

**Endpoint:** `POST /api/v1/auth/logout-all`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out from all devices"
}
```

#### 6. Get Profile

Get current user's profile.

**Endpoint:** `GET /api/v1/auth/profile`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "fullName": "John Doe",
      "role": "user",
      "isActive": true,
      "lastLogin": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### 7. Update Profile

Update current user's profile.

**Endpoint:** `PUT /api/v1/auth/profile`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": { ... }
  }
}
```

#### 8. Change Password

Change user's password.

**Endpoint:** `POST /api/v1/auth/change-password`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword123",
  "confirmNewPassword": "NewPassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully. Please login again."
}
```

### Health Check

**Endpoint:** `GET /api/v1/health`

**Success Response (200):**
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456
}
```

## 🔐 Authentication

This API uses JWT (JSON Web Tokens) for authentication with a dual-token strategy:

### Access Token
- **Purpose**: Used for authenticating API requests
- **Lifetime**: Short (default: 15 minutes)
- **Usage**: Sent in Authorization header as `Bearer <token>`

### Refresh Token
- **Purpose**: Used to obtain new access tokens
- **Lifetime**: Long (default: 7 days)
- **Usage**: Sent in request body to refresh endpoint
- **Storage**: Tracked in database for security

### Token Flow

1. **Login/Register**: Receive both access and refresh tokens
2. **API Requests**: Include access token in Authorization header
3. **Token Expiry**: When access token expires, use refresh token to get new one
4. **Logout**: Invalidate refresh token(s)

### Using Tokens

Include the access token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## ⚠️ Error Handling

The API uses standardized error responses:

### Common Error Codes

- **400 Bad Request** - Invalid input or validation error
- **401 Unauthorized** - Missing or invalid authentication
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource not found
- **409 Conflict** - Duplicate resource (e.g., email already exists)
- **429 Too Many Requests** - Rate limit exceeded
- **500 Internal Server Error** - Server error

### Error Response Example

```json
{
  "success": false,
  "message": "Validation Error",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address",
      "value": "invalid-email"
    }
  ]
}
```

## 🔒 Security

This API implements multiple security measures:

- **Password Hashing**: bcryptjs with 10 salt rounds
- **JWT Tokens**: Signed tokens with separate secrets
- **Helmet**: Security headers protection
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: Prevent brute force attacks
- **Input Validation**: Comprehensive request validation
- **Token Tracking**: Refresh token whitelist in database
- **Graceful Shutdown**: Proper cleanup on termination

### Security Best Practices

1. **Never commit `.env` file** - Contains sensitive secrets
2. **Use strong JWT secrets** - Generate random, long strings
3. **Enable HTTPS in production** - Encrypt data in transit
4. **Rotate JWT secrets regularly** - Enhance security
5. **Monitor failed login attempts** - Detect potential attacks
6. **Keep dependencies updated** - Patch security vulnerabilities

## 🧪 Testing the API

### Using cURL

```bash
# Register
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123",
    "confirmPassword": "Password123",
    "firstName": "Test",
    "lastName": "User"
  }'

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123"
  }'

# Get Profile (replace <token> with actual access token)
curl -X GET http://localhost:5000/api/v1/auth/profile \
  -H "Authorization: Bearer <token>"
```

### Using Postman

1. Import the API endpoints
2. Set base URL: `http://localhost:5000/api/v1`
3. For authenticated requests, add Authorization header: `Bearer <token>`

## 📝 Development

### Code Style

- Use meaningful variable and function names
- Add JSDoc comments for all functions
- Follow modular architecture principles
- Keep controllers thin, move business logic to models/services

### Adding New Features

1. **Model**: Create schema in `src/models/`
2. **Validation**: Add validators in `src/validators/`
3. **Controller**: Implement logic in `src/controllers/`
4. **Routes**: Define endpoints in `src/routes/`
5. **Middleware**: Add custom middleware if needed in `src/middleware/`

### Environment Variables

All configurable values are in `.env`:
- Server settings (PORT, NODE_ENV)
- Database connection (MONGODB_URI)
- JWT secrets and expiration
- CORS settings
- Rate limiting

## 🐛 Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Ensure MongoDB is running (`mongod` or use MongoDB Atlas)

### JWT Secret Warning
```
WARNING: Using default JWT_SECRET in production!
```
**Solution**: Generate strong random secrets in `.env`

### CORS Error
```
Access to XMLHttpRequest has been blocked by CORS policy
```
**Solution**: Update `CORS_ORIGIN` in `.env` with your frontend URL

## 🔒 Security Documentation

For comprehensive security information, please refer to:

- **[SECURITY.md](./SECURITY.md)** - Complete security documentation including:
  - Authentication & Authorization details
  - Input validation rules
  - Data sanitization methods
  - Password security measures
  - Token management
  - Rate limiting configuration
  - Security best practices
  - Vulnerability reporting

- **[VALIDATION_CHECKLIST.md](./VALIDATION_CHECKLIST.md)** - Detailed checklist of all implemented validations and security checks

### Security Highlights

✅ **Defense in Depth** - Multiple layers of security validation
✅ **JWT Tokens** - Secure access and refresh token implementation
✅ **Password Security** - bcrypt hashing with 10 salt rounds
✅ **Input Validation** - Comprehensive validation on all endpoints
✅ **Data Sanitization** - MongoDB injection prevention
✅ **Rate Limiting** - Prevents brute force attacks
✅ **Security Headers** - Helmet.js for HTTP header protection
✅ **Error Handling** - No sensitive information leakage
✅ **Token Management** - Whitelist with automatic rotation support
✅ **CORS Protection** - Configurable origin restrictions

### Recent Security Enhancements

- ✅ Added MongoDB injection prevention (express-mongo-sanitize)
- ✅ Enhanced profile update validation to block restricted fields
- ✅ Fixed email case-insensitive lookup in authentication
- ✅ Added isActive check in refresh token verification
- ✅ Added password max length validation
- ✅ Implemented defense in depth for protected routes
- ✅ Added comprehensive security middleware

## 📄 License

This project is licensed under the ISC License.

## 👥 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For issues and questions, please open an issue on the repository.

---

**Built with ❤️ using Node.js and Express.js**
