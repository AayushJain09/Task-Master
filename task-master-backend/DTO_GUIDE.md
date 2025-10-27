# Data Transfer Objects (DTOs) Guide

## Overview

This guide explains the Data Transfer Objects (DTOs) implementation in the Task Master backend. DTOs provide a standardized, consistent way to structure API responses across the entire application.

## Table of Contents

- [What are DTOs?](#what-are-dtos)
- [Why Use DTOs?](#why-use-dtos)
- [DTO Structure](#dto-structure)
- [Available DTOs](#available-dtos)
- [Mapper Functions](#mapper-functions)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)

## What are DTOs?

Data Transfer Objects (DTOs) are simple objects designed to carry data between processes. In our backend:

- **DTOs** are classes that define the structure of API responses
- **Mappers** are utility functions that transform raw data into DTOs
- **Controllers** use mappers to ensure consistent response formats

## Why Use DTOs?

### Benefits

1. **Consistency**: All API responses follow the same structure
2. **Type Safety**: Clear contracts for what data is returned
3. **Maintainability**: Changes to response format are made in one place
4. **Documentation**: DTOs serve as living documentation
5. **Security**: Explicit control over what data is exposed
6. **Transformation**: Easy data manipulation before sending responses

### Before DTOs

```javascript
// Different response formats across controllers
res.json({ user: user.toJSON() });
res.json({ success: true, data: { user } });
res.json({ success: true, message: 'Success', user });
```

### After DTOs

```javascript
// Consistent format everywhere
res.json(mapUserDetailsToResponse(user));
res.json(mapLoginToResponse(user, accessToken, refreshToken));
res.json(mapUsersListToResponse(users, page, limit, totalItems));
```

## DTO Structure

### Location

```
src/dtos/
├── common.dto.js      # Common response structures
├── user.dto.js        # User-related DTOs
├── auth.dto.js        # Authentication DTOs
├── mappers.js         # Mapper utility functions
└── index.js           # Central export point
```

### Import Pattern

```javascript
// Import specific mappers
const { mapLoginToResponse, mapUsersListToResponse } = require('../dtos');

// Or import DTO classes directly
const { UserResponseDTO, LoginResponseDTO } = require('../dtos');
```

## Available DTOs

### Common DTOs

#### `SuccessResponseDTO`

Standardized success response wrapper.

```javascript
{
  success: true,
  message: "Operation successful",    // Optional
  data: { ... },                      // Optional
  meta: { ... }                       // Optional
}
```

#### `ErrorResponseDTO`

Standardized error response wrapper.

```javascript
{
  success: false,
  message: "Error message",
  errors: [                           // Optional
    { field: "email", message: "..." }
  ],
  stack: "..."                        // Only in development
}
```

#### `PaginationDTO`

Comprehensive pagination metadata.

```javascript
{
  currentPage: 1,
  totalPages: 10,
  totalItems: 95,
  itemsPerPage: 10,
  itemsOnCurrentPage: 10,
  hasNextPage: true,
  hasPrevPage: false,
  nextPage: 2,
  prevPage: null
}
```

#### `PaginatedListDTO`

Combines list data with pagination.

```javascript
{
  items: [...],
  pagination: { ... }
}
```

### User DTOs

#### `UserResponseDTO`

Complete user information for API responses.

```javascript
{
  id: "507f1f77bcf86cd799439011",   // Mapped from _id
  email: "user@example.com",
  firstName: "John",
  lastName: "Doe",
  fullName: "John Doe",
  role: "user",
  isActive: true,
  isEmailVerified: false,
  lastLogin: "2024-01-01T00:00:00.000Z",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z"
}
```

**Note**: `_id` is automatically converted to `id` for cleaner API responses.

#### `UserSummaryDTO`

Lightweight user information for lists and references.

```javascript
{
  id: "507f1f77bcf86cd799439011",
  email: "user@example.com",
  fullName: "John Doe",
  role: "user",
  isActive: true
}
```

#### `UserListItemDTO`

Optimized for user list views (between summary and full details).

```javascript
{
  id: "507f1f77bcf86cd799439011",
  email: "user@example.com",
  firstName: "John",
  lastName: "Doe",
  fullName: "John Doe",
  role: "user",
  isActive: true,
  isEmailVerified: false,
  lastLogin: "2024-01-01T00:00:00.000Z",
  createdAt: "2024-01-01T00:00:00.000Z"
}
```

#### `UserStatsDTO`

Aggregated user statistics.

```javascript
{
  totalUsers: 100,
  activeUsers: 85,
  inactiveUsers: 15,
  verifiedUsers: 60,
  unverifiedUsers: 40,
  usersByRole: {
    user: 90,
    admin: 5,
    moderator: 5
  },
  recentUsers: [...]  // Array of UserSummaryDTO
}
```

### Authentication DTOs

#### `TokensDTO`

JWT token pair with metadata.

```javascript
{
  accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  tokenType: "Bearer",
  expiresIn: 900  // Access token expiry in seconds
}
```

#### `RegisterResponseDTO`

Complete registration response.

```javascript
{
  success: true,
  message: "Registration successful",
  data: {
    user: { ... },      // UserResponseDTO
    tokens: { ... }     // TokensDTO
  }
}
```

#### `LoginResponseDTO`

Complete login response.

```javascript
{
  success: true,
  message: "Login successful",
  data: {
    user: { ... },              // UserResponseDTO
    tokens: { ... },            // TokensDTO
    loginTimestamp: "2024-01-01T00:00:00.000Z"
  }
}
```

#### `RefreshTokenResponseDTO`

Token refresh response.

```javascript
{
  success: true,
  message: "Token refreshed successfully",
  data: {
    tokens: { ... }     // TokensDTO with new tokens
  }
}
```

#### `LogoutResponseDTO`

Logout confirmation.

```javascript
{
  success: true,
  message: "Logged out successfully",
  data: {
    logoutTimestamp: "2024-01-01T00:00:00.000Z"
  }
}
```

#### `PasswordChangeResponseDTO`

Password change confirmation.

```javascript
{
  success: true,
  message: "Password changed successfully",
  data: {
    changedAt: "2024-01-01T00:00:00.000Z",
    sessionsInvalidated: true,
    additionalInfo: "All other sessions have been logged out for security."
  }
}
```

#### `ProfileUpdateResponseDTO`

Profile update response with change tracking.

```javascript
{
  success: true,
  message: "Profile updated successfully",
  data: {
    user: { ... },              // UserResponseDTO
    updatedFields: ["firstName", "lastName"]
  }
}
```

## Mapper Functions

Mappers are utility functions that simplify DTO creation in controllers.

### Common Mappers

#### `createSuccessResponse(message, data, meta)`

Creates a standardized success response.

```javascript
return createSuccessResponse('Operation successful', { user });
```

#### `createErrorResponse(message, errors, stack)`

Creates a standardized error response.

```javascript
return createErrorResponse('Validation failed', [
  { field: 'email', message: 'Email is required' }
]);
```

#### `createPaginatedResponse(items, page, limit, totalItems)`

Creates a paginated response.

```javascript
return createPaginatedResponse(users, 1, 10, 95);
```

### User Mappers

#### `mapUserToResponse(user)`

Transforms user document to response DTO.

```javascript
const userDTO = mapUserToResponse(user);
```

#### `mapUsersToList(users)`

Transforms array of users to list item DTOs.

```javascript
const usersDTO = mapUsersToList(users);
```

#### `mapUsersListToResponse(users, page, limit, totalItems)`

Creates paginated user list response.

```javascript
res.json(mapUsersListToResponse(users, page, limit, totalCount));
```

#### `mapUserDetailsToResponse(user)`

Creates single user details response.

```javascript
res.json(mapUserDetailsToResponse(user));
```

#### `mapUserStatsToResponse(stats)`

Creates user statistics response.

```javascript
res.json(mapUserStatsToResponse(statsData));
```

#### `mapUserUpdateToResponse(user, message)`

Creates user update response.

```javascript
res.json(mapUserUpdateToResponse(user, 'User status updated'));
```

#### `mapUserDeletionToResponse(message)`

Creates user deletion response.

```javascript
res.json(mapUserDeletionToResponse('User deleted successfully'));
```

### Authentication Mappers

#### `mapRegistrationToResponse(user, accessToken, refreshToken)`

Creates registration response.

```javascript
res.json(mapRegistrationToResponse(user, accessToken, refreshToken));
```

#### `mapLoginToResponse(user, accessToken, refreshToken)`

Creates login response.

```javascript
res.json(mapLoginToResponse(user, accessToken, refreshToken));
```

#### `mapTokenRefreshToResponse(accessToken, refreshToken)`

Creates token refresh response.

```javascript
res.json(mapTokenRefreshToResponse(newAccessToken, newRefreshToken));
```

#### `mapLogoutToResponse(allDevices)`

Creates logout response.

```javascript
res.json(mapLogoutToResponse(false));  // Single device
res.json(mapLogoutToResponse(true));   // All devices
```

#### `mapPasswordChangeToResponse(sessionsInvalidated)`

Creates password change response.

```javascript
res.json(mapPasswordChangeToResponse(true));
```

#### `mapProfileToResponse(user)`

Creates profile response.

```javascript
res.json(mapProfileToResponse(user));
```

#### `mapProfileUpdateToResponse(user, updatedFields)`

Creates profile update response.

```javascript
res.json(mapProfileUpdateToResponse(user, ['firstName', 'lastName']));
```

## Usage Examples

### Example 1: User Login

**Before DTOs:**

```javascript
const login = asyncHandler(async (req, res) => {
  const user = await User.findByCredentials(email, password);
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  await user.addRefreshToken(refreshToken);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: user.toJSON(),
      tokens: { accessToken, refreshToken }
    }
  });
});
```

**After DTOs:**

```javascript
const { mapLoginToResponse } = require('../dtos');

const login = asyncHandler(async (req, res) => {
  const user = await User.findByCredentials(email, password);
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  await user.addRefreshToken(refreshToken);

  res.status(200).json(mapLoginToResponse(user, accessToken, refreshToken));
});
```

### Example 2: Paginated User List

**Before DTOs:**

```javascript
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().skip(skip).limit(limit);
  const totalCount = await User.countDocuments();

  res.json({
    success: true,
    data: {
      items: users,
      pagination: {
        page, limit, totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    }
  });
});
```

**After DTOs:**

```javascript
const { mapUsersListToResponse } = require('../dtos');

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().skip(skip).limit(limit);
  const totalCount = await User.countDocuments();

  res.json(mapUsersListToResponse(users, page, limit, totalCount));
});
```

### Example 3: Creating Custom DTOs

If you need a new DTO for a new feature:

```javascript
// src/dtos/task.dto.js
class TaskResponseDTO {
  constructor(task) {
    this.id = task._id.toString();
    this.title = task.title;
    this.description = task.description;
    this.status = task.status;
    this.assignedTo = task.assignedTo ? new UserSummaryDTO(task.assignedTo) : null;
    this.createdAt = task.createdAt;
    this.updatedAt = task.updatedAt;
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      status: this.status,
      assignedTo: this.assignedTo?.toJSON(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = { TaskResponseDTO };
```

## Best Practices

### 1. Always Use Mappers in Controllers

```javascript
// ✅ Good
res.json(mapUserDetailsToResponse(user));

// ❌ Bad
res.json({ success: true, data: { user: user.toJSON() } });
```

### 2. Don't Expose Internal Fields

```javascript
// ✅ Good - Uses _id internally, exposes as id
{
  id: "507f1f77bcf86cd799439011",
  email: "user@example.com"
}

// ❌ Bad - Exposes internal MongoDB field
{
  _id: "507f1f77bcf86cd799439011",
  __v: 0,
  email: "user@example.com"
}
```

### 3. Use Appropriate DTO for Context

```javascript
// ✅ Good - Use summary for lists
const recentUsers = users.map(user => new UserSummaryDTO(user));

// ❌ Bad - Too much data in lists
const recentUsers = users.map(user => new UserResponseDTO(user));
```

### 4. Document Response Formats

Always document expected response format in controller JSDoc:

```javascript
/**
 * Response Format:
 * {
 *   success: true,
 *   data: {
 *     user: UserResponseDTO
 *   }
 * }
 */
```

### 5. Handle Nested DTOs Properly

```javascript
class TaskResponseDTO {
  constructor(task) {
    // Transform nested user to UserSummaryDTO
    this.assignedTo = task.assignedTo
      ? new UserSummaryDTO(task.assignedTo)
      : null;
  }
}
```

### 6. Keep DTOs Pure

DTOs should only transform data, not contain business logic:

```javascript
// ✅ Good
class UserResponseDTO {
  constructor(user) {
    this.id = user._id.toString();
    this.fullName = user.fullName || `${user.firstName} ${user.lastName}`;
  }
}

// ❌ Bad - Business logic in DTO
class UserResponseDTO {
  constructor(user) {
    this.canEditProfile = user.role === 'admin' || user.isOwner;
  }
}
```

## Key Differences from Before

### Field Name Changes

| Before | After | Reason |
|--------|-------|--------|
| `_id` | `id` | Cleaner API, framework-agnostic |
| `__v` | Removed | Internal MongoDB field, not needed by clients |

### Response Structure

All responses now include `success` field:

```javascript
// Success
{ success: true, message: "...", data: { ... } }

// Error
{ success: false, message: "...", errors: [...] }
```

### Pagination

Enhanced pagination with more metadata:

```javascript
{
  items: [...],
  pagination: {
    currentPage: 1,
    totalPages: 10,
    totalItems: 95,
    itemsPerPage: 10,
    itemsOnCurrentPage: 10,
    hasNextPage: true,
    hasPrevPage: false,
    nextPage: 2,
    prevPage: null
  }
}
```

## Frontend Integration

### Accessing Data

```typescript
// Login response
const response = await api.post('/auth/login', credentials);
const { user, tokens } = response.data.data;
const userId = user.id;  // Note: 'id', not '_id'

// Paginated list
const response = await api.get('/users?page=1&limit=10');
const { items, pagination } = response.data.data;
console.log(`Showing page ${pagination.currentPage} of ${pagination.totalPages}`);
```

### Type Definitions (TypeScript)

```typescript
interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: 'user' | 'admin' | 'moderator';
  isActive: boolean;
  isEmailVerified: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
}

interface LoginResponse {
  success: true;
  message: string;
  data: {
    user: UserResponse;
    tokens: {
      accessToken: string;
      refreshToken: string;
      tokenType: 'Bearer';
      expiresIn: number;
    };
    loginTimestamp: string;
  };
}
```

## Summary

DTOs provide:
- ✅ Consistent API responses
- ✅ Clean, documented data structures
- ✅ Easy maintenance and refactoring
- ✅ Type safety and validation
- ✅ Security through explicit field control
- ✅ Better developer experience

All controllers now use DTOs for responses, ensuring a consistent, professional API interface.
