# Security Documentation

## Overview

This document outlines all security measures, validations, and best practices implemented in the Task Master Backend API.

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Input Validation](#input-validation)
3. [Data Sanitization](#data-sanitization)
4. [Password Security](#password-security)
5. [Token Management](#token-management)
6. [Rate Limiting](#rate-limiting)
7. [HTTP Security Headers](#http-security-headers)
8. [Error Handling](#error-handling)
9. [Security Best Practices](#security-best-practices)
10. [Security Checklist](#security-checklist)

---

## Authentication & Authorization

### JWT-Based Authentication

The API uses JSON Web Tokens (JWT) with a dual-token strategy:

#### Access Tokens
- **Lifetime**: 15 minutes (configurable)
- **Purpose**: Authenticate API requests
- **Storage**: Client-side (memory or secure storage)
- **Claims**: userId, email, role
- **Algorithm**: HS256

#### Refresh Tokens
- **Lifetime**: 7 days (configurable)
- **Purpose**: Obtain new access tokens
- **Storage**: Database whitelist + client-side
- **Rotation**: Tokens are tracked; maximum 5 active per user
- **Revocation**: Logout invalidates tokens

### Authorization Middleware

```javascript
// Route protection
router.get('/protected', authenticate, controller.method);

// Role-based access
router.delete('/admin', authenticate, authorize('admin'), controller.method);

// Optional authentication
router.get('/public', optionalAuth, controller.method);
```

### Security Features

✅ **Token Verification**
- Validates signature with secret key
- Checks expiration time
- Verifies issuer and audience claims
- Validates token type (access vs refresh)

✅ **User Status Checks**
- Verifies user exists in database
- Checks if account is active
- Validates refresh token is in whitelist
- Prevents deactivated users from using tokens

✅ **Session Management**
- Tracks active refresh tokens per user
- Limits concurrent sessions (max 5 devices)
- Supports logout from single device
- Supports logout from all devices

---

## Input Validation

### Validation Layers

The API implements **defense in depth** with multiple validation layers:

1. **Express Validator** - Request validation middleware
2. **Mongoose Schema** - Database-level validation
3. **Controller Logic** - Business logic validation
4. **Security Middleware** - Additional protection

### Registration Validation

```javascript
{
  email: {
    - Required
    - Valid email format
    - Normalized to lowercase
    - Max 255 characters
    - Unique (database constraint)
  },
  password: {
    - Required
    - Min 8 characters, max 128 characters
    - Must contain letters AND numbers
    - Hashed with bcrypt (10 rounds)
  },
  confirmPassword: {
    - Required
    - Must match password
  },
  firstName: {
    - Required
    - Min 2, max 50 characters
    - Only letters, spaces, hyphens, apostrophes
    - Trimmed
  },
  lastName: {
    - Required
    - Min 2, max 50 characters
    - Only letters, spaces, hyphens, apostrophes
    - Trimmed
  }
}
```

### Login Validation

```javascript
{
  email: {
    - Required
    - Valid email format
    - Normalized to lowercase
    - Case-insensitive lookup
  },
  password: {
    - Required
    - Compared with bcrypt
  }
}
```

### Profile Update Validation

```javascript
{
  firstName: {
    - Optional
    - Min 2, max 50 characters (if provided)
    - Only letters, spaces, hyphens, apostrophes
  },
  lastName: {
    - Optional
    - Min 2, max 50 characters (if provided)
    - Only letters, spaces, hyphens, apostrophes
  },
  // BLOCKED FIELDS
  email: ❌ Cannot be updated
  password: ❌ Use /change-password endpoint
  role: ❌ Cannot be self-modified
  refreshTokens: ❌ System managed
  isActive: ❌ Cannot be self-modified
}
```

### Password Change Validation

```javascript
{
  currentPassword: {
    - Required
    - Verified against stored hash
  },
  newPassword: {
    - Required
    - Min 8, max 128 characters
    - Must contain letters AND numbers
    - Must differ from current password
  },
  confirmNewPassword: {
    - Required
    - Must match newPassword
  }
}
```

**Security Actions on Password Change:**
- All refresh tokens are invalidated
- User must login again on all devices

---

## Data Sanitization

### MongoDB Injection Prevention

```javascript
// Middleware: express-mongo-sanitize
// Removes $ and . characters from input
// Prevents NoSQL injection attacks

// Example attack (prevented):
{ "$gt": "" }  // Becomes: { "_gt": "" }
{ "user.role": "admin" }  // Becomes: { "user_role": "admin" }
```

**Implementation:**
- Sanitizes request body
- Sanitizes query parameters
- Sanitizes route parameters
- Logs sanitization events

### XSS Prevention

- Input validation prevents script injection
- Output encoding via JSON responses
- Mongoose escapes data before storage

---

## Password Security

### Hashing Algorithm

- **Algorithm**: bcrypt
- **Salt Rounds**: 10
- **Auto-hashing**: Pre-save middleware
- **Selective Hashing**: Only when password is modified

### Password Requirements

- Minimum 8 characters
- Maximum 128 characters
- Must contain at least one letter
- Must contain at least one number
- No common patterns enforced (add if needed)

### Password Storage

```javascript
// ✅ Stored
$2a$10$hashedPasswordHere...

// ❌ Never stored
"plaintextPassword123"

// Field protection
password: {
  select: false  // Excluded from queries by default
}
```

### Password Comparison

```javascript
// Constant-time comparison via bcrypt
await user.comparePassword(candidatePassword);
// Prevents timing attacks
```

---

## Token Management

### Token Generation

```javascript
// Access Token
{
  userId: "...",
  email: "...",
  role: "user",
  exp: <15 minutes from now>,
  iss: "task-master-api",
  aud: "task-master-app"
}

// Refresh Token
{
  userId: "...",
  type: "refresh",
  exp: <7 days from now>,
  iss: "task-master-api",
  aud: "task-master-app"
}
```

### Token Storage

**Client-Side:**
- Access token: Memory or secure storage
- Refresh token: Secure storage only (HttpOnly cookie recommended)

**Server-Side:**
- Refresh tokens stored in database
- Array limited to 5 tokens per user
- Oldest token removed when limit reached

### Token Revocation

**Single Device Logout:**
```javascript
// Removes specific refresh token
POST /api/v1/auth/logout
{ refreshToken: "..." }
```

**All Devices Logout:**
```javascript
// Clears all refresh tokens
POST /api/v1/auth/logout-all
```

**Automatic Revocation:**
- Password change invalidates all tokens
- Account deactivation prevents token use
- Expired tokens rejected automatically

---

## Rate Limiting

### Global Rate Limit

```javascript
{
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests per window
  message: "Too many requests, please try again later",
  statusCode: 429
}
```

### Recommended Custom Limits

```javascript
// Login endpoint (prevent brute force)
{
  windowMs: 15 * 60 * 1000,
  max: 5  // 5 attempts per 15 minutes
}

// Registration endpoint
{
  windowMs: 60 * 60 * 1000,
  max: 3  // 3 registrations per hour
}
```

**Implementation:**
- Based on IP address
- Applies to all routes by default
- Configurable per endpoint
- Returns standard headers

---

## HTTP Security Headers

### Helmet Configuration

```javascript
// Enabled security headers:
- Content-Security-Policy
- X-DNS-Prefetch-Control
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security (production only)
- Referrer-Policy
```

### CORS Configuration

```javascript
{
  origin: process.env.CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400  // 24 hours
}
```

---

## Error Handling

### Secure Error Messages

**Production:**
```json
{
  "success": false,
  "message": "Invalid login credentials"
}
```

**Development:**
```json
{
  "success": false,
  "message": "Invalid login credentials",
  "stack": "Error: ... (full stack trace)"
}
```

### Information Disclosure Prevention

❌ **Bad:**
```json
{ "message": "User not found" }  // Reveals if email exists
```

✅ **Good:**
```json
{ "message": "Invalid login credentials" }  // Generic message
```

### Error Types Handled

- Validation errors (400)
- Authentication errors (401)
- Authorization errors (403)
- Not found errors (404)
- Duplicate key errors (409)
- Rate limit errors (429)
- Internal server errors (500)

---

## Security Best Practices

### Implemented ✅

1. **Password Hashing**
   - bcrypt with 10 salt rounds
   - Auto-hashing via middleware
   - Selective hashing (only when modified)

2. **JWT Security**
   - Separate secrets for access and refresh tokens
   - Short access token lifetime (15min)
   - Longer refresh token lifetime (7d)
   - Token whitelist in database
   - Issuer and audience verification

3. **Input Validation**
   - Multiple validation layers
   - Field-level validation
   - Type validation
   - Length constraints
   - Pattern matching

4. **Data Sanitization**
   - MongoDB injection prevention
   - Parameter pollution prevention
   - Trimming and normalization

5. **Authorization**
   - Role-based access control
   - Route-level protection
   - User status verification

6. **Rate Limiting**
   - Global rate limits
   - Configurable per endpoint
   - IP-based tracking

7. **Security Headers**
   - Helmet middleware
   - CORS configuration
   - Content-Type enforcement

8. **Error Handling**
   - Centralized error handler
   - Safe error messages
   - No information leakage

9. **Database Security**
   - Mongoose validation
   - Unique constraints
   - Index optimization
   - Connection pooling

10. **Session Management**
    - Token rotation support
    - Multi-device logout
    - Session limits per user

### Recommended Additions 🔄

1. **Account Lockout**
   - Lock account after N failed login attempts
   - Implement temporary lockout duration
   - Notify user of lockout

2. **Email Verification**
   - Verify email on registration
   - Send verification token
   - Mark account as verified

3. **Password Reset**
   - Secure password reset flow
   - Time-limited reset tokens
   - Email notification

4. **Two-Factor Authentication (2FA)**
   - TOTP support
   - Backup codes
   - Device management

5. **Audit Logging**
   - Log authentication events
   - Log authorization failures
   - Log sensitive operations

6. **Security Monitoring**
   - Track failed login attempts
   - Monitor suspicious patterns
   - Alert on anomalies

7. **Password Strength Meter**
   - Client-side validation
   - Entropy calculation
   - Common password blocklist

8. **Session Timeout**
   - Automatic logout after inactivity
   - Configurable timeout period

9. **IP Whitelisting**
   - Optional IP-based restrictions
   - Admin-only access from specific IPs

10. **API Key Management**
    - Support for API keys
    - Key rotation
    - Key-based rate limiting

---

## Security Checklist

### Pre-Production ✅

- [ ] Change all default secrets in `.env`
- [ ] Generate strong random JWT secrets (32+ characters)
- [ ] Set `NODE_ENV=production`
- [ ] Configure production CORS origins
- [ ] Enable HTTPS/TLS
- [ ] Review and adjust rate limits
- [ ] Set up monitoring and alerting
- [ ] Configure database backup
- [ ] Review all environment variables
- [ ] Remove development dependencies

### Post-Deployment 📊

- [ ] Monitor authentication failures
- [ ] Track rate limit violations
- [ ] Review error logs regularly
- [ ] Update dependencies monthly
- [ ] Conduct security audits quarterly
- [ ] Test backup restoration process
- [ ] Review access logs
- [ ] Monitor database performance
- [ ] Check for security advisories
- [ ] Update documentation

### Regular Maintenance 🔄

- [ ] Rotate JWT secrets (quarterly)
- [ ] Update dependencies
- [ ] Review security patches
- [ ] Audit user permissions
- [ ] Clean up inactive accounts
- [ ] Review API logs
- [ ] Test disaster recovery
- [ ] Update security documentation

---

## Vulnerability Reporting

If you discover a security vulnerability, please email: security@taskmaster.com

**Please DO NOT:**
- Open a public GitHub issue
- Disclose the vulnerability publicly
- Attempt to exploit the vulnerability

**Please DO:**
- Provide detailed steps to reproduce
- Include proof of concept if possible
- Allow reasonable time for fixing
- Responsibly disclose after fix is deployed

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

**Last Updated:** 2024
**Version:** 1.0.0
**Status:** Production Ready ✅
