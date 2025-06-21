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
- June 19, 2025. Integrated deal analyzer as new tab in admin dashboard between Financial and Properties tabs
- June 19, 2025. Removed demo credentials from admin login page for enhanced security
- June 19, 2025. Built comprehensive financial dashboard with rent roll management, rehab budgeting, lender analysis, and exit scenario modeling based on Excel specification
- June 19, 2025. Moved admin login button to header navigation positioned right of Invest button with standard header text styling
- June 19, 2025. Added comprehensive save/export functionality to deal analyzer with localStorage persistence, JSON/CSV export options, and saved deals management panel
- June 19, 2025. Made saved deal and export buttons smaller for enhanced spacing in deal analyzer header
- June 19, 2025. Removed Overview, Financial, Financial Dashboard, and Investor Leads tabs from admin dashboard, keeping only Deal Analyzer, Properties, and Reports tabs with Deal Analyzer as default
- June 19, 2025. Built comprehensive Net Worth Tracker tab with interactive asset allocation monitoring, editable entity management, and automatic net worth calculations based on real estate equity, stock portfolio, and cash equivalents
- June 19, 2025. Redesigned Net Worth Tracker with modern gradient styling, circular progress indicators, enhanced visual analytics, and card-based entity management layout
- June 19, 2025. Transformed Properties tab into comprehensive Asset Management dashboard with KPI bar driven by actual property data, financial statement tabs (Balance Sheet, Income Statement, Cash Flow), and real-time portfolio calculations
- June 20, 2025. Built comprehensive Entity Dashboard with top metric bar (AUM, Price/Unit, Units, Properties, Equity Multiple, Monthly Cash Flow), cash balance management, milestone tracking, to-do list widget, and Entity KPIs section with 6 tabs (Overview, Owner, Financials, Members, Compliance, Properties) - all calculations derived from actual property data
- June 20, 2025. Reordered admin dashboard tabs to: Dashboard, Asset Management, Deal Analyzer, Roadmap (Coming Soon), Net Worth, Reports - with Entity Dashboard as default landing page
- June 20, 2025. Enhanced Entity Dashboard with fully editable to-do list and milestone management featuring inline editing, add/delete functionality, status toggling, and comprehensive CRUD operations - all data persisted in component state
- June 20, 2025. Updated Entity KPIs section header to prominently display "5Central Capital" with redesigned KPI cards showing entity-level metrics derived from property and financial data in modern color-coded layout
- June 20, 2025. Implemented property-to-entity assignment functionality in Asset Management with dropdown selection for entities (5Central Capital LLC, Harmony Holdings LLC, Crystal Properties LLC) and filtered property display in Entity Dashboard properties tab showing only assets assigned to specific entities
- June 20, 2025. Built comprehensive editable entity management system with separate sections for each entity displaying individual KPIs, property assignments, financial metrics, and entity details - includes add/edit/delete functionality for entities with full CRUD operations and real-time property filtering
- June 20, 2025. Completely overhauled Asset Management page with KPI bar matching dashboard design, comprehensive financial statement tabs (Balance Sheet, Income Statement, Cash Flow Statement), and modernized property cards with entity assignment dropdowns - all calculations derived from actual property data with authentic financial metrics
- June 20, 2025. Redesigned Entity Dashboard with collective KPIs at top showing total portfolio metrics, shared middle section with cash balance/milestones/todos for all entities, and individual entity sections at bottom displaying entity-specific metrics and properties filtered by real database assignments
- June 20, 2025. Enhanced Entity Dashboard with comprehensive tab system: Overview tab with detailed property analytics, Financials tab with real property-based income statements and asset valuations, combined Owners & Members tab with equity percentages and roles, Compliance tab with entity-specific legal requirements tracking, and Properties tab with filtered property listings - all calculations derived from authentic database property data
- June 20, 2025. Added database schema for entity memberships and compliance tracking to support user-based access control, equity percentage tracking, and comprehensive compliance management with status tracking, due dates, and priority levels
- June 20, 2025. Implemented comprehensive user-based access control system - users now only see entities they own and properties tied to those entities through session-based authentication with token management, filtered API endpoints using getPropertiesForUser method, and middleware authentication protecting all user-specific data access
- June 20, 2025. Redesigned KPI bars across Asset Management and Entity Dashboard to match Deal Analyzer design style with bordered containers, Calculator icons, and consistent label/value formatting - reorganized Entity Dashboard middle section into two side-by-side columns with Cash Balance/Milestones on left and To-Do List on right - standardized entity headers with unified design showing entity name, summary metrics, and performance indicators across all entities
- June 20, 2025. Applied Deal Analyzer color scheme to KPI bars in Entity Dashboard and Asset Management with colored background sections (blue-50, green-50, purple-50, orange-50, indigo-50, emerald-50) and matching text colors for visual consistency - positive/negative values use appropriate green/red coloring - all KPI sections now have unified visual design across the entire application
- June 20, 2025. Updated entity names across the entire application: "Harmony Holdings LLC" renamed to "The House Doctors", "Crystal Properties LLC" renamed to "Arcadia Vision Group", and "5Central Capital LLC" simplified to "5Central Capital" - updated all frontend components, database records, and entity assignment dropdowns to reflect the new branding
- June 20, 2025. Reorganized Asset Management property portfolio into separate sections for active and sold properties with distinct layouts - active properties display in horizontal cards with full-width layout, sold properties display in square grid boxes (3 per row) with compact design - both sections maintain full database integration and entity assignment functionality
- June 20, 2025. Added comprehensive property detail modal functionality - double-clicking any property card opens a large modal displaying complete property information including financial metrics, investment data, acquisition details, performance summaries, and sale information for sold properties - modal features responsive design with two-column layout and color-coded sections
- June 20, 2025. Implemented comprehensive user account creation and entity ownership setup system - added "Create an Account" button to admin login page directing to account setup form with email/password authentication and entity ownership configuration - users can define multiple entities with ownership percentages, asset types (real estate, cash, stocks, bonds, business, other), and current values - system creates user accounts with secure password hashing and links entity ownership records for personalized dashboard generation
- June 20, 2025. Built personalized onboarding tour for new users - interactive guided tour highlights key dashboard features (KPI metrics, navigation, entity management, deal analyzer, asset management) with step-by-step progression, element highlighting, and tour restart functionality - automatically triggers for new users and includes data tour attributes throughout the dashboard for seamless guidance
- June 20, 2025. Redesigned KPI bars to match Deal Analyzer's continuous gradient design - implemented single continuous blue-to-purple gradient bar (from-blue-600 via-blue-500 via-purple-500 to-purple-600) with white text and subtle border separators between metrics - replaced separate tiles with unified horizontal layout displaying all metrics inline within the same gradient bar - applied consistent styling across Entity Dashboard and Asset Management with Calculator icons for unified design language
- June 20, 2025. Added comprehensive Active Deals section to Asset Management with side-by-side layout - left side displays detailed property cards with acquisition details, units, ARV, and entity assignment - right side features progress tracking with visual progress bars for rehab completion and budget utilization including total budget, spent amount, remaining funds with color-coded indicators (green/yellow/red) and status tracking for ongoing renovations
- June 20, 2025. Implemented comprehensive property status management system - added property status dropdown with four stages ("Under Contract", "Rehabbing", "Cashflowing", "Sold") and reorganized Asset Management into separate sections for each property stage with stage-specific card layouts - Under Contract and Cashflowing properties display in standard horizontal cards, Rehabbing properties show enhanced cards with progress tracking and budget management, Sold properties display in compact grid format with sale metrics - includes full CRUD operations for status updates with database persistence
- June 20, 2025. Reorganized Asset Management layout structure - moved Financial Statements tabs (Balance Sheet, Income Statement, Cash Flow Statement) to top section after KPI bar, deleted legacy active and sold property sections, redesigned property sections with Under Contract as compact section for light usage and Rehabbing as side-by-side layout with enhanced progress tracking and budget management on right side including total budget, spent amounts, remaining funds with color-coded progress bars and status indicators
- June 20, 2025. Built comprehensive Deal Analyzer to Property Import workflow - added "Import to Properties" button with modal for collecting missing property data (entity, acquisition date, broker, legal notes) and automatic data transfer from Deal Analyzer to Properties database with "Under Contract" status by default - preserves all deal analysis data including purchase price, rehab costs, financial metrics, and calculated values
- June 20, 2025. Enhanced saved deals management in Deal Analyzer with delete functionality - added trash icon buttons next to Load buttons for each saved deal, implemented delete function with localStorage persistence, maintained exact layout and design integrity while adding full CRUD operations for saved deal management
- June 20, 2025. Added comprehensive property financial breakdown modal to Entity Dashboard - double-clicking property rows opens detailed modal with Deal Analyzer design style showing Revenue, Expenses, NOI, Investment Summary, Loan Analysis, and Property Details sections with color-coded financial breakdown calculations and comprehensive property information display
- June 20, 2025. Implemented comprehensive micro-interactions and hover animations throughout the entire application - added smooth transitions, card hover effects, button animations, icon bounces, scale transforms, and staggered children animations to enhance user engagement across Deal Analyzer, Asset Management, and Entity Dashboard components - all interactive elements now feature subtle animations and micro-interactions using fade-in, card-hover, button-pulse, icon-bounce, hover-glow, hover-scale, and transition classes for improved user experience
- June 20, 2025. Updated spacing across all admin dashboard pages to be full width by removing container width constraints (max-w-7xl mx-auto, max-w-6xl mx-auto, container mx-auto) from AdminDashboard, EntityDashboard, DealAnalyzer, and NetWorthTracker pages while preserving existing layout structure - all admin dashboard pages now utilize full browser width for improved space utilization
- June 20, 2025. Extended full-width layout to header logo and navigation tabs by removing max-width constraints from header and navigation sections - entire admin dashboard now uses complete browser width including header, tabs, and all page content
- June 21, 2025. Updated sold property card KPIs to show: Capital Invested (initial capital required), Total Profit (cashflow + sale profits), Equity Multiple (calculated return multiple), and Sale Price - replaced previous metrics with investor-focused financial performance indicators
- June 21, 2025. Redesigned sold property cards with smaller, more compact layout displaying 4 cards per row instead of 3 - reduced padding, spacing, and text sizes while maintaining color-coded metric sections and visual hierarchy
- June 21, 2025. Built comprehensive property detail modal with 8 editable tabs (Overview, Rent Roll, Rehab Budget, Income & Expenses, Financing, Sensitivity, 12-Month Proforma, Exit Analysis) - all tabs feature full CRUD operations with database persistence through dealAnalyzerData field - Income & Expenses tab combines income sources and operating expenses with real-time NOI calculations - Sensitivity tab provides scenario analysis with adjustable variables - 12-Month Proforma displays monthly cash flow projections with annual totals - Edit/Save functionality preserves all changes to property database records
- June 21, 2025. Enhanced property detail modal with fully editable rent roll (unit numbers, types, current/market rents with add/remove functionality), comprehensive rehab budget tracking (spending, remaining budgets, completion status with real-time progress indicators), and complete exit analysis with refinance section (editable LTV, rates, costs with automatic projections) plus strategy comparison table analyzing hold vs refinance vs sale scenarios - all calculations update in real-time with database persistence
- June 21, 2025. Conducted comprehensive calculation review and corrections - fixed cash-on-cash return to use actual equity invested post-refinance, corrected break-even occupancy formula to use proper expense-to-revenue ratio, improved equity multiple calculation to reflect total value returned vs initial investment, enhanced ARV calculation with proper validation for negative NOI scenarios, updated debt service calculations to use post-refinance terms for stabilized cash flow analysis, and aligned all financial metrics with professional real estate investment standards
- June 21, 2025. Implemented normalized database architecture with separate tables for Deal Analyzer components (property_assumptions, property_unit_types, property_rent_roll, property_expenses, property_rehab_budget, property_closing_costs, property_holding_costs, property_exit_analysis, property_income_other) while maintaining backward compatibility with existing dealAnalyzerData JSON field - includes comprehensive storage interface with sync methods for seamless data migration and enhanced query performance
- June 21, 2025. Fixed property dataset integrity issues by removing duplicate properties, normalizing data structures, creating comprehensive property assumptions/unit types/rent rolls/expenses/exit analysis for all properties, correcting negative cash flows, and ensuring proper data relationships - all 13 properties now have complete normalized data for seamless Deal Analyzer integration and accurate financial calculations
- June 21, 2025. Fixed sales cap rate in exit analysis to function as proper real estate cap rate - changed calculation from ARV multiplier approach to NOI / Cap Rate formula, updated input field to percentage format (3.0% to 10.0% range), set default value to 5.5% cap rate, and aligned projected sales price calculations with professional real estate investment standards
- June 21, 2025. Implemented comprehensive multi-loan functionality in property modal Financing tab - added support for multiple loans per property with interest-only vs full amortization payment types, active loan designation system for debt service calculations, loan management features (add/edit/delete loans), automatic monthly payment calculations using proper loan formulas, and loan type classification (acquisition, refinance, construction, bridge) - active loan is used for all cash flow analysis throughout the property
- June 21, 2025. Enhanced 12-month proforma tab to use active loan debt service - added dedicated debt service column showing monthly payments from the active loan designated in financing tab, updated annual totals to reflect active loan payments, and integrated multi-loan system calculations for accurate cash flow projections throughout the proforma analysis
- June 21, 2025. Implemented intelligent auto-calculation logic for property modal fields - created SmartField component system that automatically determines which fields are editable vs calculated based on dependencies, added calculation breakdown modal with step-by-step formula explanations accessible via double-click, implemented real-time field recalculation when input values change, and established comprehensive field interaction rules across all property modal tabs (Overview, Rent Roll, Rehab Budget, Income & Expenses, Financing, Exit Analysis)
- June 21, 2025. Built comprehensive dashboard performance optimization system - implemented real-time updates with automatic cache invalidation every 30 seconds, added pagination system limiting property display to 20 items per page for improved performance, created keyboard shortcuts system (Ctrl+R refresh, Ctrl+/ help, Ctrl+1-4 navigation, Esc close modals), integrated contextual help tooltips throughout dashboard, enhanced error handling with specific retry mechanisms and detailed error states, added consistent loading indicators with skeleton states, implemented breadcrumb navigation for better user orientation, and created reusable UI components (LoadingState, ErrorHandler, Pagination, KeyboardShortcuts, Tooltip) - all enhancements maintain existing functionality while significantly improving user experience and application performance
- June 21, 2025. Implemented comprehensive KPI calculation transparency system - created KPICalculationModal component with detailed financial breakdowns, built comprehensive kpiCalculations utility with formulas for all metrics (Total AUM, Price/Unit, Cash Flow, Equity Multiple, Total Profits, etc.), implemented ClickableKPI components with double-click functionality to reveal calculation breakdowns, integrated across all dashboard pages (EntityDashboard, AssetManagement) while preserving original gradient design styling, added property-specific breakdowns using actual database data with component breakdowns and sub-calculations for enhanced financial transparency
- June 21, 2025. Implemented automatic cash flow population from Deal Analyzer 12-month proforma during property import - modified import function to use post-refinance debt service calculations instead of bridge loan terms, updated cash flow calculation to use NOI minus stabilized monthly debt service, enhanced dealAnalyzerData to store both monthly and annual cash flow values with complete calculation transparency, fixed property field mapping to store monthly cash flow in cashFlow field for accurate portfolio analytics
- June 21, 2025. Fixed property modal overview tab calculations to display correct cash flow and cash-on-cash return values - replaced complex calculation logic with simple database value usage, annual cash flow now properly converts monthly database value to annual (monthly × 12), cash-on-cash return uses stored database percentage, ensuring property modal displays accurate financial metrics matching portfolio analytics throughout dashboard
- June 21, 2025. Fixed income and expenses data import from Deal Analyzer to property modal - implemented proper data structure mapping where Deal Analyzer expense keys (propertyTax, capitalReserves, other) correctly map to property modal keys (taxes, capex, legalAccounting), added income structure calculation from rent roll data, ensuring both income and expenses display correctly in property modal Income & Expenses tab after Deal Analyzer import

## User Preferences

Preferred communication style: Simple, everyday language.