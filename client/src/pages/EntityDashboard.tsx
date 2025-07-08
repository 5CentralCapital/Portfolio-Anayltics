import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiService from '../services/api';
import BankAccountManager from '../components/BankAccountManager';
import { useCalculations } from '../contexts/CalculationsContext';
import { 
  Building, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Calendar,
  CheckCircle,
  Plus,
  X,
  FileText,
  Home,
  Calculator,
  PieChart,
  Banknote,
  CheckSquare
} from 'lucide-react';

interface Property {
  id: number;
  status: string;
  apartments: number;
  address: string;
  city: string;
  state: string;
  zipCode?: string;
  entity?: string;
  acquisitionDate?: string;
  acquisitionPrice: string;
  rehabCosts: string;
  arvAtTimePurchased?: string;
  initialCapitalRequired: string;
  cashFlow: string;
  salePrice?: string;
  salePoints?: string;
  totalProfits: string;
  yearsHeld?: string;
  cashOnCashReturn: string;
  annualizedReturn: string;
  dealAnalyzerData?: string;
}

// Removed local calculatePropertyMetrics - now using centralized calculation service


interface EntityMember {
  id: number;
  userId: number;
  name: string;
  email: string;
  role: 'owner' | 'manager' | 'member';
  equityPercentage: number;
  joinedAt: string;
}

