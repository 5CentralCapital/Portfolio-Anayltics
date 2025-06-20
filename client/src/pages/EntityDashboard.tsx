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
  entityId?: string;
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
      strategy: 'BRRRR',
      entityId: '5central'
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
      strategy: 'Buy & Hold',
      entityId: '5central'
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
      strategy: 'BRRRR',
      entityId: 'harmony'
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
      strategy: 'Value-Add',
      entityId: '5central'
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

  const [milestones, setMilestones] = useState<Milestone[]>([
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

  const [todoTasks, setTodoTasks] = useState<ToDoTask[]>([
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
  
  // Entities management
  const [entities, setEntities] = useState([
    {
      id: '5central',
      name: '5Central Capital LLC',
      formationDate: '2023-01-01',
      structure: 'Limited Liability Company',
      taxStatus: 'Pass-through',
      state: 'Massachusetts',
      ein: '12-3456789',
      cashBalance: 850000
    },
    {
      id: 'harmony',
      name: 'Harmony Holdings LLC',
      formationDate: '2022-08-15',
      structure: 'Limited Liability Company',
      taxStatus: 'Pass-through',
      state: 'Connecticut',
      ein: '98-7654321',
      cashBalance: 420000
    },
    {
      id: 'crystal',
      name: 'Crystal Properties LLC',
      formationDate: '2024-02-10',
      structure: 'Limited Liability Company',
      taxStatus: 'Pass-through',
      state: 'Florida',
      ein: '56-7890123',
      cashBalance: 285000
    }
  ]);
  
  const [showAddEntity, setShowAddEntity] = useState(false);
  const [editingEntity, setEditingEntity] = useState<string | null>(null);
  const [entityActiveTabs, setEntityActiveTabs] = useState<Record<string, string>>({});
  const [newEntity, setNewEntity] = useState({
    name: '',
    formationDate: '',
    structure: 'Limited Liability Company',
    taxStatus: 'Pass-through',
    state: '',
    ein: '',
    cashBalance: 0
  });

  // Set active tab for a specific entity
  const setEntityActiveTab = (entityId: string, tab: string) => {
    setEntityActiveTabs(prev => ({
      ...prev,
      [entityId]: tab
    }));
  };

  // Get active tab for a specific entity (default to 'overview')
  const getEntityActiveTab = (entityId: string) => {
    return entityActiveTabs[entityId] || 'overview';
  };

  // Entity CRUD functions
  const addEntity = () => {
    if (newEntity.name && newEntity.formationDate && newEntity.state && newEntity.ein) {
      const id = newEntity.name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10);
      const entity = {
        id,
        ...newEntity
      };
      setEntities([...entities, entity]);
      setNewEntity({
        name: '',
        formationDate: '',
        structure: 'Limited Liability Company',
        taxStatus: 'Pass-through',
        state: '',
        ein: '',
        cashBalance: 0
      });
      setShowAddEntity(false);
    }
  };

  const updateEntity = (id: string, updates: any) => {
    setEntities(entities.map(entity => 
      entity.id === id ? { ...entity, ...updates } : entity
    ));
    setEditingEntity(null);
  };

  const deleteEntity = (id: string) => {
    if (entities.length > 1) { // Keep at least one entity
      setEntities(entities.filter(entity => entity.id !== id));
      // Also update properties that were assigned to this entity
      // This would be handled by a proper state management system in production
    }
  };

  // Get properties for a specific entity
  const getEntityProperties = (entityId: string) => {
    return properties.filter(property => property.entityId === entityId);
  };

  // Calculate metrics for a specific entity
  const getEntityMetrics = (entityId: string) => {
    const entityProperties = getEntityProperties(entityId);
    const entity = entities.find(e => e.id === entityId);
    
    if (entityProperties.length === 0) {
      return {
        totalAUM: 0,
        totalProperties: 0,
        totalUnits: 0,
        totalEquity: 0,
        monthlyCashFlow: 0,
        cashBalance: entity?.cashBalance || 0
      };
    }

    const totalAUM = entityProperties.reduce((sum, prop) => sum + prop.currentValue, 0);
    const totalProperties = entityProperties.length;
    const totalUnits = entityProperties.reduce((sum, prop) => sum + prop.units, 0);
    const totalEquity = entityProperties.reduce((sum, prop) => sum + prop.equityCreated, 0);
    const monthlyCashFlow = entityProperties.reduce((sum, prop) => sum + prop.cashFlow, 0);

    return {
      totalAUM,
      totalProperties,
      totalUnits,
      totalEquity,
      monthlyCashFlow,
      cashBalance: entity?.cashBalance || 0
    };
  };

  // Editing states
  const [editingMilestone, setEditingMilestone] = useState<number | null>(null);
  const [editingTask, setEditingTask] = useState<number | null>(null);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newMilestone, setNewMilestone] = useState<Partial<Milestone>>({});
  const [newTask, setNewTask] = useState<Partial<ToDoTask>>({});

  // CRUD functions for milestones
  const addMilestone = () => {
    if (newMilestone.title && newMilestone.dueDate) {
      const id = Math.max(...milestones.map(m => m.id), 0) + 1;
      const milestone: Milestone = {
        id,
        title: newMilestone.title,
        dueDate: newMilestone.dueDate,
        status: newMilestone.status || 'Pending',
        assignee: newMilestone.assignee || 'Marcus Johnson',
        priority: newMilestone.priority || 'Medium'
      };
      setMilestones([...milestones, milestone]);
      setNewMilestone({});
      setShowAddMilestone(false);
    }
  };

  const updateMilestone = (id: number, updates: Partial<Milestone>) => {
    setMilestones(milestones.map(m => m.id === id ? { ...m, ...updates } : m));
    setEditingMilestone(null);
  };

  const deleteMilestone = (id: number) => {
    setMilestones(milestones.filter(m => m.id !== id));
  };

  // CRUD functions for tasks
  const addTask = () => {
    if (newTask.title && newTask.dueDate) {
      const id = Math.max(...todoTasks.map(t => t.id), 0) + 1;
      const task: ToDoTask = {
        id,
        title: newTask.title,
        description: newTask.description || '',
        dueDate: newTask.dueDate,
        status: newTask.status || 'Pending',
        assignee: newTask.assignee || 'Marcus Johnson',
        category: newTask.category || 'Financial'
      };
      setTodoTasks([...todoTasks, task]);
      setNewTask({});
      setShowAddTask(false);
    }
  };

  const updateTask = (id: number, updates: Partial<ToDoTask>) => {
    setTodoTasks(todoTasks.map(t => t.id === id ? { ...t, ...updates } : t));
    setEditingTask(null);
  };

  const deleteTask = (id: number) => {
    setTodoTasks(todoTasks.filter(t => t.id !== id));
  };

  const toggleTaskStatus = (id: number) => {
    const task = todoTasks.find(t => t.id === id);
    if (task) {
      const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
      updateTask(id, { status: newStatus });
    }
  };

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
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
        <div className="grid grid-cols-6 gap-4">
          <div className="text-center">
            <p className="text-sm opacity-90 mb-2">AUM</p>
            <p className="text-xl font-bold">{formatCompact(metrics.totalAUM)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm opacity-90 mb-2">Price/Unit</p>
            <p className="text-xl font-bold">{formatCompact(metrics.pricePerUnit)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm opacity-90 mb-2">Units</p>
            <p className="text-xl font-bold text-green-300">{metrics.totalUnits}</p>
          </div>
          <div className="text-center">
            <p className="text-sm opacity-90 mb-2">Properties</p>
            <p className="text-xl font-bold text-orange-300">{metrics.totalProperties}</p>
          </div>
          <div className="text-center">
            <p className="text-sm opacity-90 mb-2">Avg Equity Multiple</p>
            <p className="text-xl font-bold">{metrics.avgEquityMultiple.toFixed(1)}x</p>
          </div>
          <div className="text-center">
            <p className="text-sm opacity-90 mb-2">Monthly Cash Flow</p>
            <p className="text-xl font-bold text-green-300">{formatCompact(metrics.monthlyCashFlow)}</p>
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
              <div className="flex items-center space-x-2">
                <Calendar className="h-6 w-6 text-blue-600" />
                <button
                  onClick={() => setShowAddMilestone(true)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {milestones.map((milestone) => (
                <div key={milestone.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  {editingMilestone === milestone.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={milestone.title}
                        onChange={(e) => updateMilestone(milestone.id, { title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800"
                        placeholder="Milestone title"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={milestone.dueDate}
                          onChange={(e) => updateMilestone(milestone.id, { dueDate: e.target.value })}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800"
                        />
                        <select
                          value={milestone.status}
                          onChange={(e) => updateMilestone(milestone.id, { status: e.target.value as any })}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800"
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Overdue">Overdue</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={milestone.priority}
                          onChange={(e) => updateMilestone(milestone.id, { priority: e.target.value as any })}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800"
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                        </select>
                        <input
                          type="text"
                          value={milestone.assignee}
                          onChange={(e) => updateMilestone(milestone.id, { assignee: e.target.value })}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800"
                          placeholder="Assignee"
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setEditingMilestone(null)}
                          className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
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
                        <button
                          onClick={() => setEditingMilestone(milestone.id)}
                          className="text-gray-400 hover:text-blue-600"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteMilestone(milestone.id)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Add New Milestone Form */}
              {showAddMilestone && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={newMilestone.title || ''}
                      onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800"
                      placeholder="Milestone title"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={newMilestone.dueDate || ''}
                        onChange={(e) => setNewMilestone({ ...newMilestone, dueDate: e.target.value })}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800"
                      />
                      <select
                        value={newMilestone.priority || 'Medium'}
                        onChange={(e) => setNewMilestone({ ...newMilestone, priority: e.target.value as any })}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                    <input
                      type="text"
                      value={newMilestone.assignee || ''}
                      onChange={(e) => setNewMilestone({ ...newMilestone, assignee: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800"
                      placeholder="Assignee"
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setShowAddMilestone(false);
                          setNewMilestone({});
                        }}
                        className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={addMilestone}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* To-Do List Widget */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">To-Do List</h3>
            <div className="flex items-center space-x-2">
              <CheckSquare className="h-6 w-6 text-orange-600" />
              <button
                onClick={() => setShowAddTask(true)}
                className="text-blue-600 hover:text-blue-700"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {todoTasks.map((task) => (
              <div key={task.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                {editingTask === task.id ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={task.title}
                      onChange={(e) => updateTask(task.id, { title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800"
                      placeholder="Task title"
                    />
                    <textarea
                      value={task.description}
                      onChange={(e) => updateTask(task.id, { description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800"
                      placeholder="Task description"
                      rows={2}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={task.dueDate}
                        onChange={(e) => updateTask(task.id, { dueDate: e.target.value })}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800"
                      />
                      <select
                        value={task.status}
                        onChange={(e) => updateTask(task.id, { status: e.target.value as any })}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={task.category}
                        onChange={(e) => updateTask(task.id, { category: e.target.value as any })}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800"
                      >
                        <option value="Compliance">Compliance</option>
                        <option value="Financial">Financial</option>
                        <option value="Member">Member</option>
                        <option value="Property">Property</option>
                      </select>
                      <input
                        type="text"
                        value={task.assignee}
                        onChange={(e) => updateTask(task.id, { assignee: e.target.value })}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800"
                        placeholder="Assignee"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setEditingTask(null)}
                        className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <button
                        onClick={() => toggleTaskStatus(task.id)}
                        className="hover:scale-110 transition-transform"
                      >
                        {task.status === 'Completed' ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-gray-400 hover:text-green-500" />
                        )}
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${task.status === 'Completed' ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                        {task.title}
                      </p>
                      <p className={`text-sm ${task.status === 'Completed' ? 'line-through text-gray-400' : 'text-gray-600 dark:text-gray-400'}`}>
                        {task.description}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          <span>{task.category}</span> • <span>{task.dueDate}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex items-center space-x-1">
                      <button
                        onClick={() => setEditingTask(task.id)}
                        className="text-gray-400 hover:text-blue-600"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {/* Add New Task Form */}
            {showAddTask && (
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newTask.title || ''}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800"
                    placeholder="Task title"
                  />
                  <textarea
                    value={newTask.description || ''}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800"
                    placeholder="Task description"
                    rows={2}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={newTask.dueDate || ''}
                      onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800"
                    />
                    <select
                      value={newTask.category || 'Financial'}
                      onChange={(e) => setNewTask({ ...newTask, category: e.target.value as any })}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800"
                    >
                      <option value="Compliance">Compliance</option>
                      <option value="Financial">Financial</option>
                      <option value="Member">Member</option>
                      <option value="Property">Property</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    value={newTask.assignee || ''}
                    onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800"
                    placeholder="Assignee"
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => {
                        setShowAddTask(false);
                        setNewTask({});
                      }}
                      className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addTask}
                      className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Entity Management Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Entity Management</h2>
          <button
            onClick={() => setShowAddEntity(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Entity</span>
          </button>
        </div>

        {/* Add New Entity Form */}
        {showAddEntity && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New Entity</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                value={newEntity.name}
                onChange={(e) => setNewEntity({ ...newEntity, name: e.target.value })}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                placeholder="Entity Name"
              />
              <input
                type="date"
                value={newEntity.formationDate}
                onChange={(e) => setNewEntity({ ...newEntity, formationDate: e.target.value })}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
              />
              <select
                value={newEntity.structure}
                onChange={(e) => setNewEntity({ ...newEntity, structure: e.target.value })}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
              >
                <option value="Limited Liability Company">Limited Liability Company</option>
                <option value="Corporation">Corporation</option>
                <option value="Partnership">Partnership</option>
                <option value="Sole Proprietorship">Sole Proprietorship</option>
              </select>
              <input
                type="text"
                value={newEntity.state}
                onChange={(e) => setNewEntity({ ...newEntity, state: e.target.value })}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                placeholder="Formation State"
              />
              <input
                type="text"
                value={newEntity.ein}
                onChange={(e) => setNewEntity({ ...newEntity, ein: e.target.value })}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                placeholder="EIN (XX-XXXXXXX)"
              />
              <input
                type="number"
                value={newEntity.cashBalance}
                onChange={(e) => setNewEntity({ ...newEntity, cashBalance: Number(e.target.value) })}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                placeholder="Initial Cash Balance"
              />
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => {
                  setShowAddEntity(false);
                  setNewEntity({
                    name: '',
                    formationDate: '',
                    structure: 'Limited Liability Company',
                    taxStatus: 'Pass-through',
                    state: '',
                    ein: '',
                    cashBalance: 0
                  });
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={addEntity}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add Entity
              </button>
            </div>
          </div>
        )}

        {/* Entity Sections */}
        {entities.map((entity) => {
          const entityMetrics = getEntityMetrics(entity.id);
          const entityProperties = getEntityProperties(entity.id);
          
          return (
            <div key={entity.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="p-6">
                  {editingEntity === entity.id ? (
                    // Edit Entity Form
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Edit Entity</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={entity.name}
                          onChange={(e) => updateEntity(entity.id, { name: e.target.value })}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                          placeholder="Entity Name"
                        />
                        <input
                          type="date"
                          value={entity.formationDate}
                          onChange={(e) => updateEntity(entity.id, { formationDate: e.target.value })}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                        />
                        <select
                          value={entity.structure}
                          onChange={(e) => updateEntity(entity.id, { structure: e.target.value })}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                        >
                          <option value="Limited Liability Company">Limited Liability Company</option>
                          <option value="Corporation">Corporation</option>
                          <option value="Partnership">Partnership</option>
                          <option value="Sole Proprietorship">Sole Proprietorship</option>
                        </select>
                        <input
                          type="text"
                          value={entity.state}
                          onChange={(e) => updateEntity(entity.id, { state: e.target.value })}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                          placeholder="Formation State"
                        />
                        <input
                          type="text"
                          value={entity.ein}
                          onChange={(e) => updateEntity(entity.id, { ein: e.target.value })}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                          placeholder="EIN (XX-XXXXXXX)"
                        />
                        <input
                          type="number"
                          value={entity.cashBalance}
                          onChange={(e) => updateEntity(entity.id, { cashBalance: Number(e.target.value) })}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                          placeholder="Cash Balance"
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setEditingEntity(null)}
                          className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Display Entity Header
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div className="text-center flex-1">
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{entity.name}</h3>
                          <p className="text-gray-600 dark:text-gray-400">{entity.structure} • Formed: {entity.formationDate}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setEditingEntity(entity.id)}
                            className="text-gray-400 hover:text-blue-600"
                          >
                            <Edit3 className="h-5 w-5" />
                          </button>
                          {entities.length > 1 && (
                            <button
                              onClick={() => deleteEntity(entity.id)}
                              className="text-gray-400 hover:text-red-600"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </div>
                  
                  {/* Entity KPIs */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total AUM</p>
                      <p className="text-xl font-bold text-blue-600">{formatCurrency(entityMetrics.totalAUM)}</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Equity</p>
                      <p className="text-xl font-bold text-green-600">{formatCurrency(entityMetrics.totalEquity)}</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Monthly Cash Flow</p>
                      <p className="text-xl font-bold text-purple-600">{formatCurrency(entityMetrics.monthlyCashFlow)}</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Properties</p>
                      <p className="text-xl font-bold text-orange-600">{entityMetrics.totalProperties}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Units</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{entityMetrics.totalUnits}</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Cash Balance</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(entityMetrics.cashBalance)}</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">State</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{entity.state}</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">EIN</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{entity.ein}</p>
                    </div>
                  </div>

                      {/* Entity Properties Summary */}
                      {entityProperties.length > 0 && (
                        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Properties ({entityProperties.length})</h4>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {entityProperties.map(prop => prop.address).join(', ')}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Entity Tabs */}
                <nav className="flex space-x-8 px-6">
                  {[
                    { id: 'overview', label: 'Overview', icon: Building },
                    { id: 'financials', label: 'Financials', icon: DollarSign },
                    { id: 'properties', label: 'Properties', icon: Home },
                    { id: 'compliance', label: 'Compliance', icon: CheckSquare }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setEntityActiveTab(entity.id, tab.id)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                        getEntityActiveTab(entity.id) === tab.id
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

              {/* Entity Tab Content */}
              <div className="p-6">
                {getEntityActiveTab(entity.id) === 'overview' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Entity Details</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Formation Date</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{entity.formationDate}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Structure</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{entity.structure}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">State</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{entity.state}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">EIN</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{entity.ein}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Summary</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Total Properties</span>
                          <span className="font-semibold">{entityMetrics.totalProperties}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Total Units</span>
                          <span className="font-semibold">{entityMetrics.totalUnits}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Monthly Cash Flow</span>
                          <span className="font-semibold text-green-600">{formatCurrency(entityMetrics.monthlyCashFlow)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Cash Balance</span>
                          <span className="font-semibold text-blue-600">{formatCurrency(entityMetrics.cashBalance)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {getEntityActiveTab(entity.id) === 'financials' && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Financial Overview</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600 dark:text-gray-400">Total AUM</span>
                          <span className="font-semibold text-blue-600">{formatCurrency(entityMetrics.totalAUM)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600 dark:text-gray-400">Total Equity</span>
                          <span className="font-semibold text-green-600">{formatCurrency(entityMetrics.totalEquity)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600 dark:text-gray-400">Monthly Cash Flow</span>
                          <span className="font-semibold text-purple-600">{formatCurrency(entityMetrics.monthlyCashFlow)}</span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600 dark:text-gray-400">Annual Cash Flow</span>
                          <span className="font-semibold">{formatCurrency(entityMetrics.monthlyCashFlow * 12)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600 dark:text-gray-400">Cash Balance</span>
                          <span className="font-semibold">{formatCurrency(entityMetrics.cashBalance)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600 dark:text-gray-400">Total Units</span>
                          <span className="font-semibold">{entityMetrics.totalUnits}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {getEntityActiveTab(entity.id) === 'properties' && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Entity Properties</h4>
                    {entityProperties.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {entityProperties.map((property) => (
                          <div key={property.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <h5 className="font-semibold text-gray-900 dark:text-white mb-2">{property.address}</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{property.city}, {property.state}</p>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Units:</span>
                                <span className="font-semibold">{property.units}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Current Value:</span>
                                <span className="font-semibold text-blue-600">{formatCurrency(property.currentValue)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Monthly Cash Flow:</span>
                                <span className="font-semibold text-green-600">{formatCurrency(property.cashFlow)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">No properties assigned to this entity.</p>
                    )}
                  </div>
                )}

                {getEntityActiveTab(entity.id) === 'compliance' && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Compliance Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-semibold text-gray-900 dark:text-white mb-3">Entity Registration</h5>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Formation State</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{entity.state}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">EIN</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{entity.ein}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Tax Status</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{entity.taxStatus}</p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h5 className="font-semibold text-gray-900 dark:text-white mb-3">Status</h5>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <CheckSquare className="h-4 w-4 text-green-600" />
                            <span className="text-sm">Formation Documents Filed</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CheckSquare className="h-4 w-4 text-green-600" />
                            <span className="text-sm">EIN Obtained</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CheckSquare className="h-4 w-4 text-green-600" />
                            <span className="text-sm">Operating Agreement Executed</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}