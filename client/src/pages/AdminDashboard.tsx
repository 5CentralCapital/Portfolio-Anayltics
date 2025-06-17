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
  ArrowDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import RevenueChart from '../components/charts/RevenueChart';
import PropertyPerformanceChart from '../components/charts/PropertyPerformanceChart';

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
  const [revenueData, setRevenueData] = useState([]);
  const [propertyData, setPropertyData] = useState([]);
  const [investorLeads, setInvestorLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!apiService.isAuthenticated()) {
      navigate('/admin-login');
      return;
    }
    
    loadDashboardData();
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
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'financial', label: 'Financial', icon: DollarSign },
              { id: 'properties', label: 'Properties', icon: Building },
              { id: 'leads', label: 'Investor Leads', icon: Users },
              { id: 'reports', label: 'Reports', icon: PieChart },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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
        {activeTab === 'overview' && dashboardData && (
          <div className="space-y-8">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Revenue"
                value={formatCurrency(dashboardData.financial.revenue)}
                icon={DollarSign}
                trend={parseFloat(dashboardData.financial.revenueGrowth)}
                subtitle="This Month"
                color="green"
              />
              <MetricCard
                title="Portfolio Value"
                value={formatCurrency(dashboardData.portfolio.totalValue)}
                icon={Building}
                subtitle={`${dashboardData.portfolio.totalProperties} Properties`}
                color="blue"
              />
              <MetricCard
                title="Monthly Rent"
                value={formatCurrency(dashboardData.portfolio.monthlyRent)}
                icon={Home}
                subtitle={`${dashboardData.portfolio.totalUnits} Units`}
                color="purple"
              />
              <MetricCard
                title="Avg Cash-on-Cash"
                value={formatPercentage(dashboardData.portfolio.avgCashOnCash)}
                icon={TrendingUp}
                subtitle="Portfolio Average"
                color="orange"
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Revenue Trends</h3>
                  <div className="flex space-x-2">
                    <button className="text-sm text-gray-500 hover:text-gray-700">12M</button>
                    <button className="text-sm text-gray-500 hover:text-gray-700">6M</button>
                    <button className="text-sm text-primary font-medium">3M</button>
                  </div>
                </div>
                <RevenueChart data={revenueData} height={300} />
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Property Performance</h3>
                  <button className="text-sm text-primary hover:text-primary-dark">View All</button>
                </div>
                <PropertyPerformanceChart data={propertyData.slice(0, 6)} height={300} />
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
              <div className="space-y-4">
                {investorLeads.slice(0, 5).map((lead: any) => (
                  <div key={lead.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          New investor lead: {lead.first_name} {lead.last_name}
                        </p>
                        <p className="text-xs text-gray-500">{lead.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </p>
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        lead.status === 'new' ? 'bg-blue-100 text-blue-800' :
                        lead.status === 'qualified' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {lead.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'financial' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Financial Analytics</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleExport('metrics', 'csv')}
                  className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {dashboardData && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                  title="Revenue"
                  value={formatCurrency(dashboardData.financial.revenue)}
                  icon={DollarSign}
                  trend={parseFloat(dashboardData.financial.revenueGrowth)}
                  color="green"
                />
                <MetricCard
                  title="Expenses"
                  value={formatCurrency(dashboardData.financial.expenses)}
                  icon={TrendingUp}
                  color="red"
                />
                <MetricCard
                  title="Profit Margin"
                  value={formatPercentage(dashboardData.financial.profitMargin)}
                  icon={Target}
                  color="blue"
                />
              </div>
            )}

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Revenue vs Expenses</h3>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 text-sm bg-gray-100 rounded-lg">Line</button>
                  <button className="px-3 py-1 text-sm bg-primary text-white rounded-lg">Bar</button>
                </div>
              </div>
              <RevenueChart data={revenueData} type="bar" height={400} />
            </div>
          </div>
        )}

        {activeTab === 'properties' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Property Portfolio</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleExport('properties', 'csv')}
                  className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Cash-on-Cash Returns</h3>
                <PropertyPerformanceChart data={propertyData} type="returns" height={350} />
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Equity Created</h3>
                <PropertyPerformanceChart data={propertyData} type="equity" height={350} />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Scatter Plot</h3>
              <PropertyPerformanceChart data={propertyData} type="scatter" height={400} />
            </div>
          </div>
        )}

        {activeTab === 'leads' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Investor Leads</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleExport('leads', 'csv')}
                  className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Leads</h3>
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search leads..."
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Investment Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Source
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {investorLeads.map((lead: any) => (
                      <tr key={lead.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {lead.first_name} {lead.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{lead.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {lead.investment_amount ? formatCurrency(lead.investment_amount) : 'Not specified'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            lead.status === 'new' ? 'bg-blue-100 text-blue-800' :
                            lead.status === 'qualified' ? 'bg-green-100 text-green-800' :
                            lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {lead.source || 'Website'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(lead.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button className="text-primary hover:text-primary-dark">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="text-gray-400 hover:text-gray-600">
                              <Edit className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
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