import { useState, useEffect } from 'react';
import { 
  Building, 
  DollarSign, 
  Users, 
  Target, 
  TrendingUp, 
  Calendar,
  CheckCircle,
  Clock,
  Edit3,
  Download,
  Upload,
  Plus,
  X,
  FileText,
  Percent,
  Home,
  Calculator,
  PieChart,
  Banknote,
  AlertCircle,
  CheckSquare
} from 'lucide-react';

interface Property {
  id: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  units: number;
  purchasePrice: number;
  purchaseDate: string;
  rehabCosts: number;
  totalInvestment: number;
  currentValue: number;
  grossRent: number;
  netRent: number;
  expenses: number;
  noi: number;
  cashFlow: number;
  capRate: number;
  cocReturn: number;
  annualizedReturn: number;
  equityCreated: number;
  status: 'Active' | 'Sold' | 'Under Contract' | 'Rehab';
  propertyType: 'Multifamily' | 'Single Family' | 'Commercial';
  strategy: 'Buy & Hold' | 'Fix & Flip' | 'BRRRR' | 'Value-Add';
}

interface EntityMember {
  id: number;
  name: string;
  ownershipPercent: number;
  accessLevel: 'Admin' | 'Manager' | 'Viewer';
  joinDate: string;
  contactInfo: string;
}

interface Milestone {
  id: number;
  title: string;
  dueDate: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
  assignee: string;
  priority: 'High' | 'Medium' | 'Low';
}

interface ToDoTask {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  assignee: string;
  category: 'Compliance' | 'Financial' | 'Member' | 'Property';
}

interface EditableFieldProps {
  value: number;
  onSave: (value: number) => void;
  format?: 'currency' | 'percentage' | 'number';
  className?: string;
}

const EditableField = ({ value, onSave, format = 'currency', className = '' }: EditableFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const formatValue = (val: number) => {
    if (format === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(val || 0);
    } else if (format === 'percentage') {
      return new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }).format(val || 0);
    }
    return val?.toLocaleString() || '0';
  };

  if (!isEditing) {
    return (
      <span 
        className={`cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded ${className}`}
        onClick={() => setIsEditing(true)}
      >
        {formatValue(value)}
      </span>
    );
  }

  return (
    <input
      type="number"
      value={editValue}
      onChange={(e) => setEditValue(parseFloat(e.target.value) || 0)}
      onBlur={() => {
        onSave(editValue);
        setIsEditing(false);
      }}
      onKeyPress={(e) => {
        if (e.key === 'Enter') {
          onSave(editValue);
          setIsEditing(false);
        }
      }}
      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
      autoFocus
    />
  );
};

