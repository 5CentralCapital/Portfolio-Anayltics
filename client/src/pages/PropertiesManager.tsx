import { useState, useEffect } from 'react';
import { Building2, DollarSign, TrendingUp, Users, Edit3, Trash2, Plus } from 'lucide-react';

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

interface Entity {
  id: string;
  name: string;
  formationDate: string;
  structure: string;
  state: string;
  ein: string;
  cashBalance: number;
}

interface EditableFieldProps {
  value: number;
  onSave: (value: number) => void;
  format?: 'currency' | 'percentage' | 'number';
  className?: string;
}

const EditableField = ({ value, onSave, format = 'currency', className = '' }: EditableFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());

  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
      case 'percentage':
        return `${val.toFixed(2)}%`;
      case 'number':
        return val.toLocaleString();
      default:
        return val.toString();
    }
  };

  const handleSave = () => {
    const numValue = parseFloat(editValue);
    if (!isNaN(numValue)) {
      onSave(numValue);
    }
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value.toString());
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        type="number"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyPress}
        className="px-2 py-1 border border-blue-300 rounded text-right bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[100px]"
        autoFocus
      />
    );
  }

  return (
    <span
      onClick={() => setIsEditing(true)}
      className={`cursor-pointer hover:bg-blue-50 px-2 py-1 rounded transition-colors ${className}`}
      title="Click to edit"
    >
      {formatValue(value)}
    </span>
  );
};