interface ComplianceItem {
  id: number;
  complianceType: string;
  status: 'pending' | 'completed' | 'overdue' | 'not_required';
  dueDate?: string;
  completedDate?: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface Milestone {
  id: number;
  title: string;
  completed: boolean;
  targetDate: string;
  description: string;
}

interface TodoItem {
  id: number;
  task: string;
  completed: boolean;
  priority: 'Low' | 'Medium' | 'High';
}

const EditableValue = ({ 
  value, 
  onSave, 
  format = 'currency',
  className = '' 
}: { 
  value: number; 
  onSave: (newValue: number) => void; 
  format?: 'currency' | 'percentage' | 'number';
  className?: string;
}) => {
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
  const { calculatePropertyKPIs, calculatePortfolioMetrics, formatCurrency, formatPercentage } = useCalculations();
  const [userEntities, setUserEntities] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [selectedPropertyModal, setSelectedPropertyModal] = useState<Property | null>(null);
  const [activeFinancialTab, setActiveFinancialTab] = useState<Record<string, string>>({});

  // Get current user
  useEffect(() => {
    const user = apiService.getStoredUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  }, []);

  // Fetch user's entities
  const { data: userEntityData, isLoading: entitiesLoading } = useQuery({
    queryKey: ['/api/user', currentUserId, 'entities'],
    queryFn: () => currentUserId ? apiService.getUserEntities(currentUserId) : Promise.resolve({ data: [] }),
    enabled: !!currentUserId
  });

  // Fetch user's properties
  const { data: allProperties = [], isLoading } = useQuery({
    queryKey: ['/api/properties'],
    queryFn: () => apiService.getProperties(),
    enabled: !!currentUserId
  });

  // Set user entities when data loads
  useEffect(() => {
    if (userEntityData?.data && Array.isArray(userEntityData.data)) {
      const entityNames = userEntityData.data.map((entity: any) => entity.entityName);
      setUserEntities(entityNames);
    }
  }, [userEntityData]);

  // All properties for collective KPIs (only user's properties)
  const properties: Property[] = Array.isArray(allProperties?.data) ? allProperties.data : 
    Array.isArray(allProperties) ? allProperties : [];

  // Properties grouped by user's entities only
  const propertiesByEntity = userEntities.reduce((acc, entity) => {
    acc[entity] = properties.filter(prop => prop.entity === entity);
    return acc;
  }, {} as Record<string, Property[]>);

  // Active tabs for each entity (only user's entities)
  const [activeTabs, setActiveTabs] = useState<Record<string, 'overview' | 'financials' | 'members' | 'compliance' | 'properties'>>({});

  // Update active tabs when user entities change
  useEffect(() => {
    const newActiveTabs = userEntities.reduce((acc, entity) => {
      acc[entity] = 'overview';
      return acc;
    }, {} as Record<string, 'overview' | 'financials' | 'members' | 'compliance' | 'properties'>);
    setActiveTabs(newActiveTabs);
  }, [userEntities]);

  // Placeholder entity members data
  const entityMembers: Record<string, EntityMember[]> = {
    '5Central Capital': [
      { id: 1, userId: 1, name: 'John Smith', email: 'john@example.com', role: 'owner', equityPercentage: 75, joinedAt: '2023-01-15' },
      { id: 2, userId: 2, name: 'Sarah Johnson', email: 'sarah@example.com', role: 'manager', equityPercentage: 20, joinedAt: '2023-06-20' },
      { id: 3, userId: 3, name: 'Mike Davis', email: 'mike@example.com', role: 'member', equityPercentage: 5, joinedAt: '2024-02-10' }
    ],
    'The House Doctors': [
      { id: 4, userId: 1, name: 'John Smith', email: 'john@example.com', role: 'owner', equityPercentage: 60, joinedAt: '2023-03-22' },
      { id: 5, userId: 4, name: 'Lisa Wong', email: 'lisa@example.com', role: 'member', equityPercentage: 40, joinedAt: '2023-07-15' }
    ],
    'Arcadia Vision Group': [
      { id: 6, userId: 2, name: 'Sarah Johnson', email: 'sarah@example.com', role: 'owner', equityPercentage: 80, joinedAt: '2023-05-10' },
      { id: 7, userId: 5, name: 'Tom Wilson', email: 'tom@example.com', role: 'member', equityPercentage: 20, joinedAt: '2023-11-05' }
    ]
  };

  // Placeholder compliance data
  const entityCompliance: Record<string, ComplianceItem[]> = {
    '5Central Capital': [
      { id: 1, complianceType: 'Annual Tax Filing', status: 'completed', dueDate: '2025-03-15', completedDate: '2025-02-28', description: 'Federal and state tax returns filed', priority: 'high' },
      { id: 2, complianceType: 'Operating Agreement Update', status: 'pending', dueDate: '2025-06-30', description: 'Annual review and update of operating agreement', priority: 'medium' },
      { id: 3, complianceType: 'State Registration Renewal', status: 'overdue', dueDate: '2025-01-31', description: 'Annual state business registration renewal', priority: 'critical' },
      { id: 4, complianceType: 'Insurance Policy Review', status: 'pending', dueDate: '2025-08-15', description: 'Annual review of liability and property insurance', priority: 'medium' }
    ],
    'The House Doctors': [
      { id: 5, complianceType: 'Annual Tax Filing', status: 'pending', dueDate: '2025-03-15', description: 'Federal and state tax returns', priority: 'high' },
      { id: 6, complianceType: 'Member Meeting Minutes', status: 'completed', dueDate: '2025-01-15', completedDate: '2025-01-10', description: 'Annual member meeting documentation', priority: 'low' },
      { id: 7, complianceType: 'Financial Audit', status: 'pending', dueDate: '2025-04-30', description: 'Annual financial audit by CPA', priority: 'high' }
    ],
    'Arcadia Vision Group': [
      { id: 8, complianceType: 'Annual Tax Filing', status: 'pending', dueDate: '2025-03-15', description: 'Federal and state tax returns', priority: 'high' },
      { id: 9, complianceType: 'Property Management Agreement', status: 'completed', dueDate: '2025-01-01', completedDate: '2024-12-15', description: 'Annual property management contract renewal', priority: 'medium' },
      { id: 10, complianceType: 'Entity Registration', status: 'pending', dueDate: '2025-07-20', description: 'State entity registration renewal', priority: 'medium' }
    ]
  };

  // State for editable components
  const [milestones, setMilestones] = useState<Milestone[]>([
    { id: 1, title: 'Acquire 50 Units', completed: false, targetDate: '2025-12-31', description: 'Expand portfolio to 50 total units' },
    { id: 2, title: 'Reach $10M AUM', completed: false, targetDate: '2025-06-30', description: 'Assets under management target' },
    { id: 3, title: 'Establish Fund I', completed: false, targetDate: '2025-09-30', description: 'Launch first institutional fund' }
  ]);

  const [todos, setTodos] = useState<TodoItem[]>([
    { id: 1, task: 'Review Q1 property performance', completed: false, priority: 'High' },
    { id: 2, task: 'Update investor deck', completed: true, priority: 'Medium' },
    { id: 3, task: 'Schedule property inspections', completed: false, priority: 'Medium' },
    { id: 4, task: 'File quarterly tax returns', completed: false, priority: 'High' }
  ]);

  const [cashBalance, setCashBalance] = useState(450000);

  // Removed local helper functions - now using centralized calculation service

  // Calculate collective metrics for all entities - match Asset Management exactly
  const collectiveMetrics = {
    totalUnits: Array.isArray(properties) ? properties.reduce((sum: number, prop: Property) => sum + (prop.apartments || 0), 0) : 0,

    // AUM = Total ARV of all properties owned
    totalAUM: Array.isArray(properties) ? properties.reduce((sum: number, prop: Property) => {
      const arv = parseFloat((prop.arvAtTimePurchased || '0').toString().replace(/[^0-9.-]/g, ''));
      return sum + (isNaN(arv) ? 0 : arv);
    }, 0) : 0,

    // Total Equity = AUM - current debt (calculate debt from Deal Analyzer data)
    totalEquity: (() => {
      if (!Array.isArray(properties)) return 0;

      let totalAUM = 0;
      let totalDebt = 0;

      properties.forEach((prop: Property) => {
        const arv = parseFloat((prop.arvAtTimePurchased || '0').toString().replace(/[^0-9.-]/g, ''));
        totalAUM += isNaN(arv) ? 0 : arv;

        // Calculate current debt from Deal Analyzer data
        if (prop.dealAnalyzerData) {
          try {
            const dealData = JSON.parse(prop.dealAnalyzerData);
            const loans = dealData?.loans || [];

            // Find active loan or calculate from assumptions
            const activeLoan = loans.find((loan: any) => loan.isActive);
            if (activeLoan) {
              totalDebt += activeLoan.loanAmount || 0;
            } else if (dealData?.assumptions) {
              // Use assumption-based calculation for current debt
              const loanPercentage = dealData.assumptions.loanPercentage || 0;
              const purchasePrice = parseFloat(prop.acquisitionPrice || '0');
              const rehabCosts = parseFloat(prop.rehabCosts || '0');
              totalDebt += (purchasePrice + rehabCosts) * loanPercentage;
            }
          } catch (e) {
            // If parsing fails, don't assume debt
            // Debt information should come from actual data
          }
        }
      });

      return totalAUM - totalDebt;
    })(),

    // Current Monthly Income = Sum of all monthly cash flows from cashflowing properties
    currentMonthlyIncome: Array.isArray(properties) ? properties
      .filter((prop: Property) => prop.status === 'Cashflowing')
      .reduce((sum: number, prop: Property) => {
        const cashFlow = parseFloat((prop.cashFlow || '0').toString().replace(/[^0-9.-]/g, ''));
        return sum + (isNaN(cashFlow) ? 0 : cashFlow);
      }, 0) : 0,

    // Price/Unit = AUM / Total Units
    pricePerUnit: (() => {
      if (!Array.isArray(properties) || properties.length === 0) return 0;
      const totalAUM = properties.reduce((sum: number, prop: Property) => {
        const arv = parseFloat((prop.arvAtTimePurchased || '0').toString().replace(/[^0-9.-]/g, ''));
        return sum + (isNaN(arv) ? 0 : arv);
      }, 0);
      const totalUnits = properties.reduce((sum: number, prop: Property) => sum + (prop.apartments || 0), 0);
      return totalUnits > 0 ? totalAUM / totalUnits : 0;
    })(),

    // Average Equity Multiple using calculatePropertyMetrics function
    avgEquityMultiple: (() => {
      if (!Array.isArray(properties) || properties.length === 0) return 0;

      let totalEquityMultiple = 0;
      let propertiesWithMetrics = 0;

      properties.forEach((prop: Property) => {
        const metrics = calculatePropertyKPIs(prop);
        if (metrics && metrics.acquisitionPrice > 0) {
          const allInCost = metrics.acquisitionPrice + metrics.totalRehab + metrics.closingCosts + metrics.holdingCosts;
          const arv = parseFloat(prop.arvAtTimePurchased || '0');
          const cashCollected = parseFloat(prop.totalProfits || '0');
          const capitalRequired = metrics.capitalRequired || 0; // Use calculated capital from centralized service

          if (capitalRequired > 0) {
            const equityMultiple = (arv - allInCost + cashCollected) / capitalRequired;
            totalEquityMultiple += equityMultiple;
            propertiesWithMetrics++;
          }
        }
      });

      return propertiesWithMetrics > 0 ? totalEquityMultiple / propertiesWithMetrics : 0;
    })(),

    // Average Cash-on-Cash Return using calculatePropertyMetrics function
    avgCoCReturn: (() => {
      if (!Array.isArray(properties) || properties.length === 0) return 0;

      let totalCoCReturn = 0;
      let propertiesWithCoC = 0;

      properties.forEach((prop: Property) => {
        const metrics = calculatePropertyKPIs(prop);
        if (metrics && metrics.cashOnCashReturn > 0) {
          totalCoCReturn += metrics.cashOnCashReturn;
          propertiesWithCoC++;
        }
      });

      return propertiesWithCoC > 0 ? totalCoCReturn / propertiesWithCoC : 0;
    })()
  };

  // Function to calculate metrics for a specific entity - match Asset Management structure
  const calculateEntityMetrics = (entityProperties: Property[]) => {
    const properties = entityProperties;

    const totalUnits = Array.isArray(properties) ? properties.reduce((sum: number, prop: Property) => sum + (prop.apartments || 0), 0) : 0;

    // AUM = Total ARV of all properties in this entity
    const totalAUM = Array.isArray(properties) ? properties.reduce((sum: number, prop: Property) => {
      const arv = parseFloat((prop.arvAtTimePurchased || '0').toString().replace(/[^0-9.-]/g, ''));
      return sum + (isNaN(arv) ? 0 : arv);
    }, 0) : 0;

    // Total Equity = AUM - current debt
    // Calculate total debt using actual loan data from Deal Analyzer
    let totalDebt = 0;
    properties.forEach((prop: Property) => {
      if (prop.status === 'Cashflowing' || prop.status === 'Rehabbing') {
        if (prop.dealAnalyzerData) {
          try {
            const dealData = JSON.parse(prop.dealAnalyzerData);
            if (dealData.loans && Array.isArray(dealData.loans)) {
              const activeLoan = dealData.loans.find((loan: any) => loan.isActive) || dealData.loans[0];
              if (activeLoan) {
                // Use remaining balance if available, otherwise use original loan amount
                const loanBalance = activeLoan.remainingBalance || activeLoan.loanAmount || activeLoan.amount || 0;
                totalDebt += parseFloat(loanBalance.toString());
              }
            }
          } catch (e) {
            const purchasePrice = parseFloat(prop.acquisitionPrice || '0');
            totalDebt += purchasePrice * 0.8; // 80% LTV fallback
          }
        } else {
          const purchasePrice = parseFloat(prop.acquisitionPrice || '0');
          totalDebt += purchasePrice * 0.8; // 80% LTV fallback
        }
      }
    });
    const totalEquity = totalAUM - totalDebt;

    // Current Monthly Income from cashflowing properties
    const currentMonthlyIncome = Array.isArray(properties) ? properties
      .filter((prop: Property) => prop.status === 'Cashflowing')
      .reduce((sum: number, prop: Property) => {
        const cashFlow = parseFloat((prop.cashFlow || '0').toString().replace(/[^0-9.-]/g, ''));
        return sum + (isNaN(cashFlow) ? 0 : cashFlow);
      }, 0) : 0;

    // Price/Unit
    const pricePerUnit = totalUnits > 0 ? totalAUM / totalUnits : 0;

    // Average Equity Multiple
    let totalEquityMultiple = 0;
    let propertiesWithMetrics = 0;

    properties.forEach((prop: Property) => {
      const metrics = calculatePropertyKPIs(prop);
      if (metrics && metrics.acquisitionPrice > 0) {
        const allInCost = metrics.acquisitionPrice + metrics.totalRehab + metrics.closingCosts + metrics.holdingCosts;
        const arv = parseFloat(prop.arvAtTimePurchased || '0');
        const cashCollected = parseFloat(prop.totalProfits || '0');
        const capitalRequired = metrics.capitalRequired || 0; // Use calculated capital from centralized service

        if (capitalRequired > 0) {
          const equityMultiple = (arv - allInCost + cashCollected) / capitalRequired;
          totalEquityMultiple += equityMultiple;
          propertiesWithMetrics++;
        }
      }
    });

    const avgEquityMultiple = propertiesWithMetrics > 0 ? totalEquityMultiple / propertiesWithMetrics : 0;

    // Average Cash-on-Cash Return
    let totalCoCReturn = 0;
    let propertiesWithCoC = 0;

    properties.forEach((prop: Property) => {
      const metrics = calculatePropertyKPIs(prop);
      if (metrics && metrics.cashOnCashReturn > 0) {
        totalCoCReturn += metrics.cashOnCashReturn;
        propertiesWithCoC++;
      }
    });

    const avgCoCReturn = propertiesWithCoC > 0 ? totalCoCReturn / propertiesWithCoC : 0;

    return {
      totalUnits,
      totalAUM,
      totalEquity,
      currentMonthlyIncome,
      pricePerUnit,
      avgEquityMultiple,
      avgCoCReturn
    };
  };

  const addMilestone = () => {
    const newMilestone: Milestone = {
      id: Date.now(),
      title: 'New Milestone',
      completed: false,
      targetDate: new Date().toISOString().split('T')[0],
      description: 'Description'
    };
    setMilestones([...milestones, newMilestone]);
  };

  const updateMilestone = (id: number, updates: Partial<Milestone>) => {
    setMilestones(milestones.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const deleteMilestone = (id: number) => {
    setMilestones(milestones.filter(m => m.id !== id));
  };

  const addTodo = () => {
    const newTodo: TodoItem = {
      id: Date.now(),
      task: 'New Task',
      completed: false,
      priority: 'Medium'
    };
    setTodos([...todos, newTodo]);
  };

  const updateTodo = (id: number, updates: Partial<TodoItem>) => {
    setTodos(todos.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">


      {/* Portfolio KPI Bar - Continuous Gradient Style - Match Asset Management */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 fade-in card-hover" data-tour="kpi-bar">
        <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
          <Calculator className="h-5 w-5 mr-2 icon-bounce" />
          Portfolio Key Metrics
        </h3>
        <div className="bg-gradient-to-r from-blue-600 via-blue-500 via-purple-500 to-purple-600 rounded-lg p-6 hover-glow transition-all-smooth">
          <div className="grid grid-cols-7 text-white">
            <div className="text-center">
              <div className="text-sm font-medium opacity-90">Total Units</div>
              <div className="text-2xl font-bold">{collectiveMetrics.totalUnits}</div>
            </div>
            <div className="text-center border-l border-white/20 pl-4">
              <div className="text-sm font-medium opacity-90">AUM</div>
              <div className="text-2xl font-bold">{formatCurrency(collectiveMetrics.totalAUM)}</div>
            </div>
            <div className="text-center border-l border-white/20 pl-4">
              <div className="text-sm font-medium opacity-90">Total Equity</div>
              <div className={`text-2xl font-bold ${
                collectiveMetrics.totalEquity >= 0 ? "" : "text-red-200"
              }`}>{formatCurrency(collectiveMetrics.totalEquity)}</div>
            </div>
            <div className="text-center border-l border-white/20 pl-4">
              <div className="text-sm font-medium opacity-90">Current Monthly Income</div>
              <div className={`text-2xl font-bold ${
                collectiveMetrics.currentMonthlyIncome > 0 ? "" : "text-red-200"
              }`}>{formatCurrency(collectiveMetrics.currentMonthlyIncome)}</div>
            </div>
            <div className="text-center border-l border-white/20 pl-4">
              <div className="text-sm font-medium opacity-90">Price/Unit</div>
              <div className="text-2xl font-bold">{formatCurrency(collectiveMetrics.pricePerUnit)}</div>
            </div>
            <div className="text-center border-l border-white/20 pl-4">
              <div className="text-sm font-medium opacity-90">Avg Equity Multiple</div>
              <div className="text-2xl font-bold">{collectiveMetrics.avgEquityMultiple.toFixed(2)}x</div>
            </div>
            <div className="text-center border-l border-white/20 pl-4">
              <div className="text-sm font-medium opacity-90">Avg CoC</div>
              <div className="text-2xl font-bold">{collectiveMetrics.avgCoCReturn.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section - Two Side-by-Side Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Cash Balance and Milestones */}
        <div className="space-y-6">
          {/* Bank Account Manager */}
          <div className="card-hover slide-in-up">
            <BankAccountManager />
          </div>

          {/* Upcoming Milestones */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 card-hover slide-in-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Milestones</h3>
              <button 
                onClick={addMilestone}
                className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded transition-colors-smooth hover-scale btn-bounce"
              >
                <Plus className="w-4 h-4 icon-bounce" />
              </button>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {milestones.map((milestone) => (
                <div key={milestone.id} className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded">
                  <button
                    onClick={() => updateMilestone(milestone.id, { completed: !milestone.completed })}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      milestone.completed 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {milestone.completed && <CheckCircle className="w-3 h-3" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <input
                      value={milestone.title}
                      onChange={(e) => updateMilestone(milestone.id, { title: e.target.value })}
                      className="font-medium text-gray-900 dark:text-white bg-transparent border-none p-0 w-full"
                    />
                    <input
                      type="date"
                      value={milestone.targetDate}
                      onChange={(e) => updateMilestone(milestone.id, { targetDate: e.target.value })}
                      className="text-sm text-gray-500 dark:text-gray-400 bg-transparent border-none p-0"
                    />
                  </div>
                  <button
                    onClick={() => deleteMilestone(milestone.id)}
                    className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - To-Do List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 card-hover slide-in-right">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">To-Do List</h3>
            <button 
              onClick={addTodo}
              className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded transition-colors-smooth hover-scale btn-bounce"
            >
              <Plus className="w-4 h-4 icon-bounce" />
            </button>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {todos.map((todo) => (
              <div key={todo.id} className="flex items-center gap-3 p-2 border border-gray-200 dark:border-gray-700 rounded hover-lift transition-all-smooth">
                <button
                  onClick={() => updateTodo(todo.id, { completed: !todo.completed })}
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors-smooth hover-scale btn-bounce ${
                    todo.completed 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : 'border-gray-300 dark:border-gray-600 hover:border-green-400'
                  }`}
                >
                  {todo.completed && <CheckSquare className="w-2 h-2" />}
                </button>
                <input
                  value={todo.task}
                  onChange={(e) => updateTodo(todo.id, { task: e.target.value })}
                  className={`flex-1 text-sm bg-transparent border-none p-0 ${
                    todo.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'
                  }`}
                />
                <select
                  value={todo.priority}
                  onChange={(e) => updateTodo(todo.id, { priority: e.target.value as 'Low' | 'Medium' | 'High' })}
                  className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded transition-colors-smooth hover-scale btn-bounce"
                >
                  <X className="w-3 h-3 icon-bounce" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Entity Sections */}
      <div className="space-y-8 stagger-children" data-tour="entities">

        {userEntities.map((entityName) => {
          const entityProperties = propertiesByEntity[entityName];
          const entityMetrics = calculateEntityMetrics(entityProperties);
          const entityPricePerUnit = entityMetrics.totalUnits > 0 ? entityMetrics.totalAUM / entityMetrics.totalUnits : 0;
          const entityEquityMultiple = entityMetrics.totalAUM > 0 ? (entityMetrics.totalAUM + entityMetrics.totalProfits) / entityMetrics.totalAUM : 0;

          return (
            <div key={entityName} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg fade-in card-hover transition-all-smooth">
              {/* Standardized Entity Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{entityName}</h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      {entityMetrics.totalProperties} properties • {entityMetrics.totalUnits} units • {formatCurrency(entityMetrics.totalAUM)} AUM
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Entity Performance</p>
                    <p className={`text-lg font-semibold ${
                      entityMetrics.totalProfits > 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      {formatCurrency(entityMetrics.totalProfits)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Entity KPIs - Deal Analyzer Style */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
                  <Calculator className="h-5 w-5 mr-2" />
                  Entity Metrics
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
                  <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg hover-scale transition-all-smooth cursor-pointer">
                    <label className="text-sm text-blue-900 dark:text-blue-100 font-medium">AUM</label>
                    <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">{formatCurrency(entityMetrics.totalAUM)}</p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900 p-4 rounded-lg hover-scale transition-all-smooth cursor-pointer">
                    <label className="text-sm text-orange-900 dark:text-orange-100 font-medium">Properties</label>
                    <p className="text-lg font-semibold text-orange-900 dark:text-orange-100">{entityMetrics.totalProperties}</p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg hover-scale transition-all-smooth cursor-pointer">
                    <label className="text-sm text-purple-900 dark:text-purple-100 font-medium">Units</label>
                    <p className="text-lg font-semibold text-purple-900 dark:text-purple-100">{entityMetrics.totalUnits}</p>
                  </div>
                  <div className={`p-4 rounded-lg hover-scale transition-all-smooth cursor-pointer ${
                    entityMetrics.totalProfits > 0 ? "bg-green-50 dark:bg-green-900" : "bg-red-50 dark:bg-red-900"
                  }`}>
                    <label className={`text-sm font-medium ${
                      entityMetrics.totalProfits > 0 ? "text-green-900 dark:text-green-100" : "text-red-900 dark:text-red-100"
                    }`}>Total Profits</label>
                    <p className={`text-lg font-semibold ${
                      entityMetrics.totalProfits > 0 ? "text-green-900 dark:text-green-100" : "text-red-900 dark:text-red-100"
                    }`}>{formatCurrency(entityMetrics.totalProfits)}</p>
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-8 px-6">
                  {[
                    { id: 'overview', label: 'Overview', icon: PieChart },
                    { id: 'financials', label: 'Financials', icon: DollarSign },
                    { id: 'members', label: 'Owners & Members', icon: Users },
                    { id: 'compliance', label: 'Compliance', icon: FileText }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTabs(prev => ({ ...prev, [entityName]: tab.id as any }))}
                      className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTabs[entityName] === tab.id
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTabs[entityName] === 'overview' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                        <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Total Profits</h4>
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{formatCurrency(entityMetrics.totalProfits)}</p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
                        <h4 className="text-lg font-semibold text-green-900 dark:text-green-100">Portfolio Value</h4>
                        <p className="text-2xl font-bold text-green-900 dark:text-green-100">{formatCurrency(entityMetrics.totalAUM)}</p>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg">
                        <h4 className="text-lg font-semibold text-purple-900 dark:text-purple-100">Cash Flow</h4>
                        <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{formatCurrency(entityMetrics.totalCashFlow)}</p>
                      </div>
                      <div className="bg-orange-50 dark:bg-orange-900 p-4 rounded-lg">
                        <h4 className="text-lg font-semibold text-orange-900 dark:text-orange-100">Avg CoC Return</h4>
                        <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{formatPercentage(entityMetrics.avgCoCReturn)}</p>
                      </div>
                    </div>

                    {/* Additional entity metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Investment</h5>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatCurrency(entityProperties.reduce((sum, prop) => sum + parseFloat(prop.acquisitionPrice) + parseFloat(prop.rehabCosts), 0))}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Price per Unit</h5>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatCurrency(entityPricePerUnit)}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400">Equity Multiple</h5>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {entityEquityMultiple.toFixed(2)}x
                        </p>
                      </div>
                    </div>

                    {/* Property performance breakdown */}
                    <div className="space-y-4">
                      <h5 className="text-lg font-semibold text-gray-900 dark:text-white">Performance Summary</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <h6 className="font-medium text-gray-900 dark:text-white mb-3">Property Status Distribution</h6>
                          <div className="space-y-2">
                            {Object.entries(
                              entityProperties.reduce((acc, prop) => {
                                acc[prop.status] = (acc[prop.status] || 0) + 1;
                                return acc;
                              }, {} as Record<string, number>)
                            ).map(([status, count]) => (
                              <div key={status} className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">{status}</span>
                                <span className="font-semibold text-gray-900 dark:text-white">{count}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <h6 className="font-medium text-gray-900 dark:text-white mb-3">Returns Distribution</h6>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Best CoC Return</span>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {entityProperties.length > 0 ? formatPercentage(Math.max(...entityProperties.map(p => parseFloat(p.cashOnCashReturn)))) : '0%'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Total Rehab Costs</span>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {formatCurrency(entityProperties.reduce((sum, prop) => sum + parseFloat(prop.rehabCosts), 0))}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}



                {activeTabs[entityName] === 'financials' && (
                  <div className="space-y-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Financial Statements</h4>

                    {/* Financial Statement Tabs */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                      <div className="border-b border-gray-200 dark:border-gray-700">
                        <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                          {[
                            { id: 'balance-sheet', name: 'Balance Sheet' },
                            { id: 'income-statement', name: 'Income Statement' },
                            { id: 'cash-flow', name: 'Cash Flow Statement' }
                          ].map((tab) => (
                            <button
                              key={tab.id}
                              onClick={() => setActiveFinancialTab(prev => ({ ...prev, [entityName]: tab.id }))}
                              className={`${
                                (activeFinancialTab[entityName] || 'balance-sheet') === tab.id
                                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            >
                              {tab.name}
                            </button>
                          ))}
                        </nav>
                      </div>

                      <div className="p-6">
                        {(activeFinancialTab[entityName] || 'balance-sheet') === 'balance-sheet' && (
                          <div className="grid md:grid-cols-2 gap-8">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Assets</h3>
                              <div className="space-y-3">
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Real Estate Properties</span>
                                  <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(entityMetrics.totalAUM)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Cash & Cash Equivalents</span>
                                  <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(75000)}</span>
                                </div>
                                <div className="border-t pt-3 flex justify-between">
                                  <span className="font-semibold text-gray-900 dark:text-white">Total Assets</span>
                                  <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(entityMetrics.totalAUM + 75000)}</span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Liabilities & Equity</h3>
                              <div className="space-y-3">
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Mortgages Payable</span>
                                  <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(entityMetrics.totalAUM * 0.7)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Owner's Equity</span>
                                  <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency((entityMetrics.totalAUM * 0.3) + 75000)}</span>
                                </div>
                                <div className="border-t pt-3 flex justify-between">
                                  <span className="font-semibold text-gray-900 dark:text-white">Total Liabilities & Equity</span>
                                  <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(entityMetrics.totalAUM + 75000)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {(activeFinancialTab[entityName] || 'balance-sheet') === 'income-statement' && (
                          <div className="max-w-2xl">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Income Statement</h3>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Gross Rental Income</span>
                                <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(entityMetrics.totalCashFlow * 1.15)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Operating Expenses</span>
                                <span className="font-semibold text-red-600">{formatCurrency(-entityMetrics.totalCashFlow * 0.15)}</span>
                              </div>
                              <div className="border-t pt-3 flex justify-between">
                                <span className="font-semibold text-gray-900 dark:text-white">Net Operating Income</span>
                                <span className="font-bold text-green-600">{formatCurrency(entityMetrics.totalCashFlow)}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {(activeFinancialTab[entityName] || 'balance-sheet') === 'cash-flow' && (
                          <div className="max-w-2xl">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Cash Flow</h3>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Operating Cash Flow</span>
                                <span className="font-semibold text-green-600">{formatCurrency(entityMetrics.totalCashFlow)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Capital Expenditures</span>
                                <span className="font-semibold text-red-600">{formatCurrency(-5000)}</span>
                              </div>
                              <div className="border-t pt-3 flex justify-between">
                                <span className="font-semibold text-gray-900 dark:text-white">Net Cash Flow</span>
                                <span className="font-bold text-green-600">{formatCurrency(entityMetrics.totalCashFlow - 5000)}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTabs[entityName] === 'members' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Owners & Members</h4>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {entityMembers[entityName]?.length || 0} members
                      </span>
                    </div>

                    <div className="grid gap-4">
                      {entityMembers[entityName]?.map((member) => (
                        <div key={member.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h5 className="font-semibold text-gray-900 dark:text-white">{member.name}</h5>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{member.email}</p>
                            </div>
                            <div className="text-right">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                member.role === 'owner' 
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                  : member.role === 'manager'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                              }`}>
                                {member.role}
                              </span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Equity Percentage</p>
                              <p className="font-semibold text-gray-900 dark:text-white">{member.equityPercentage}%</p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Joined</p>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {new Date(member.joinedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTabs[entityName] === 'compliance' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Compliance Management</h4>
                      <div className="flex gap-2">
                        {['overdue', 'pending', 'completed'].map((status) => {
                          const count = entityCompliance[entityName]?.filter(item => item.status === status).length || 0;
                          const colorClass = status === 'overdue' ? 'text-red-600' : status === 'pending' ? 'text-yellow-600' : 'text-green-600';
                          return (
                            <span key={status} className={`text-sm ${colorClass}`}>
                              {count} {status}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid gap-4">
                      {entityCompliance[entityName]?.map((item) => (
                        <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h5 className="font-semibold text-gray-900 dark:text-white">{item.complianceType}</h5>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                item.status === 'completed' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : item.status === 'overdue'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              }`}>
                                {item.status}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs ${
                                item.priority === 'critical' 
                                  ? 'bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-200'
                                  : item.priority === 'high'
                                  ? 'bg-orange-50 text-orange-700 dark:bg-orange-900 dark:text-orange-200'
                                  : item.priority === 'medium'
                                  ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200'
                                  : 'bg-gray-50 text-gray-700 dark:bg-gray-900 dark:text-gray-200'
                              }`}>
                                {item.priority} priority
                              </span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Due Date</p>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'Not set'}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Completed</p>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {item.completedDate ? new Date(item.completedDate).toLocaleDateString() : 'Not completed'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Property Financial Breakdown Modal */}
      {selectedPropertyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Property Financial Analysis - {selectedPropertyModal.address}
              </h2>
              <button
                onClick={() => setSelectedPropertyModal(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Financial Breakdown */}
              <div className="space-y-6">
                {/* Revenue Section */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-4 flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Revenue
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-blue-700 dark:text-blue-300">Gross Rent (Annual)</span>
                      <span className="font-semibold text-blue-900 dark:text-blue-200">
                        {formatCurrency(Number(selectedPropertyModal.cashFlow) * 12)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700 dark:text-blue-300">Vacancy Loss (5.0%)</span>
                      <span className="font-semibold text-red-600">-{formatCurrency(Number(selectedPropertyModal.cashFlow) * 12 * 0.05)}
                      </span>
                    </div>
                    <div className="border-t border-blue-300 dark:border-blue-700 pt-2">
                      <div className="flex justify-between">
                        <span className="font-semibold text-blue-900 dark:text-blue-200">Net Revenue</span>
                        <span className="font-bold text-blue-900 dark:text-blue-200">
                          {formatCurrency(Number(selectedPropertyModal.cashFlow) * 12 * 0.95)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expenses Section */}
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                  <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-4 flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Expenses
                  </h3>
                  <div className="space-y-3">
                    {(() => {
                      const grossRent = Number(selectedPropertyModal.cashFlow) * 12;
                      const propertyTax = grossRent * 0.12;
                      const insurance = grossRent * 0.06;
                      const maintenance = grossRent * 0.08;
                      const waterSewerTrash = grossRent * 0.04;
                      const capitalReserves = grossRent * 0.032;
                      const utilities = grossRent * 0.024;
                      const other = grossRent * 0.016;
                      const managementFee = grossRent * 0.08;
                      const totalExpenses = propertyTax + insurance + maintenance + waterSewerTrash + capitalReserves + utilities + other + managementFee;

                      return (
                        <>
                          <div className="flex justify-between">
                            <span className="text-red-700 dark:text-red-300">Property Tax</span>
                            <span className="font-semibold text-red-900 dark:text-red-200">{formatCurrency(propertyTax)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-red-700 dark:text-red-300">Insurance</span>
                            <span className="font-semibold text-red-900 dark:text-red-200">{formatCurrency(insurance)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-red-700 dark:text-red-300">Maintenance</span>
                            <span className="font-semibold text-red-900 dark:text-red-200">{formatCurrency(maintenance)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-red-700 dark:text-red-300">Water/Sewer/Trash</span>
                            <span className="font-semibold text-red-900 dark:text-red-200">{formatCurrency(waterSewerTrash)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-red-700 dark:text-red-300">Capital Reserves</span>
                            <span className="font-semibold text-red-900 dark:text-red-200">{formatCurrency(capitalReserves)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-red-700 dark:text-red-300">Utilities</span>
                            <span className="font-semibold text-red-900 dark:text-red-200">{formatCurrency(utilities)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-red-700 dark:text-red-300">Other</span>
                            <span className="font-semibold text-red-900 dark:text-red-200">{formatCurrency(other)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-red-700 dark:text-red-300">Management Fee (8%)</span>
                            <span className="font-semibold text-red-900 dark:text-red-200">{formatCurrency(managementFee)}</span>
                          </div>
                          <div className="border-t border-red-300 dark:border-red-700 pt-2">
                            <div className="flex justify-between">
                              <span className="font-semibold text-red-900 dark:text-red-200">Total Expenses</span>
                              <span className="font-bold text-red-900 dark:text-red-200">{formatCurrency(totalExpenses)}</span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Net Operating Income */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <h3 className="text-lg font-semibold text-green-900 dark:text-green-300 mb-4 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Net Operating Income
                  </h3>
                  <div className="space-y-3">
                    {(() => {
                      const grossRent = Number(selectedPropertyModal.cashFlow) * 12;
                      const netRevenue = grossRent * 0.95;
                      const totalExpenses = grossRent * 0.448; // Sum of all expense percentages
                      const noi = netRevenue - totalExpenses;
                      const monthlyDebtService = grossRent * 0.055; // Estimated debt service
                      const netCashFlow = (noi - (monthlyDebtService * 12)) / 12;

                      return (
                        <>
                          <div className="flex justify-between">
                            <span className="font-semibold text-green-900 dark:text-green-200">Net Operating Income (NOI)</span>
                            <span className="font-bold text-green-900 dark:text-green-200">{formatCurrency(noi)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-green-700 dark:text-green-300">Monthly Debt Service</span>
                            <span className="font-semibold text-red-600">-{formatCurrency(monthlyDebtService)}</span>
                          </div>
                          <div className="border-t border-green-300 dark:border-green-700 pt-2">
                            <div className="flex justify-between">
                              <span className="font-semibold text-green-900 dark:text-green-200">Net Cash Flow (Monthly)</span>
                              <span className={`font-bold ${netCashFlow > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(netCashFlow)}
                              </span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Investment Summary & Loan Analysis */}
              <div className="space-y-6">
                {/* Investment Summary */}
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                  <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-300 mb-4 flex items-center">
                    <PieChart className="h-5 w-5 mr-2" />
                    Investment Summary
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-purple-700 dark:text-purple-300">Total Cash Invested</span>
                      <span className="font-semibold text-purple-900 dark:text-purple-200">
                        {formatCurrency(selectedPropertyModal.initialCapitalRequired)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-700 dark:text-purple-300">Annual Cash Flow</span>
                      <span className={`font-semibold ${Number(selectedPropertyModal.cashFlow) * 12 > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(Number(selectedPropertyModal.cashFlow) * 12)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-700 dark:text-purple-300">Cash-Out at Refi</span>
                      <span className="font-semibold text-purple-900 dark:text-purple-200">
                        {formatCurrency(Number(selectedPropertyModal.totalProfits))}
                      </span>
                    </div>
                    <div className="border-t border-purple-300 dark:border-purple-700 pt-2">
                      <div className="flex justify-between">
                        <span className="font-semibold text-purple-900 dark:text-purple-200">Total Return</span>
                        <span className={`font-bold ${Number(selectedPropertyModal.totalProfits) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(Number(selectedPropertyModal.totalProfits))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Loan Analysis */}
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                  <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-300 mb-4 flex items-center">
                    <Calculator className="h-5 w-5 mr-2" />
                    Loan Analysis
                  </h3>
                  <div className="space-y-3">
                    {(() => {
                      const acquisitionPrice = Number(selectedPropertyModal.acquisitionPrice);
                      const ltcLoan = acquisitionPrice * 0.8; // 80% LTC
                      const arvLoan = Number(selectedPropertyModal.arvAtTimePurchased) * 0.65; // 65% ARV
                      const monthlyDebtService = acquisitionPrice * 0.055 / 12; // Estimated
                      const interestRate = 8.75;

                      return (
                        <>
                          <div className="flex justify-between">
                            <span className="text-orange-700 dark:text-orange-300">Initial Loan (LTC)</span>
                            <span className="font-semibold text-orange-900 dark:text-orange-200">{formatCurrency(ltcLoan)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-orange-700 dark:text-orange-300">Max Loan Amount (65% ARV)</span>
                            <span className="font-semibold text-orange-900 dark:text-orange-200">{formatCurrency(arvLoan)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-orange-700 dark:text-orange-300">Monthly Debt Service</span>
                            <span className="font-semibold text-orange-900 dark:text-orange-200">{formatCurrency(monthlyDebtService)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-orange-700 dark:text-orange-300">Interest Rate</span>
                            <span className="font-semibold text-orange-900 dark:text-orange-200">{interestRate}%</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Property Details */}
                <div className="bg-gray-50 dark:bg-gray-900/20 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-300 mb-4 flex items-center">
                    <Home className="h-5 w-5 mr-2" />
                    Property Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-700 dark:text-gray-300">Address</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-200">{selectedPropertyModal.address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700 dark:text-gray-300">City, State</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-200">{selectedPropertyModal.city}, {selectedPropertyModal.state}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700 dark:text-gray-300">Units</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-200">{selectedPropertyModal.apartments}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700 dark:text-gray-300">Status</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedPropertyModal.status === 'Cashflowing' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : selectedPropertyModal.status === 'Under Contract'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : selectedPropertyModal.status === 'Rehabbing'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {selectedPropertyModal.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700 dark:text-gray-300">Acquisition Date</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-200">
                        {selectedPropertyModal.acquisitionDate ? new Date(selectedPropertyModal.acquisitionDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700 dark:text-gray-300">Cash-on-Cash Return</span>
                      <span className={`font-semibold ${Number(selectedPropertyModal.cashOnCashReturn) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercentage(selectedPropertyModal.cashOnCashReturn)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedPropertyModal(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}