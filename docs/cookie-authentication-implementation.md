# Cookie-Based Authentication Implementation

## Overview

This document describes the implementation of secure, httpOnly cookie-based authentication in the Tech Mentor application. This implementation replaces the previous token-in-response-body approach with a more secure method that stores JWT tokens in httpOnly cookies.

## Security Benefits

### Why HttpOnly Cookies?

1. **XSS Protection**: HttpOnly cookies cannot be accessed by JavaScript, preventing XSS attacks from stealing tokens
2. **Automatic Handling**: Browsers automatically include cookies in requests to the same domain
3. **Secure Transmission**: Cookies can be marked as `secure` (HTTPS only) and `sameSite` for CSRF protection
4. **Session Persistence**: Cookies persist across browser sessions until expiry

### Security Features Implemented

- **httpOnly**: Prevents JavaScript access to tokens
- **secure**: Only sent over HTTPS in production
- **sameSite: 'strict'**: Prevents CSRF attacks
- **Proper Expiry**: Access tokens expire in 15 minutes, refresh tokens in 7 days
- **Automatic Cleanup**: Logout endpoint properly clears cookies

## Backend Implementation

### Key Changes Made

#### 1. Auth Controller (`backend/src/auth/auth.controller.ts`)

**Login Endpoint (`POST /auth/login/v1`):**
- Sets access and refresh tokens as httpOnly cookies
- Returns only user data (no tokens in response body)
- Tokens are automatically included in subsequent requests

**Refresh Endpoint (`POST /auth/refresh/v1`):**
- Reads refresh token from cookies instead of request body
- Issues new tokens and updates cookies
- No longer requires refresh token in request body

**Logout Endpoint (`POST /auth/logout/v1`):**
- Clears both access and refresh token cookies
- Provides secure way to end user session

**Verify Endpoint (`GET /auth/verify/v1`):**
- Test endpoint to verify cookie-based authentication works
- Protected by JWT guard, returns user info if authenticated

#### 2. JWT Strategy (`backend/src/auth/strategies/jwt.strategy.ts`)

**Updated Token Extraction:**
```typescript
jwtFromRequest: ExtractJwt.fromExtractors([
  JwtStrategy.extractJWTFromCookie,
  ExtractJwt.fromAuthHeaderAsBearerToken(), // Fallback for API clients
])
```

**Custom Cookie Extractor:**
```typescript
private static extractJWTFromCookie(request: Request): string | null {
  if (request.cookies && 'access_token' in request.cookies) {
    return request.cookies.access_token;
  }
  return null;
}
```

#### 3. Main Application (`backend/src/main.ts`)

**Cookie Parser Middleware:**
```typescript
import cookieParser from 'cookie-parser';
app.use(cookieParser());
```

**CORS Configuration:**
```typescript
app.enableCors({
  // ... other options
  credentials: true, // Essential for cookie-based auth
});
```

### Cookie Configuration

```typescript
const cookieOptions = {
  httpOnly: true,                    // Prevents XSS access
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'strict' as const,       // CSRF protection
  path: '/',                         // Available app-wide
};

// Access token (15 minutes)
response.cookie('access_token', accessToken, {
  ...cookieOptions,
  maxAge: 15 * 60 * 1000,
});

// Refresh token (7 days)
response.cookie('refresh_token', refreshToken, {
  ...cookieOptions,
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
```

## Frontend Implementation

### Key Changes Made

#### 1. Login Form (`web/src/components/login/LoginForm.tsx`)

**Updated API Calls:**
```typescript
const response = await fetch("http://localhost:3000/auth/login/v1", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  credentials: 'include', // Essential: sends cookies with request
  body: JSON.stringify({
    email: formData.email,
    password: formData.password,
  }),
});
```

**Updated Response Handling:**
```typescript
// Response no longer contains tokens
interface LoginResponse {
  user: CreateUserResponseDto;
}
```

**Secure Logout:**
```typescript
const handleLogout = async () => {
  try {
    // Call backend to clear httpOnly cookies
    await fetch("http://localhost:3000/auth/logout/v1", {
      method: "POST",
      credentials: 'include',
    });
  } catch (error) {
    console.error("Logout API call failed:", error);
  }
  
  // Reset frontend state
  setIsLoggedIn(false);
  setUser(null);
};
```

## Usage Examples

### Making Authenticated Requests

**Frontend (React):**
```typescript
// Any API call to protected endpoint
const response = await fetch("http://localhost:3000/protected-endpoint", {
  method: "GET",
  credentials: 'include', // This includes cookies automatically
});
```

**Backend (Protected Route):**
```typescript
@UseGuards(AuthGuard('jwt'))
@Get('protected-endpoint')
public async protectedRoute(@CurrentUser() user: ICommonUser) {
  // User is automatically extracted from JWT token in cookie
  return { message: `Hello ${user.name}!` };
}
```

### Testing Authentication

The frontend includes a test button that calls:
```typescript
const testAuthToken = async () => {
  const response = await fetch("http://localhost:3000/auth/verify/v1", {
    method: "GET",
    credentials: 'include',
  });
  
  if (response.ok) {
    const data = await response.json();
    // Shows user info from JWT token
    alert(`✅ Authentication successful! User: ${data.user.name}`);
  }
};
```

## Development vs Production

### Development Configuration
- `secure: false` - allows cookies over HTTP
- `sameSite: 'strict'` - still provides CSRF protection

### Production Configuration  
- `secure: true` - requires HTTPS
- `sameSite: 'strict'` - prevents CSRF attacks
- Domain-specific cookie settings if needed

## Migration from Previous Implementation

### What Changed
1. **No more localStorage**: Tokens no longer stored in localStorage
2. **No tokens in API responses**: Login/refresh endpoints don't return tokens
3. **Automatic cookie handling**: Browser handles token transmission
4. **New logout requirement**: Must call logout endpoint to clear cookies

### Benefits of Migration
1. **Enhanced Security**: Protection against XSS attacks
2. **Simplified Frontend**: No manual token management
3. **Better UX**: Persistent sessions across browser restarts
4. **CSRF Protection**: Built-in sameSite protection

## Troubleshooting

### Common Issues

1. **Cookies not sent with requests:**
   - Ensure `credentials: 'include'` in fetch calls
   - Check CORS configuration has `credentials: true`

2. **Authentication fails after restart:**
   - Check cookie expiry times
   - Verify cookie-parser is configured

3. **CORS errors:**
   - Ensure frontend origin is in CORS allowlist
   - Check that `credentials: true` is set in CORS config

### Testing

1. **Browser DevTools**: Check Application/Cookies tab for `access_token` and `refresh_token`
2. **Network Tab**: Verify `Set-Cookie` headers in responses
3. **Test Endpoint**: Use `/auth/verify/v1` to test authentication
4. **Protected Routes**: Try accessing existing protected endpoints

## Security Considerations

### Best Practices Implemented
- Short access token lifetime (15 minutes)
- Longer refresh token lifetime (7 days)  
- Secure cookie attributes
- Proper logout implementation
- CORS configuration for credentials

### Additional Recommendations
- Monitor cookie size (4KB limit)
- Consider refresh token rotation for enhanced security
- Implement proper session management
- Add rate limiting to auth endpoints
- Consider adding device/IP tracking for suspicious activity

## Dependencies Added

### Backend
```json
{
  "cookie-parser": "^1.4.6",
  "@types/cookie-parser": "^1.4.7"
}
```

### Frontend
No additional dependencies required - uses native fetch with credentials. 