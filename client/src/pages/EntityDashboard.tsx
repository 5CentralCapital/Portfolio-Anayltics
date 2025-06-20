import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  // Fetch properties from database
  const { data: allProperties = [], isLoading } = useQuery({
    queryKey: ['/api/properties'],
    enabled: true
  });
  
  // All properties for collective KPIs
  const properties: Property[] = Array.isArray(allProperties) ? allProperties : [];
  
  // Properties grouped by entity
  const entitiesList = ['5Central Capital LLC', 'Harmony Holdings LLC', 'Crystal Properties LLC'];
  const propertiesByEntity = entitiesList.reduce((acc, entity) => {
    acc[entity] = properties.filter(prop => prop.entity === entity);
    return acc;
  }, {} as Record<string, Property[]>);

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

  // Helper functions
  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatPercentage = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `${num.toFixed(1)}%`;
  };

  // Calculate collective metrics for all entities
  const collectiveMetrics = {
    totalProperties: properties.length,
    totalUnits: properties.reduce((sum: number, prop: Property) => sum + prop.apartments, 0),
    totalAUM: properties.reduce((sum: number, prop: Property) => {
      const currentValue = prop.status === 'Currently Own' 
        ? parseFloat(prop.arvAtTimePurchased || prop.acquisitionPrice)
        : parseFloat(prop.salePrice || '0');
      return sum + currentValue;
    }, 0),
    totalProfits: properties.reduce((sum: number, prop: Property) => sum + parseFloat(prop.totalProfits), 0),
    totalCashFlow: properties
      .filter((prop: Property) => prop.status === 'Currently Own')
      .reduce((sum: number, prop: Property) => sum + parseFloat(prop.cashFlow), 0),
    avgCoCReturn: properties.length > 0 
      ? properties.reduce((sum: number, prop: Property) => sum + parseFloat(prop.cashOnCashReturn), 0) / properties.length 
      : 0
  };

  const pricePerUnit = collectiveMetrics.totalUnits > 0 ? collectiveMetrics.totalAUM / collectiveMetrics.totalUnits : 0;
  const equityMultiple = collectiveMetrics.totalAUM > 0 ? (collectiveMetrics.totalAUM + collectiveMetrics.totalProfits) / collectiveMetrics.totalAUM : 0;

  // Function to calculate metrics for a specific entity
  const calculateEntityMetrics = (entityProperties: Property[]) => ({
    totalProperties: entityProperties.length,
    totalUnits: entityProperties.reduce((sum: number, prop: Property) => sum + prop.apartments, 0),
    totalAUM: entityProperties.reduce((sum: number, prop: Property) => {
      const currentValue = prop.status === 'Currently Own' 
        ? parseFloat(prop.arvAtTimePurchased || prop.acquisitionPrice)
        : parseFloat(prop.salePrice || '0');
      return sum + currentValue;
    }, 0),
    totalProfits: entityProperties.reduce((sum: number, prop: Property) => sum + parseFloat(prop.totalProfits), 0),
    totalCashFlow: entityProperties
      .filter((prop: Property) => prop.status === 'Currently Own')
      .reduce((sum: number, prop: Property) => sum + parseFloat(prop.cashFlow), 0),
    avgCoCReturn: entityProperties.length > 0 
      ? entityProperties.reduce((sum: number, prop: Property) => sum + parseFloat(prop.cashOnCashReturn), 0) / entityProperties.length 
      : 0
  });

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
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Entity Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Collective performance and entity management</p>
      </div>

      {/* Collective KPIs - Top Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total AUM</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(collectiveMetrics.totalAUM)}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Price/Unit</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(pricePerUnit)}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-2">
            <Home className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Units</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{collectiveMetrics.totalUnits}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-2">
            <Building className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Properties</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{collectiveMetrics.totalProperties}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-red-600" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Equity Multiple</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{equityMultiple.toFixed(2)}x</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Cash Flow</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(collectiveMetrics.totalCashFlow)}</p>
        </div>
      </div>

      {/* Middle Section - Shared Components */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Balance */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cash Balance</h3>
            <Banknote className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-center">
            <EditableValue 
              value={cashBalance} 
              onSave={setCashBalance}
              format="currency"
              className="text-3xl font-bold text-green-600"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Available Operating Capital</p>
          </div>
        </div>

        {/* Upcoming Milestones */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Milestones</h3>
            <button 
              onClick={addMilestone}
              className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded"
            >
              <Plus className="w-4 h-4" />
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

        {/* To-Do List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">To-Do List</h3>
            <button 
              onClick={addTodo}
              className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {todos.map((todo) => (
              <div key={todo.id} className="flex items-center gap-3 p-2 border border-gray-200 dark:border-gray-700 rounded">
                <button
                  onClick={() => updateTodo(todo.id, { completed: !todo.completed })}
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    todo.completed 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : 'border-gray-300 dark:border-gray-600'
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
                  className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Entity Sections */}
      <div className="space-y-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Individual Entities</h2>
        
        {entitiesList.map((entityName) => {
          const entityProperties = propertiesByEntity[entityName];
          const entityMetrics = calculateEntityMetrics(entityProperties);
          const entityPricePerUnit = entityMetrics.totalUnits > 0 ? entityMetrics.totalAUM / entityMetrics.totalUnits : 0;
          const entityEquityMultiple = entityMetrics.totalAUM > 0 ? (entityMetrics.totalAUM + entityMetrics.totalProfits) / entityMetrics.totalAUM : 0;

          return (
            <div key={entityName} className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{entityName}</h3>
                <p className="text-gray-600 dark:text-gray-400">Entity-specific performance metrics</p>
              </div>

              {/* Entity KPIs */}
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">AUM</h4>
                    <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{formatCurrency(entityMetrics.totalAUM)}</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-green-900 dark:text-green-100">Properties</h4>
                    <p className="text-xl font-bold text-green-900 dark:text-green-100">{entityMetrics.totalProperties}</p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100">Units</h4>
                    <p className="text-xl font-bold text-purple-900 dark:text-purple-100">{entityMetrics.totalUnits}</p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-orange-900 dark:text-orange-100">Total Profits</h4>
                    <p className="text-xl font-bold text-orange-900 dark:text-orange-100">{formatCurrency(entityMetrics.totalProfits)}</p>
                  </div>
                </div>

                {/* Entity Properties */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Properties</h4>
                  {entityProperties.length === 0 ? (
                    <div className="text-center py-8">
                      <Building className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">No properties assigned to {entityName}</p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {entityProperties.map((property) => (
                        <div key={property.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-semibold text-gray-900 dark:text-white">{property.address}</h5>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              property.status === 'Currently Own' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                            }`}>
                              {property.status}
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                            {property.city}, {property.state}
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Units</p>
                              <p className="font-semibold text-gray-900 dark:text-white">{property.apartments}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Acquisition Price</p>
                              <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(property.acquisitionPrice)}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Total Profits</p>
                              <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(property.totalProfits)}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">CoC Return</p>
                              <p className="font-semibold text-gray-900 dark:text-white">{formatPercentage(property.cashOnCashReturn)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}