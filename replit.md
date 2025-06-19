# 5Central Capital Analytics Dashboard

## Overview

This is a full-stack web application for 5Central Capital LLC, a real estate investment company. The application serves as both a public-facing portfolio website and an internal analytics dashboard for tracking real estate investment performance. The system is built with a modern React frontend and Express.js backend, using PostgreSQL for data persistence.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React hooks and context
- **Data Fetching**: TanStack React Query for API calls
- **Routing**: React Router for client-side navigation
- **Charts**: Recharts for data visualizations

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM for type-safe database interactions
- **Database**: PostgreSQL (configured for Neon serverless)
- **Build Tool**: esbuild for server bundling
- **Development**: tsx for TypeScript execution

### Development Environment
- **Package Manager**: npm
- **Build Tool**: Vite for frontend bundling
- **TypeScript**: Strict mode enabled across the stack
- **Linting**: Built-in TypeScript checking

## Key Components

### Public Portfolio Website
- Property portfolio showcase with performance metrics
- Company information and founder biography
- Investment strategy and vision presentation
- Investor interest collection forms
- Responsive design for all device sizes

### Admin Dashboard (Planned)
- Real estate portfolio management
- Financial metrics tracking and visualization
- Property performance analytics
- User authentication and session management
- Role-based access control (admin, manager, viewer)

### Database Schema
The application uses a comprehensive schema for real estate analytics:
- **Users**: Authentication with role-based permissions
- **Sessions**: Secure session management
- **Company Metrics**: Financial KPI tracking
- **Properties**: Real estate portfolio data (planned)
- **Financial Metrics**: Detailed financial performance tracking (planned)

## Data Flow

### Public Website Flow
1. Static pages served via Vite-processed React components
2. Property data currently managed in frontend state
3. Investor inquiries stored in localStorage (temporary solution)
4. Image assets served from public directory

### Admin Dashboard Flow (Planned)
1. User authentication via Express API endpoints
2. Protected routes requiring valid session tokens
3. Database queries through Drizzle ORM
4. Real-time data updates via React Query
5. Chart data processed and visualized via Recharts

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: react, react-dom, react-router-dom
- **UI Components**: @radix-ui components, lucide-react icons
- **Styling**: tailwindcss, autoprefixer, postcss
- **Data Fetching**: @tanstack/react-query
- **Charts**: recharts for analytics visualizations

### Backend Dependencies
- **Database**: @neondatabase/serverless, drizzle-orm
- **Validation**: zod for schema validation
- **Session Management**: connect-pg-simple (planned)
- **Utilities**: date-fns for date formatting

### Development Dependencies
- **Build Tools**: vite, esbuild, tsx
- **TypeScript**: Full type coverage across stack
- **Development**: @replit/vite-plugin-runtime-error-modal

## Deployment Strategy

### Production Build
- Frontend: Vite builds to `dist/public` directory
- Backend: esbuild bundles server to `dist/index.js`
- Static assets: Served via Express static middleware

### Environment Configuration
- **Development**: npm run dev (tsx server with Vite middleware)
- **Production**: npm run build && npm run start
- **Database**: Environment variable-based configuration

### Hosting Platform
- **Replit**: Configured for autoscale deployment
- **Port Configuration**: Server runs on port 5000, mapped to external port 80
- **Database**: Neon PostgreSQL serverless database

### Migration Strategy
- Drizzle Kit for database schema management
- SQL migrations stored in `supabase/migrations/` directory
- Push-based deployment via `npm run db:push`

## Changelog

Changelog:
- June 17, 2025. Initial setup
- June 17, 2025. Fixed property card data display - now pulling accurate values directly from database
- June 18, 2025. Built comprehensive deal analysis system with real-time KPI calculations, WebSocket support, and sample data
- June 19, 2025. Restructured rehab budget to match detailed spreadsheet format with two-column layout, proper categorization (Exterior, Kitchens, Bathrooms, General Interior Rough, Finishings), 10% buffer calculation, and comprehensive breakdown summary

## User Preferences

Preferred communication style: Simple, everyday language.