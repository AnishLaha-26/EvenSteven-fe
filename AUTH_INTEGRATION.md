# JWT Authentication Integration

This document describes the JWT authentication integration with the Django backend.

## Features Implemented

### 🔐 Authentication System
- **User Registration**: Complete signup flow with first name, last name, email, and password
- **User Login**: Email and password authentication
- **JWT Token Management**: Automatic token refresh and secure storage
- **Protected Routes**: Automatic redirection for unauthenticated users
- **User Profile Management**: View and update user profile information
- **Secure Logout**: Proper token cleanup and session termination

### 🎨 UI/UX Features
- **Consistent Design**: Matches existing EvenSteven branding
- **Dark Mode Support**: Full theme integration
- **Loading States**: Visual feedback during API calls
- **Error Handling**: User-friendly error messages
- **Form Validation**: Client-side validation with backend integration
- **Responsive Design**: Works on all device sizes

## File Structure

```
├── contexts/
│   └── auth-context.tsx          # Authentication context provider
├── components/
│   ├── protected-route.tsx       # Route protection component
│   └── profile-update.tsx        # Profile management component
├── lib/
│   ├── api.ts                   # API service with JWT handling
│   └── config.ts                # Environment configuration
├── app/
│   ├── layout.tsx               # Root layout with auth provider
│   ├── login/page.tsx           # Login page
│   ├── register/page.tsx        # Registration page
│   └── dashboard/page.tsx       # Protected dashboard
└── .env.local                   # Environment variables
```

## API Integration

### Base URL Configuration
- **Development**: `http://localhost:8000/api`
- **Production**: Set `NEXT_PUBLIC_API_URL` in environment variables

### Endpoints Used
- `POST /auth/register/` - User registration
- `POST /auth/login/` - User login
- `GET /auth/profile/` - Get user profile
- `PATCH /auth/profile/` - Update user profile
- `POST /auth/logout/` - User logout
- `POST /token/refresh/` - Refresh JWT token

### Token Management
- **Access Token**: Stored in localStorage, automatically included in API requests
- **Refresh Token**: Used for automatic token renewal
- **Auto-Refresh**: Handles token expiration transparently
- **Secure Storage**: Tokens are cleared on logout

## Usage

### Authentication Context
```tsx
import { useAuth } from '@/contexts/auth-context'

function MyComponent() {
  const { user, login, logout, isAuthenticated, loading } = useAuth()
  
  // Use authentication state and methods
}
```

### Protected Routes
```tsx
import { ProtectedRoute } from '@/components/protected-route'

function ProtectedPage() {
  return (
    <ProtectedRoute>
      <div>This content is only visible to authenticated users</div>
    </ProtectedRoute>
  )
}
```

### API Calls
```tsx
import api from '@/lib/api'

// The API instance automatically includes JWT tokens
const response = await api.get('/some-protected-endpoint/')
```

## Security Features

- **Automatic Token Refresh**: Prevents session expiration
- **Request Interceptors**: Automatically add auth headers
- **Response Interceptors**: Handle 401 errors and token refresh
- **Secure Logout**: Properly invalidates tokens on backend
- **Error Handling**: Graceful handling of authentication errors

## Environment Variables

Create a `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## Testing the Integration

1. **Start your Django backend** on `http://localhost:8000`
2. **Start the Next.js frontend**: `npm run dev`
3. **Test Registration**: Create a new account
4. **Test Login**: Sign in with credentials
5. **Test Protected Routes**: Access dashboard after login
6. **Test Token Refresh**: Leave app idle and verify automatic refresh
7. **Test Logout**: Verify proper session termination

## Error Handling

The system handles various error scenarios:
- **Network Errors**: Connection issues with backend
- **Validation Errors**: Form validation and backend validation
- **Authentication Errors**: Invalid credentials, expired tokens
- **Authorization Errors**: Access to protected resources

## Production Deployment

1. **Update API URL**: Set `NEXT_PUBLIC_API_URL` to your production backend
2. **HTTPS**: Ensure both frontend and backend use HTTPS
3. **CORS**: Configure backend CORS for your production domain
4. **Token Security**: Consider using httpOnly cookies for production

## Troubleshooting

### Common Issues
- **CORS Errors**: Check backend CORS configuration
- **Token Expiration**: Verify refresh token logic
- **Network Issues**: Check API base URL configuration
- **Form Validation**: Ensure frontend validation matches backend

### Debug Tips
- Check browser console for API errors
- Verify tokens in localStorage
- Test API endpoints directly
- Check network tab for request/response details