export default function PropertiesManager() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);

  // Initialize sample data
  useEffect(() => {
    const sampleProperties: Property[] = [
      {
        id: 1,
        address: '1 Harmony St',
        city: 'New Haven',
        state: 'CT',
        zipCode: '06511',
        units: 4,
        purchasePrice: 275000,
        purchaseDate: '2023-03-15',
        rehabCosts: 45000,
        totalInvestment: 320000,
        currentValue: 425000,
        grossRent: 4200,
        netRent: 3780,
        expenses: 1260,
        noi: 2520,
        cashFlow: 1890,
        capRate: 7.1,
        cocReturn: 28.4,
        annualizedReturn: 35.2,
        equityCreated: 105000,
        status: 'Active',
        propertyType: 'Multifamily',
        strategy: 'BRRRR',
        entityId: '5central'
      },
      {
        id: 2,
        address: '145 Crystal Ave',
        city: 'New Haven',
        state: 'CT',
        zipCode: '06515',
        units: 2,
        purchasePrice: 185000,
        purchaseDate: '2023-06-20',
        rehabCosts: 32000,
        totalInvestment: 217000,
        currentValue: 295000,
        grossRent: 2800,
        netRent: 2520,
        expenses: 840,
        noi: 1680,
        cashFlow: 1260,
        capRate: 6.9,
        cocReturn: 31.8,
        annualizedReturn: 38.7,
        equityCreated: 78000,
        status: 'Active',
        propertyType: 'Multifamily',
        strategy: 'BRRRR',
        entityId: 'crystal'
      },
      {
        id: 3,
        address: '25 Huntington Pl',
        city: 'New Haven',
        state: 'CT',
        zipCode: '06511',
        units: 3,
        purchasePrice: 225000,
        purchaseDate: '2023-09-10',
        rehabCosts: 38000,
        totalInvestment: 263000,
        currentValue: 345000,
        grossRent: 3300,
        netRent: 2970,
        expenses: 990,
        noi: 1980,
        cashFlow: 1485,
        capRate: 7.5,
        cocReturn: 29.7,
        annualizedReturn: 36.4,
        equityCreated: 82000,
        status: 'Active',
        propertyType: 'Multifamily',
        strategy: 'BRRRR',
        entityId: 'harmony'
      }
    ];

    const sampleEntities: Entity[] = [
      {
        id: '5central',
        name: '5Central Capital LLC',
        formationDate: '2022-12-15',
        structure: 'LLC',
        state: 'Connecticut',
        ein: '88-1234567',
        cashBalance: 125000
      },
      {
        id: 'harmony',
        name: 'Harmony Holdings LLC',
        formationDate: '2023-01-20',
        structure: 'LLC',
        state: 'Connecticut',
        ein: '88-2345678',
        cashBalance: 75000
      },
      {
        id: 'crystal',
        name: 'Crystal Properties LLC',
        formationDate: '2023-02-10',
        structure: 'LLC',
        state: 'Connecticut',
        ein: '88-3456789',
        cashBalance: 50000
      }
    ];

    setProperties(sampleProperties);
    setEntities(sampleEntities);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Calculate portfolio metrics
  const totalPropertyValue = properties.reduce((sum, prop) => sum + prop.currentValue, 0);
  const totalMonthlyRent = properties.reduce((sum, prop) => sum + prop.grossRent, 0);
  const totalCashFlow = properties.reduce((sum, prop) => sum + prop.cashFlow, 0);
  const totalUnits = properties.reduce((sum, prop) => sum + prop.units, 0);
  const totalEquityCreated = properties.reduce((sum, prop) => sum + prop.equityCreated, 0);
  const avgCoC = properties.length > 0 ? properties.reduce((sum, prop) => sum + prop.cocReturn, 0) / properties.length : 0;

  const handleSave = (id: number, updates: Partial<Property>) => {
    setProperties(prev => prev.map(prop => 
      prop.id === id ? { ...prop, ...updates } : prop
    ));
  };

  const handleEdit = (id: number) => {
    console.log('Edit property:', id);
  };

  const handleDelete = (id: number) => {
    setProperties(prev => prev.filter(prop => prop.id !== id));
  };

  const assignPropertyToEntity = (propertyId: number, entityId: string | null) => {
    setProperties(prev => prev.map(prop => 
      prop.id === propertyId ? { ...prop, entityId } : prop
    ));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Asset Management</h1>
          <p className="text-gray-500 mt-1">Portfolio overview and property management</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" />
          <span>Add Property</span>
        </button>
      </div>

      {/* KPI Bar */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold">{formatCurrency(totalPropertyValue)}</div>
            <div className="text-sm text-blue-100">Total Portfolio Value</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{formatCurrency(totalMonthlyRent)}</div>
            <div className="text-sm text-blue-100">Monthly Gross Rent</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{formatCurrency(totalCashFlow)}</div>
            <div className="text-sm text-blue-100">Monthly Cash Flow</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{totalUnits}</div>
            <div className="text-sm text-blue-100">Total Units</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{formatCurrency(totalEquityCreated)}</div>
            <div className="text-sm text-blue-100">Equity Created</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{formatPercent(avgCoC)}</div>
            <div className="text-sm text-blue-100">Avg CoC Return</div>
          </div>
        </div>
      </div>

      {/* Property Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {properties.map((property) => (
          <div key={property.id} className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{property.address}</h3>
                <p className="text-sm text-gray-500">{property.city}, {property.state}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {property.units} units
                  </span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    {property.strategy}
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(property.id)}
                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(property.id)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Entity</span>
                <select
                  value={property.entityId || ''}
                  onChange={(e) => assignPropertyToEntity(property.id, e.target.value || null)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Unassigned</option>
                  {entities.map((entity) => (
                    <option key={entity.id} value={entity.id}>
                      {entity.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Purchase Price</span>
                <EditableField
                  value={property.purchasePrice}
                  onSave={(value) => handleSave(property.id, { purchasePrice: value })}
                />
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Current Value</span>
                <EditableField
                  value={property.currentValue}
                  onSave={(value) => handleSave(property.id, { currentValue: value })}
                  className="font-semibold text-blue-600"
                />
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Monthly Rent</span>
                <EditableField
                  value={property.grossRent}
                  onSave={(value) => handleSave(property.id, { grossRent: value })}
                />
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Cash Flow</span>
                <EditableField
                  value={property.cashFlow}
                  onSave={(value) => handleSave(property.id, { cashFlow: value })}
                  className="font-semibold text-green-600"
                />
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">CoC Return</span>
                <EditableField
                  value={property.cocReturn}
                  onSave={(value) => handleSave(property.id, { cocReturn: value })}
                  format="percentage"
                  className="font-semibold"
                />
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-sm font-semibold text-gray-900">Equity Created</span>
                <span className="font-semibold text-purple-600">
                  {formatCurrency(property.equityCreated)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}