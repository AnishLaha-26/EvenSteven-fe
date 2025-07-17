# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EvenSteven is a modern expense-sharing application built with Next.js 15, React 19, and TypeScript. The frontend integrates with a Django backend via JWT authentication and provides a responsive, dark-mode-enabled interface for splitting expenses among groups.

## Development Commands

- `npm run dev` - Start development server (Next.js dev mode)
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality checks

## Architecture

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **UI**: React 19 with Tailwind CSS + shadcn/ui components
- **State Management**: React Context (AuthContext) + React Query for API calls
- **Authentication**: JWT tokens with automatic refresh
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation
- **HTTP Client**: Axios with interceptors for token management

### Key Architecture Patterns

1. **App Router Structure**: Uses Next.js 13+ app directory with page.tsx files
2. **Authentication Flow**: JWT-based with automatic token refresh via axios interceptors
3. **Protected Routes**: Higher-order component pattern with `ProtectedRoute` wrapper
4. **Theme System**: Custom theme provider with CSS variables for light/dark mode
5. **API Layer**: Centralized API service with automatic token handling and refresh logic

### Directory Structure

```
app/                    # Next.js app router pages
├── layout.tsx         # Root layout with providers
├── page.tsx           # Landing page
├── login/page.tsx     # Authentication pages
├── register/page.tsx
├── dashboard/page.tsx # Main dashboard
└── [feature]/page.tsx # Feature-specific pages

components/            # Reusable components
├── ui/               # shadcn/ui components
├── protected-route.tsx # Route protection
├── theme-provider.tsx # Theme management
└── profile-update.tsx # User profile management

contexts/             # React contexts
└── auth-context.tsx  # Authentication state management

lib/                  # Utility libraries
├── api.ts           # API service with axios
├── config.ts        # Environment configuration
└── utils.ts         # Utility functions (cn helper)

hooks/               # Custom React hooks
├── use-mobile.tsx   # Mobile detection
├── use-sound.ts     # Sound effects
└── use-toast.ts     # Toast notifications
```

## Authentication System

The app uses JWT authentication with the following flow:
- Access tokens stored in localStorage
- Automatic token refresh via axios interceptors
- Protected routes redirect to login if unauthenticated
- User state managed via AuthContext

### Key Files:
- `contexts/auth-context.tsx` - Authentication state and methods
- `lib/api.ts` - API service with token management
- `components/protected-route.tsx` - Route protection wrapper

## Backend Integration

API Base URL: `http://localhost:8000/api` (development)
Set `NEXT_PUBLIC_API_URL` environment variable for production.

### Key API Endpoints:
- `POST /auth/register/` - User registration
- `POST /auth/login/` - User login
- `GET /auth/profile/` - Get user profile
- `POST /auth/logout/` - User logout
- `POST /token/refresh/` - Token refresh
- `POST /groups/` - Create group
- `POST /groups/{id}/join/` - Join group

## Styling System

Uses Tailwind CSS with custom CSS variables for theming. Key patterns:
- Dark mode support via CSS variables
- Custom button styles with hover effects
- Responsive design principles
- Component-based styling with shadcn/ui

## Development Notes

- ESLint and TypeScript errors are ignored during builds (next.config.mjs)
- Images are unoptimized for deployment flexibility
- Uses pnpm for package management (pnpm-lock.yaml present)
- Custom sound effects integrated via useSound hook
- Mobile-responsive design with custom mobile detection hook

## Environment Variables

Create `.env.local` with:
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## Testing

No specific test framework is configured. When implementing tests, check for existing test setup or coordinate with the team on testing strategy.