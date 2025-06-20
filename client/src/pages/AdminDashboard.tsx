import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Building, 
  DollarSign, 
  Users, 
  Calendar,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Filter,
  Search,
  RefreshCw,
  LogOut,
  Settings,
  Home,
  PieChart,
  Activity,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUp,
  ArrowDown,
  Calculator,
  MapPin
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import RevenueChart from '../components/charts/RevenueChart';
import PropertyPerformanceChart from '../components/charts/PropertyPerformanceChart';
import DealAnalyzer from './DealAnalyzer';
import EntityDashboard from './EntityDashboard';
import FinancialDashboard from './FinancialDashboard';
import AssetManagement from './AssetManagement';
import NetWorthTracker from './NetWorthTracker';
import OnboardingTour from '../components/OnboardingTour';

interface DashboardData {
  financial: {
    revenue: number;
    expenses: number;
    profit: number;
    profitMargin: number;
    revenueGrowth: number;
    monthlyRecurringRevenue: number;
  };
  portfolio: {
    totalProperties: number;
    totalUnits: number;
    totalValue: number;
    monthlyRent: number;
    avgCashOnCash: number;
    avgAnnualizedReturn: number;
  };
  customers: {
    total: number;
    active: number;
    averageValue: number;
    acquisitionCost: number;
    lifetimeValue: number;
    churnRate: number;
  };
  lastUpdated: string;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(apiService.getStoredUser());
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [propertyData, setPropertyData] = useState<any[]>([]);
  const [investorLeads, setInvestorLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshing, setRefreshing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!apiService.isAuthenticated()) {
      navigate('/admin-login');
      return;
    }
    
    loadDashboardData();
    
    // Check if user has completed onboarding
    const hasCompletedOnboarding = localStorage.getItem('onboarding_completed') === 'true';
    if (!hasCompletedOnboarding) {
      // Delay showing onboarding to let the dashboard load
      setTimeout(() => {
        setShowOnboarding(true);
      }, 1000);
    }
  }, [navigate]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [dashboardRes, revenueRes, propertyRes, leadsRes] = await Promise.all([
        apiService.getDashboardData(),
        apiService.getRevenueTrends('12'),
        apiService.getPropertyPerformance(),
        apiService.getInvestorLeads()
      ]);

      if (dashboardRes.error) throw new Error(dashboardRes.error);
      if (revenueRes.error) throw new Error(revenueRes.error);
      if (propertyRes.error) throw new Error(propertyRes.error);
      if (leadsRes.error) throw new Error(leadsRes.error);

      setDashboardData(dashboardRes.data);
      setRevenueData(revenueRes.data || []);
      setPropertyData(propertyRes.data || []);
      setInvestorLeads(leadsRes.data || []);
      setRetryCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      setRetryCount(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    try {
      await apiService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
    navigate('/');
  };

  const handleExport = async (type: string, format: string = 'csv') => {
    try {
      const result = await apiService.exportData(type, format);
      if (result.error) {
        setError(`Failed to export ${type} data: ${result.error}`);
      }
    } catch (err) {
      setError(`Failed to export ${type} data`);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const MetricCard: React.FC<{
    title: string;
    value: string;
    icon: React.ElementType;
    trend?: number;
    subtitle?: string;
    color?: string;
  }> = ({ title, value, icon: Icon, trend, subtitle, color = 'primary' }) => {
    const colorClasses = {
      primary: 'bg-primary text-white',
      green: 'bg-green-600 text-white',
      blue: 'bg-blue-600 text-white',
      purple: 'bg-purple-600 text-white',
      orange: 'bg-orange-600 text-white',
      red: 'bg-red-600 text-white'
    };

    return (
      <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color as keyof typeof colorClasses]}`}>
            <Icon className="h-6 w-6" />
          </div>
          {trend !== undefined && (
            <div className={`flex items-center text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? <ArrowUp className="h-4 w-4 mr-1" /> : <ArrowDown className="h-4 w-4 mr-1" />}
              {Math.abs(trend).toFixed(1)}%
            </div>
          )}
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Building className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">5Central Capital</h1>
                <p className="text-sm text-gray-500">Analytics Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                title="Refresh Data"
              >
                <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Welcome, {user?.first_name}</span>
                <span className="px-2 py-1 bg-primary text-white text-xs rounded-full">
                  {user?.role}
                </span>
              </div>
              
              <button
                onClick={() => navigate('/')}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                title="Back to Website"
              >
                <Home className="h-5 w-5" />
              </button>
              
              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b" data-tour="navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Users },
              { id: 'properties', label: 'Asset Management', icon: Building },
              { id: 'deal-analyzer', label: 'Deal Analyzer', icon: Calculator },
              { id: 'roadmap', label: 'Roadmap', icon: MapPin },
              { id: 'net-worth', label: 'Net Worth', icon: DollarSign },
              { id: 'reports', label: 'Reports', icon: PieChart },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                data-tour={tab.id === 'properties' ? 'asset-management-tab' : tab.id === 'deal-analyzer' ? 'deal-analyzer-tab' : undefined}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div data-tour="dashboard">
            <EntityDashboard />
          </div>
        )}

        {activeTab === 'properties' && (
          <AssetManagement />
        )}

        {activeTab === 'deal-analyzer' && (
          <DealAnalyzer />
        )}

        {activeTab === 'roadmap' && (
          <div className="space-y-8">
            <div className="text-center py-16">
              <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Roadmap</h2>
              <p className="text-xl text-gray-600 mb-8">Coming Soon</p>
              <div className="max-w-2xl mx-auto">
                <p className="text-gray-500 mb-6">
                  We're building exciting new features to enhance your real estate investment management experience.
                </p>
                <div className="bg-white rounded-xl shadow-lg p-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Features</h3>
                  <div className="space-y-3 text-left">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-700">Advanced portfolio analytics and projections</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-700">Automated rent collection tracking</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-700">Tenant and lease management</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-700">Market analysis and comps integration</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-700">Tax optimization strategies and reporting</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-700">Investor portal and communication tools</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'net-worth' && (
          <NetWorthTracker />
        )}

        {activeTab === 'reports' && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <BarChart3 className="h-8 w-8 text-primary" />
                  <h3 className="text-lg font-semibold text-gray-900">Financial Report</h3>
                </div>
                <p className="text-gray-600 mb-4">Comprehensive financial performance analysis</p>
                <button
                  onClick={() => handleExport('metrics', 'csv')}
                  className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors"
                >
                  Generate Report
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Building className="h-8 w-8 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Portfolio Report</h3>
                </div>
                <p className="text-gray-600 mb-4">Detailed property performance metrics</p>
                <button
                  onClick={() => handleExport('properties', 'csv')}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Generate Report
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Users className="h-8 w-8 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Investor Report</h3>
                </div>
                <p className="text-gray-600 mb-4">Lead generation and conversion analysis</p>
                <button
                  onClick={() => handleExport('leads', 'csv')}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Generate Report
                </button>
              </div>
            </div>
          </div>
        )}



        
      </main>
    </div>
  );
};

export default AdminDashboard;