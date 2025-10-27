# Swagger API Documentation Guide

## Quick Start

### Accessing Swagger UI

1. **Start the server**:
   ```bash
   npm run dev
   ```

2. **Open your browser** and navigate to:
   ```
   http://localhost:5000/api-docs
   ```

3. You should see the interactive Swagger UI interface with all API endpoints.

---

## Using Swagger UI

### Basic Navigation

- **Endpoints are grouped by tags**: Authentication, Profile, Health
- **Click on any endpoint** to expand and view details
- **Green badges** indicate GET requests
- **Orange badges** indicate POST/PUT requests
- **Red badges** indicate DELETE requests

### Testing Public Endpoints

#### Example: Register a New User

1. **Expand** the `POST /auth/register` endpoint
2. Click **"Try it out"** button
3. **Edit the request body** with your data:
   ```json
   {
     "email": "test@example.com",
     "password": "Password123",
     "confirmPassword": "Password123",
     "firstName": "John",
     "lastName": "Doe"
   }
   ```
4. Click **"Execute"**
5. View the **Response** section below:
   - Status code (201 for success)
   - Response body with user data and tokens
   - Response headers

6. **Copy the `accessToken`** from the response for testing protected endpoints

#### Example: Login

1. **Expand** the `POST /auth/login` endpoint
2. Click **"Try it out"**
3. **Edit the request body**:
   ```json
   {
     "email": "test@example.com",
     "password": "Password123"
   }
   ```
4. Click **"Execute"**
5. **Copy the `accessToken`** from the response

### Testing Protected Endpoints

Protected endpoints require authentication. Here's how to set it up:

#### Step 1: Authenticate

1. **Click the "Authorize" button** (🔓 icon at the top right)
2. A modal will appear with "bearerAuth" field
3. **Enter your access token** in this format:
   ```
   Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   **Important**: Include the word "Bearer" followed by a space, then your token
4. Click **"Authorize"**
5. Click **"Close"**
6. The lock icon should now show as locked (🔒)

#### Step 2: Test Protected Endpoints

Now you can test any protected endpoint. For example:

##### Get Profile

1. **Expand** `GET /auth/profile`
2. Click **"Try it out"**
3. Click **"Execute"**
4. View your user profile in the response

##### Update Profile

1. **Expand** `PUT /auth/profile`
2. Click **"Try it out"**
3. **Edit the request body**:
   ```json
   {
     "firstName": "Jane",
     "lastName": "Smith"
   }
   ```
4. Click **"Execute"**
5. View the updated profile in the response

##### Change Password

1. **Expand** `POST /auth/change-password`
2. Click **"Try it out"**
3. **Edit the request body**:
   ```json
   {
     "currentPassword": "Password123",
     "newPassword": "NewPassword456",
     "confirmNewPassword": "NewPassword456"
   }
   ```
4. Click **"Execute"**
5. Note: This will invalidate all refresh tokens

---

## Common Issues & Solutions

### 401 Unauthorized Error

**Problem**: You're getting "Access denied. No token provided" or "Invalid token"

**Solutions**:
1. **Check if you clicked "Authorize"** and entered your token
2. **Verify the token format**: Must be `Bearer <token>` (with a space)
3. **Check if the token expired**: Access tokens last 15 minutes
4. **Get a new token**: Login again or use the refresh token endpoint

### 403 Forbidden Error

**Problem**: You're getting "Account is deactivated" or "Insufficient permissions"

**Solutions**:
1. **Account deactivated**: Contact administrator
2. **Insufficient permissions**: You're trying to access an admin-only endpoint

### 400 Validation Error

**Problem**: Your request is being rejected with validation errors

**Solutions**:
1. **Check required fields**: Make sure all required fields are present
2. **Verify data formats**:
   - Email must be valid format
   - Password must be 8-128 characters with letters and numbers
   - Names must be 2-50 characters
3. **Match passwords**: `confirmPassword` must match `password`

### 409 Conflict Error

**Problem**: "Email already registered"

**Solution**: The email is already in use. Try a different email or login instead.

### 429 Rate Limit Error

**Problem**: "Too many requests"

**Solution**: Wait 15 minutes before trying again. Default limit is 100 requests per 15 minutes.

---

## Understanding the Response

### Success Response Format

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data here
  }
}
```