export default function EntityDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'owner' | 'financials' | 'members' | 'compliance' | 'properties'>('overview');
  const [properties] = useState<Property[]>([
    {
      id: 1,
      address: '1 Harmony St',
      city: 'New Bedford',
      state: 'MA',
      zipCode: '02740',
      units: 3,
      purchasePrice: 270000,
      purchaseDate: '2023-06-15',
      rehabCosts: 45000,
      totalInvestment: 315000,
      currentValue: 450000,
      grossRent: 2850,
      netRent: 2707,
      expenses: 950,
      noi: 1757,
      cashFlow: 1200,
      capRate: 0.047,
      cocReturn: 0.458,
      annualizedReturn: 0.52,
      equityCreated: 135000,
      status: 'Active',
      propertyType: 'Multifamily',
      strategy: 'BRRRR'
    },
    {
      id: 2,
      address: '3408 E Dr MLK BLVD',
      city: 'New Bedford',
      state: 'MA',
      zipCode: '02746',
      units: 2,
      purchasePrice: 180000,
      purchaseDate: '2023-08-22',
      rehabCosts: 35000,
      totalInvestment: 215000,
      currentValue: 320000,
      grossRent: 1800,
      netRent: 1710,
      expenses: 600,
      noi: 1110,
      cashFlow: 750,
      capRate: 0.042,
      cocReturn: 0.419,
      annualizedReturn: 0.465,
      equityCreated: 105000,
      status: 'Active',
      propertyType: 'Multifamily',
      strategy: 'Buy & Hold'
    },
    {
      id: 3,
      address: '157 Crystal Ave',
      city: 'New Bedford',
      state: 'MA',
      zipCode: '02744',
      units: 4,
      purchasePrice: 320000,
      purchaseDate: '2023-09-10',
      rehabCosts: 60000,
      totalInvestment: 380000,
      currentValue: 520000,
      grossRent: 3200,
      netRent: 3040,
      expenses: 1200,
      noi: 1840,
      cashFlow: 1400,
      capRate: 0.042,
      cocReturn: 0.442,
      annualizedReturn: 0.484,
      equityCreated: 140000,
      status: 'Active',
      propertyType: 'Multifamily',
      strategy: 'BRRRR'
    },
    {
      id: 4,
      address: '175 Crystal Ave',
      city: 'New Bedford',
      state: 'MA',
      zipCode: '02744',
      units: 6,
      purchasePrice: 450000,
      purchaseDate: '2023-11-05',
      rehabCosts: 85000,
      totalInvestment: 535000,
      currentValue: 720000,
      grossRent: 4800,
      netRent: 4560,
      expenses: 1800,
      noi: 2760,
      cashFlow: 2100,
      capRate: 0.046,
      cocReturn: 0.471,
      annualizedReturn: 0.515,
      equityCreated: 185000,
      status: 'Active',
      propertyType: 'Multifamily',
      strategy: 'Value-Add'
    },
    {
      id: 5,
      address: '52 Summit Ave',
      city: 'New Bedford',
      state: 'MA',
      zipCode: '02740',
      units: 8,
      purchasePrice: 680000,
      purchaseDate: '2024-01-18',
      rehabCosts: 120000,
      totalInvestment: 800000,
      currentValue: 1050000,
      grossRent: 7200,
      netRent: 6840,
      expenses: 2400,
      noi: 4440,
      cashFlow: 3300,
      capRate: 0.051,
      cocReturn: 0.495,
      annualizedReturn: 0.555,
      equityCreated: 250000,
      status: 'Active',
      propertyType: 'Multifamily',
      strategy: 'BRRRR'
    }
  ]);

  const [entityMembers] = useState<EntityMember[]>([
    {
      id: 1,
      name: 'Marcus Johnson',
      ownershipPercent: 0.65,
      accessLevel: 'Admin',
      joinDate: '2023-01-01',
      contactInfo: 'marcus@5centralcapital.com'
    },
    {
      id: 2,
      name: 'Sarah Davis',
      ownershipPercent: 0.25,
      accessLevel: 'Manager',
      joinDate: '2023-03-15',
      contactInfo: 'sarah@5centralcapital.com'
    },
    {
      id: 3,
      name: 'Investment Partner LLC',
      ownershipPercent: 0.10,
      accessLevel: 'Viewer',
      joinDate: '2023-06-01',
      contactInfo: 'partners@investment.com'
    }
  ]);

  const [milestones] = useState<Milestone[]>([
    {
      id: 1,
      title: 'Q4 Tax Filing',
      dueDate: '2025-01-15',
      status: 'Pending',
      assignee: 'Marcus Johnson',
      priority: 'High'
    },
    {
      id: 2,
      title: 'Annual Member Meeting',
      dueDate: '2025-02-28',
      status: 'In Progress',
      assignee: 'Sarah Davis',
      priority: 'Medium'
    },
    {
      id: 3,
      title: 'Property Insurance Renewal',
      dueDate: '2025-03-01',
      status: 'Pending',
      assignee: 'Marcus Johnson',
      priority: 'High'
    }
  ]);

  const [todoTasks] = useState<ToDoTask[]>([
    {
      id: 1,
      title: 'Update rent roll for Q4',
      description: 'Collect and verify all rental income data',
      dueDate: '2025-01-05',
      status: 'In Progress',
      assignee: 'Sarah Davis',
      category: 'Financial'
    },
    {
      id: 2,
      title: 'File LLC Annual Report',
      description: 'Submit state compliance documentation',
      dueDate: '2025-01-10',
      status: 'Pending',
      assignee: 'Marcus Johnson',
      category: 'Compliance'
    },
    {
      id: 3,
      title: 'Schedule property inspections',
      description: 'Coordinate quarterly property assessments',
      dueDate: '2025-01-20',
      status: 'Pending',
      assignee: 'Sarah Davis',
      category: 'Property'
    }
  ]);

  const [cashBalance, setCashBalance] = useState(850000);
  const [entityData, setEntityData] = useState({
    name: '5Central Capital LLC',
    formationDate: '2023-01-01',
    structure: 'Limited Liability Company',
    taxStatus: 'Pass-through',
    state: 'Massachusetts',
    ein: '12-3456789'
  });

  // Calculate portfolio metrics from properties
  const calculateMetrics = () => {
    const totalAUM = properties.reduce((sum, prop) => sum + prop.currentValue, 0);
    const totalUnits = properties.reduce((sum, prop) => sum + prop.units, 0);
    const totalProperties = properties.length;
    const pricePerUnit = totalAUM / totalUnits;
    const totalInvestment = properties.reduce((sum, prop) => sum + prop.totalInvestment, 0);
    const totalEquityCreated = properties.reduce((sum, prop) => sum + prop.equityCreated, 0);
    const avgEquityMultiple = totalAUM / totalInvestment;
    const monthlyCashFlow = properties.reduce((sum, prop) => sum + prop.cashFlow, 0);
    
    const totalDebt = totalInvestment * 0.7; // Assume 70% LTV
    const totalEquity = totalAUM - totalDebt;
    const totalRevenue = properties.reduce((sum, prop) => sum + (prop.grossRent * 12), 0);
    const totalExpenses = properties.reduce((sum, prop) => sum + (prop.expenses * 12), 0);
    const noi = totalRevenue - totalExpenses;
    const dscr = noi / (totalDebt * 0.045); // Assume 4.5% interest rate
    const roi = totalEquityCreated / totalInvestment;

    return {
      totalAUM,
      pricePerUnit,
      totalUnits,
      totalProperties,
      avgEquityMultiple,
      monthlyCashFlow,
      totalDebt,
      totalEquity,
      totalRevenue,
      totalExpenses,
      noi,
      dscr,
      roi
    };
  };

  const metrics = calculateMetrics();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const formatPercent = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value || 0);
  };

  const formatCompact = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return formatCurrency(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'In Progress': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'Pending': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'Overdue': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-red-600';
      case 'Medium': return 'text-yellow-600';
      case 'Low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Entity Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">5Central Capital LLC - Portfolio & Entity Management</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </button>
          <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <FileText className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Top Metric Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">AUM</p>
              <p className="text-2xl font-bold text-blue-600">{formatCompact(metrics.totalAUM)}</p>
            </div>
            <Building className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Price/Unit</p>
              <p className="text-2xl font-bold text-green-600">{formatCompact(metrics.pricePerUnit)}</p>
            </div>
            <Home className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Units</p>
              <p className="text-2xl font-bold text-purple-600">{metrics.totalUnits}</p>
            </div>
            <Users className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Properties</p>
              <p className="text-2xl font-bold text-orange-600">{metrics.totalProperties}</p>
            </div>
            <Target className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Equity Multiple</p>
              <p className="text-2xl font-bold text-red-600">{metrics.avgEquityMultiple.toFixed(1)}x</p>
            </div>
            <TrendingUp className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Cash Flow</p>
              <p className="text-2xl font-bold text-teal-600">{formatCompact(metrics.monthlyCashFlow)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-teal-600" />
          </div>
        </div>
      </div>

      {/* Top Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash Balance & Milestones */}
        <div className="space-y-6">
          {/* Cash Balance Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cash Balance</h3>
              <Banknote className="h-6 w-6 text-green-600" />
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Cash on Hand</p>
                <EditableField
                  value={cashBalance}
                  onSave={(value) => setCashBalance(value)}
                  className="text-3xl font-bold text-green-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Operating Account</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(cashBalance * 0.3)}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Reserve Fund</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(cashBalance * 0.7)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Milestones */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Milestones</h3>
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="space-y-3">
              {milestones.slice(0, 3).map((milestone) => (
                <div key={milestone.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{milestone.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{milestone.dueDate}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(milestone.priority)}`}>
                      {milestone.priority}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(milestone.status)}`}>
                      {milestone.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* To-Do List Widget */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">To-Do List</h3>
            <div className="flex items-center space-x-2">
              <CheckSquare className="h-6 w-6 text-orange-600" />
              <button className="text-blue-600 hover:text-blue-700">
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {todoTasks.map((task) => (
              <div key={task.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  {task.status === 'Completed' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white">{task.title}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{task.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      <span>{task.category}</span> • <span>{task.dueDate}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Entity KPIs Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Entity KPIs</h3>
          </div>
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: Building },
              { id: 'owner', label: 'Owner', icon: Users },
              { id: 'financials', label: 'Financials', icon: DollarSign },
              { id: 'members', label: 'Members', icon: Users },
              { id: 'compliance', label: 'Compliance', icon: CheckCircle },
              { id: 'properties', label: 'Properties', icon: Home }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Entity Details</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Entity Name</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{entityData.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Formation Date</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{entityData.formationDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Structure</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{entityData.structure}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Tax Status</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{entityData.taxStatus}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Portfolio Value</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
                    <EditableField
                      value={metrics.totalAUM}
                      onSave={(value) => {}}
                      className="text-lg font-bold text-blue-600"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Debt</p>
                    <EditableField
                      value={metrics.totalDebt}
                      onSave={(value) => {}}
                      className="text-lg font-bold text-red-600"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Equity</p>
                    <EditableField
                      value={metrics.totalEquity}
                      onSave={(value) => {}}
                      className="text-lg font-bold text-green-600"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Key Metrics</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Properties</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{metrics.totalProperties}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Units</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{metrics.totalUnits}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Equity Multiple</p>
                    <p className="text-lg font-bold text-purple-600">{metrics.avgEquityMultiple.toFixed(2)}x</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'financials' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue & Expenses</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Total Revenue</span>
                    <EditableField
                      value={metrics.totalRevenue}
                      onSave={(value) => {}}
                      className="font-semibold text-green-600"
                    />
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Total Expenses</span>
                    <EditableField
                      value={metrics.totalExpenses}
                      onSave={(value) => {}}
                      className="font-semibold text-red-600"
                    />
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Net Operating Income</span>
                    <EditableField
                      value={metrics.noi}
                      onSave={(value) => {}}
                      className="font-bold text-blue-600"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Ratios</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">DSCR</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{metrics.dscr.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">ROI</span>
                    <span className="font-semibold text-green-600">{formatPercent(metrics.roi)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Monthly Cash Flow</span>
                    <span className="font-bold text-blue-600">{formatCurrency(metrics.monthlyCashFlow)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Entity Members</h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Name</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">Ownership %</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">Access Level</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">Join Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Contact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entityMembers.map((member) => (
                      <tr key={member.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900 dark:text-white">{member.name}</div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-semibold text-blue-600">{formatPercent(member.ownershipPercent)}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            member.accessLevel === 'Admin' ? 'text-red-600 bg-red-100 dark:bg-red-900/20' :
                            member.accessLevel === 'Manager' ? 'text-blue-600 bg-blue-100 dark:bg-blue-900/20' :
                            'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
                          }`}>
                            {member.accessLevel}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-gray-600 dark:text-gray-400">
                          {member.joinDate}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {member.contactInfo}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'properties' && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Property Portfolio</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {properties.map((property) => (
                  <div key={property.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-semibold text-gray-900 dark:text-white">{property.address}</h5>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(property.status)}`}>
                        {property.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{property.city}, {property.state}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Units:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{property.units}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Current Value:</span>
                        <span className="font-semibold text-blue-600">{formatCurrency(property.currentValue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Monthly Rent:</span>
                        <span className="font-semibold text-green-600">{formatCurrency(property.grossRent)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Cash Flow:</span>
                        <span className="font-semibold text-purple-600">{formatCurrency(property.cashFlow)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'compliance' && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Compliance & Deadlines</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-3">Upcoming Deadlines</h5>
                  <div className="space-y-3">
                    {milestones.map((milestone) => (
                      <div key={milestone.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{milestone.title}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{milestone.assignee} • {milestone.dueDate}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(milestone.priority)}`}>
                            {milestone.priority}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(milestone.status)}`}>
                            {milestone.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-3">Entity Information</h5>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">State of Formation</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{entityData.state}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">EIN</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{entityData.ein}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Tax Status</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{entityData.taxStatus}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}