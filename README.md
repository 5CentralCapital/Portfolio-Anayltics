# 5Central Capital - Business Analytics Dashboard

A comprehensive web-based business analytics dashboard with secure authentication, real-time metrics, and advanced data visualization capabilities.

## Features

### 🔐 Security & Authentication
- JWT-based authentication with secure session management
- Role-based access control (admin, manager, viewer)
- Password hashing with bcrypt
- Rate limiting and security headers
- Audit logging for compliance

### 📊 Dashboard Components
- **Real-time KPI Metrics**: Revenue, expenses, profit margins, portfolio value
- **Financial Analytics**: Revenue trends, cash flow analysis, growth indicators
- **Property Portfolio**: Performance tracking, ROI analysis, equity creation
- **Customer Analytics**: Acquisition metrics, lifetime value, churn analysis
- **Interactive Charts**: Line charts, bar charts, scatter plots with Recharts

### 🏢 Real Estate Specific Features
- Property performance tracking
- Cash-on-cash return analysis
- Portfolio value monitoring
- Investor lead management
- Rental income tracking

### 📈 Data Visualization
- Interactive charts with hover tooltips
- Customizable date ranges
- Export functionality (CSV, JSON)
- Responsive design for mobile access
- Real-time data updates

### 🛠 Technical Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Recharts
- **Backend**: Node.js, Express, SQLite (development), JWT
- **Security**: Helmet, CORS, Rate Limiting, bcrypt
- **Database**: SQLite with migration support (easily portable to PostgreSQL/MySQL)

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd 5central-capital
```

2. **Install dependencies**
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

3. **Start the development servers**
```bash
# Start both frontend and backend
npm run dev:full

# Or start them separately:
# Frontend (port 5173)
npm run dev

# Backend (port 3001)
npm run dev:server
```

4. **Access the application**
- Website: http://localhost:5173
- Admin Login: http://localhost:5173/admin-login
- API: http://localhost:3001/api

### Default Admin Credentials
- **Email**: admin@5central.capital
- **Password**: admin123

## API Documentation

### Authentication Endpoints

#### POST /api/auth/login
Login with email and password
```json
{
  "email": "admin@5central.capital",
  "password": "admin123"
}
```

#### POST /api/auth/logout
Logout and invalidate session (requires authentication)

#### GET /api/auth/me
Get current user information (requires authentication)

#### POST /api/auth/change-password
Change user password (requires authentication)
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

### Analytics Endpoints

#### GET /api/analytics/dashboard
Get comprehensive dashboard metrics (requires authentication)

#### GET /api/analytics/revenue-trends?period=12
Get revenue trends for specified period (requires authentication)

#### GET /api/analytics/property-performance
Get property portfolio performance data (requires authentication)

#### GET /api/analytics/investor-leads
Get investor leads data (requires admin/manager role)

#### POST /api/analytics/metrics
Add new company metrics (requires admin/manager role)

#### GET /api/analytics/export/:type?format=csv
Export data in CSV or JSON format (requires admin/manager role)

## Database Schema

### Core Tables
- **users**: User accounts with role-based access
- **sessions**: Secure session management
- **company_metrics**: Financial KPIs and performance data
- **properties**: Real estate portfolio tracking
- **investor_leads**: Lead management and conversion tracking
- **audit_log**: Security and compliance logging

### Sample Data
The system includes sample data for demonstration:
- 12 months of financial metrics
- Property portfolio with real performance data
- Investor leads with various statuses
- User accounts with different roles

## Security Features

### Authentication & Authorization
- JWT tokens with configurable expiration
- Secure password hashing with bcrypt
- Role-based route protection
- Session invalidation on logout

### API Security
- Rate limiting (100 requests/15min general, 5 requests/15min auth)
- CORS configuration
- Security headers with Helmet
- Input validation and sanitization

### Data Protection
- Audit logging for all data modifications
- Secure database queries with parameterization
- Environment-based configuration
- Error handling without information leakage

## Deployment

### Environment Variables
Create a `.env` file in the server directory:
```env
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key
PORT=3001
DATABASE_URL=your-database-url
```

### Production Build
```bash
# Build frontend
npm run build

# Start production server
cd server
npm start
```

### Database Migration
For production, migrate from SQLite to PostgreSQL or MySQL:
1. Update database configuration in `server/config/database.js`
2. Run schema migration: `server/database/schema.sql`
3. Update connection strings and drivers

## Customization

### Adding New Metrics
1. Update database schema in `server/database/schema.sql`
2. Add API endpoints in `server/routes/analytics.js`
3. Create new chart components in `src/components/charts/`
4. Update dashboard pages to display new metrics

### Custom Charts
The system uses Recharts for visualization. Add new chart types:
1. Create component in `src/components/charts/`
2. Import and use in dashboard pages
3. Configure data formatting and styling

### Role Management
Modify roles in the database and update middleware:
1. Update role checks in `server/middleware/auth.js`
2. Add role-specific UI elements
3. Configure route protection

## Performance Optimization

### Database
- Indexed columns for fast queries
- Efficient data aggregation
- Connection pooling for production

### Frontend
- Lazy loading for dashboard components
- Memoized chart components
- Optimized bundle size with Vite

### Caching
- API response caching
- Static asset optimization
- Database query optimization

## Monitoring & Analytics

### Built-in Monitoring
- API health check endpoint: `/api/health`
- Error logging and tracking
- Performance metrics collection
- User activity audit trails

### External Integration
Ready for integration with:
- Google Analytics
- Application monitoring (New Relic, DataDog)
- Error tracking (Sentry)
- Business intelligence tools

## Support & Documentation

### API Testing
Use the included Postman collection or test with curl:
```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@5central.capital","password":"admin123"}'

# Get dashboard data
curl -X GET http://localhost:3001/api/analytics/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Development
- Hot reload for both frontend and backend
- TypeScript support with strict mode
- ESLint configuration for code quality
- Comprehensive error handling

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

For questions or support, contact: admin@5central.capital