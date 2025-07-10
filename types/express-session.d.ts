// Type augmentation for express-session
// This allows us to access req.session.user and other custom properties without TypeScript errors.

import 'express-session';

// Extend the built-in SessionData interface with our custom fields

declare module 'express-session' {
  interface SessionData {
    user?: {
      id: number;
      email: string;
      role?: string;
    };
    userId?: number;
    userEmail?: string;
  }

  // Allow direct access on Session object as well (e.g., req.session.user)
  interface Session {
    user?: {
      id: number;
      email: string;
      role?: string;
    };
    userId?: number;
    userEmail?: string;
  }
}