### Error Response Format

```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

---

## API Workflow Examples

### Complete Registration → Login → Update Profile Flow

#### 1. Register

```
POST /auth/register
Body:
{
  "email": "user@example.com",
  "password": "Password123",
  "confirmPassword": "Password123",
  "firstName": "John",
  "lastName": "Doe"
}

Response:
- accessToken (use this for immediate requests)
- refreshToken (save this for getting new access tokens)
```

#### 2. Use Access Token

```
Click "Authorize" → Enter: Bearer <accessToken>
```

#### 3. Get Profile

```
GET /auth/profile
(Authorization header automatically added)

Response:
{
  "success": true,
  "data": {
    "user": { ... }
  }
}
```

#### 4. Update Profile

```
PUT /auth/profile
Body:
{
  "firstName": "Jane",
  "lastName": "Smith"
}
```

#### 5. When Access Token Expires

```
POST /auth/refresh
Body:
{
  "refreshToken": "<your_refresh_token>"
}

Response:
- New accessToken (use this for new requests)
```

#### 6. Logout

```
POST /auth/logout
Body:
{
  "refreshToken": "<your_refresh_token>"
}
```

---

## Schema Reference

### User Object

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "fullName": "John Doe",
  "role": "user",
  "isActive": true,
  "isEmailVerified": false,
  "lastLogin": "2024-01-01T00:00:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Tokens Object

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## Tips & Best Practices

### 1. Save Your Tokens

After registration or login, **save both tokens**:
- **Access Token**: For immediate API requests (expires in 15 minutes)
- **Refresh Token**: For getting new access tokens (expires in 7 days)

### 2. Use Refresh Tokens

When your access token expires:
- Don't login again
- Use the `/auth/refresh` endpoint with your refresh token
- Get a new access token

### 3. Test in Order

For the best experience, test endpoints in this order:
1. Register a user
2. Authorize with the access token
3. Test protected endpoints
4. Test refresh token
5. Test logout

### 4. Clear Authorization

To test as a different user:
1. Click the "Authorize" button
2. Click "Logout" (in the authorization modal)
3. Login or register with different credentials
4. Authorize with the new token

### 5. Export API Specification

Download the OpenAPI specification:
```
http://localhost:5000/api-docs.json
```

Use this with:
- Postman (import OpenAPI spec)
- API clients
- Code generators
- Testing tools

---

## Advanced Features

### Swagger JSON Endpoint

Access the raw OpenAPI specification:
```
GET http://localhost:5000/api-docs.json
```

### Using with Postman

1. Open Postman
2. Click "Import"
3. Select "Link"
4. Enter: `http://localhost:5000/api-docs.json`
5. Click "Continue" → "Import"
6. All endpoints will be imported to Postman

### Using with Code Generators

Generate client SDKs using the OpenAPI specification:
```bash
# Install OpenAPI Generator
npm install -g @openapitools/openapi-generator-cli

# Generate TypeScript client
openapi-generator-cli generate -i http://localhost:5000/api-docs.json -g typescript-axios -o ./client
```

---

## Troubleshooting

### Swagger UI Not Loading

1. **Check if server is running**: `npm run dev`
2. **Verify the URL**: `http://localhost:5000/api-docs`
3. **Check console for errors**
4. **Clear browser cache**

### Endpoints Not Showing

1. **Restart the server**
2. **Check swagger configuration** in `src/config/swagger.js`
3. **Verify annotations** in `src/routes/swaggerDocs.js`

### Can't Execute Requests

1. **Check CORS settings** in `.env`
2. **Verify MongoDB is running**
3. **Check server console** for errors

---

## Additional Resources

- **OpenAPI Specification**: https://swagger.io/specification/
- **Swagger UI Documentation**: https://swagger.io/tools/swagger-ui/
- **API Best Practices**: See `SECURITY.md` in project root

---

**Need Help?** Check the main [README.md](./README.md) or open an issue on GitHub.
