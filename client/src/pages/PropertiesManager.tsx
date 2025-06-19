import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit3,
  Save,
  X,
  Trash2,
  Calculator,
  DollarSign,
  Building,
  TrendingUp,
  Home,
  Target,
  PieChart,
  Download,
  Upload
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

export default function PropertiesManager() {
  const [properties, setProperties] = useState<Property[]>([
    {
      id: 1,
      address: '175 Crystal Ave',
      city: 'New London',
      state: 'CT',
      zipCode: '06320',
      units: 4,
      purchasePrice: 350000,
      purchaseDate: '2021-03-15',
      rehabCosts: 85000,
      totalInvestment: 435000,
      currentValue: 650000,
      grossRent: 4200,
      netRent: 3990,
      expenses: 1890,
      noi: 2100,
      cashFlow: 1950,
      capRate: 0.058,
      cocReturn: 0.537,
      annualizedReturn: 0.089,
      equityCreated: 215000,
      status: 'Active',
      propertyType: 'Multifamily',
      strategy: 'BRRRR'
    },
    {
      id: 2,
      address: '3408 E Dr MLK BLVD',
      city: 'Tampa',
      state: 'FL',
      zipCode: '33610',
      units: 8,
      purchasePrice: 485000,
      purchaseDate: '2021-08-22',
      rehabCosts: 125000,
      totalInvestment: 610000,
      currentValue: 875000,
      grossRent: 7200,
      netRent: 6840,
      expenses: 3024,
      noi: 3816,
      cashFlow: 3450,
      capRate: 0.063,
      cocReturn: 0.679,
      annualizedReturn: 0.124,
      equityCreated: 265000,
      status: 'Active',
      propertyType: 'Multifamily',
      strategy: 'Value-Add'
    },
    {
      id: 3,
      address: '1 Harmony St',
      city: 'New London',
      state: 'CT',
      zipCode: '06320',
      units: 6,
      purchasePrice: 425000,
      purchaseDate: '2022-01-10',
      rehabCosts: 95000,
      totalInvestment: 520000,
      currentValue: 725000,
      grossRent: 5400,
      netRent: 5130,
      expenses: 2160,
      noi: 2970,
      cashFlow: 2700,
      capRate: 0.061,
      cocReturn: 0.623,
      annualizedReturn: 0.115,
      equityCreated: 205000,
      status: 'Active',
      propertyType: 'Multifamily',
      strategy: 'BRRRR'
    },
    {
      id: 4,
      address: '145 Crystal Ave',
      city: 'New London',
      state: 'CT',
      zipCode: '06320',
      units: 3,
      purchasePrice: 285000,
      purchaseDate: '2022-05-18',
      rehabCosts: 65000,
      totalInvestment: 350000,
      currentValue: 485000,
      grossRent: 3300,
      netRent: 3135,
      expenses: 1320,
      noi: 1815,
      cashFlow: 1650,
      capRate: 0.055,
      cocReturn: 0.566,
      annualizedReturn: 0.096,
      equityCreated: 135000,
      status: 'Active',
      propertyType: 'Multifamily',
      strategy: 'Buy & Hold'
    },
    {
      id: 5,
      address: '25 Huntington PL',
      city: 'New London',
      state: 'CT',
      zipCode: '06320',
      units: 2,
      purchasePrice: 195000,
      purchaseDate: '2022-09-12',
      rehabCosts: 45000,
      totalInvestment: 240000,
      currentValue: 345000,
      grossRent: 2400,
      netRent: 2280,
      expenses: 960,
      noi: 1320,
      cashFlow: 1200,
      capRate: 0.055,
      cocReturn: 0.6,
      annualizedReturn: 0.105,
      equityCreated: 105000,
      status: 'Active',
      propertyType: 'Multifamily',
      strategy: 'BRRRR'
    }
  ]);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [newProperty, setNewProperty] = useState<Partial<Property>>({});
  const [showAddForm, setShowAddForm] = useState(false);

  // Calculate portfolio metrics
  const calculatePortfolioMetrics = () => {
    const totalProperties = properties.length;
    const totalUnits = properties.reduce((sum, prop) => sum + prop.units, 0);
    const totalValue = properties.reduce((sum, prop) => sum + prop.currentValue, 0);
    const totalInvestment = properties.reduce((sum, prop) => sum + prop.totalInvestment, 0);
    const totalEquityCreated = properties.reduce((sum, prop) => sum + prop.equityCreated, 0);
    const totalMonthlyRent = properties.reduce((sum, prop) => sum + prop.grossRent, 0);
    const totalMonthlyCashFlow = properties.reduce((sum, prop) => sum + prop.cashFlow, 0);
    const avgCashOnCash = properties.length > 0 ? 
      properties.reduce((sum, prop) => sum + prop.cocReturn, 0) / properties.length : 0;
    const avgAnnualizedReturn = properties.length > 0 ? 
      properties.reduce((sum, prop) => sum + prop.annualizedReturn, 0) / properties.length : 0;
    const avgCapRate = properties.length > 0 ? 
      properties.reduce((sum, prop) => sum + prop.capRate, 0) / properties.length : 0;

    return {
      totalProperties,
      totalUnits,
      totalValue,
      totalInvestment,
      totalEquityCreated,
      totalMonthlyRent,
      totalMonthlyCashFlow,
      avgCashOnCash,
      avgAnnualizedReturn,
      avgCapRate,
      equityMultiple: totalInvestment > 0 ? totalValue / totalInvestment : 0,
      totalROI: totalInvestment > 0 ? (totalValue - totalInvestment) / totalInvestment : 0
    };
  };

  const metrics = calculatePortfolioMetrics();

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

  const handleEdit = (id: number) => {
    setEditingId(id);
  };

  const handleSave = (id: number, updatedProperty: Partial<Property>) => {
    setProperties(properties.map(prop => 
      prop.id === id ? { ...prop, ...updatedProperty } : prop
    ));
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      setProperties(properties.filter(prop => prop.id !== id));
    }
  };

  const handleAddProperty = () => {
    if (newProperty.address && newProperty.city && newProperty.state) {
      const id = Math.max(...properties.map(p => p.id), 0) + 1;
      const property: Property = {
        id,
        address: newProperty.address || '',
        city: newProperty.city || '',
        state: newProperty.state || '',
        zipCode: newProperty.zipCode || '',
        units: newProperty.units || 1,
        purchasePrice: newProperty.purchasePrice || 0,
        purchaseDate: newProperty.purchaseDate || new Date().toISOString().split('T')[0],
        rehabCosts: newProperty.rehabCosts || 0,
        totalInvestment: (newProperty.purchasePrice || 0) + (newProperty.rehabCosts || 0),
        currentValue: newProperty.currentValue || 0,
        grossRent: newProperty.grossRent || 0,
        netRent: (newProperty.grossRent || 0) * 0.95, // Assume 5% vacancy
        expenses: newProperty.expenses || 0,
        noi: ((newProperty.grossRent || 0) * 0.95) - (newProperty.expenses || 0),
        cashFlow: newProperty.cashFlow || 0,
        capRate: newProperty.currentValue ? ((((newProperty.grossRent || 0) * 0.95) - (newProperty.expenses || 0)) * 12) / newProperty.currentValue : 0,
        cocReturn: newProperty.cocReturn || 0,
        annualizedReturn: newProperty.annualizedReturn || 0,
        equityCreated: (newProperty.currentValue || 0) - ((newProperty.purchasePrice || 0) + (newProperty.rehabCosts || 0)),
        status: (newProperty.status as Property['status']) || 'Active',
        propertyType: (newProperty.propertyType as Property['propertyType']) || 'Multifamily',
        strategy: (newProperty.strategy as Property['strategy']) || 'Buy & Hold'
      };
      setProperties([...properties, property]);
      setNewProperty({});
      setShowAddForm(false);
    }
  };

  const EditableCell = ({ 
    value, 
    type = 'text', 
    onChange, 
    isEditing, 
    format,
    options 
  }: {
    value: any;
    type?: string;
    onChange: (value: any) => void;
    isEditing: boolean;
    format?: (val: any) => string;
    options?: string[];
  }) => {
    if (!isEditing) {
      return <span>{format ? format(value) : value}</span>;
    }

    if (options) {
      return (
        <select 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-1 py-1 text-xs border border-gray-300 rounded"
        >
          {options.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      );
    }

    return (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
        className="w-full px-1 py-1 text-xs border border-gray-300 rounded"
      />
    );
  };

  const PropertyRow = ({ property }: { property: Property }) => {
    const isEditing = editingId === property.id;
    const [editData, setEditData] = useState(property);

    useEffect(() => {
      if (isEditing) {
        setEditData(property);
      }
    }, [isEditing, property]);

    const updateField = (field: keyof Property, value: any) => {
      setEditData(prev => ({ ...prev, [field]: value }));
    };

    return (
      <tr className="border-b hover:bg-gray-50">
        <td className="px-2 py-2 text-xs">
          <EditableCell 
            value={editData.address} 
            onChange={(v) => updateField('address', v)}
            isEditing={isEditing}
          />
        </td>
        <td className="px-2 py-2 text-xs">
          <EditableCell 
            value={editData.city} 
            onChange={(v) => updateField('city', v)}
            isEditing={isEditing}
          />
        </td>
        <td className="px-2 py-2 text-xs">
          <EditableCell 
            value={editData.state} 
            onChange={(v) => updateField('state', v)}
            isEditing={isEditing}
          />
        </td>
        <td className="px-2 py-2 text-xs">
          <EditableCell 
            value={editData.zipCode} 
            onChange={(v) => updateField('zipCode', v)}
            isEditing={isEditing}
          />
        </td>
        <td className="px-2 py-2 text-xs">
          <EditableCell 
            value={editData.units} 
            type="number"
            onChange={(v) => updateField('units', v)}
            isEditing={isEditing}
          />
        </td>
        <td className="px-2 py-2 text-xs">
          <EditableCell 
            value={editData.purchasePrice} 
            type="number"
            onChange={(v) => updateField('purchasePrice', v)}
            isEditing={isEditing}
            format={formatCurrency}
          />
        </td>
        <td className="px-2 py-2 text-xs">
          <EditableCell 
            value={editData.purchaseDate} 
            type="date"
            onChange={(v) => updateField('purchaseDate', v)}
            isEditing={isEditing}
          />
        </td>
        <td className="px-2 py-2 text-xs">
          <EditableCell 
            value={editData.rehabCosts} 
            type="number"
            onChange={(v) => updateField('rehabCosts', v)}
            isEditing={isEditing}
            format={formatCurrency}
          />
        </td>
        <td className="px-2 py-2 text-xs font-medium">
          {formatCurrency(editData.purchasePrice + editData.rehabCosts)}
        </td>
        <td className="px-2 py-2 text-xs">
          <EditableCell 
            value={editData.currentValue} 
            type="number"
            onChange={(v) => updateField('currentValue', v)}
            isEditing={isEditing}
            format={formatCurrency}
          />
        </td>
        <td className="px-2 py-2 text-xs">
          <EditableCell 
            value={editData.grossRent} 
            type="number"
            onChange={(v) => updateField('grossRent', v)}
            isEditing={isEditing}
            format={formatCurrency}
          />
        </td>
        <td className="px-2 py-2 text-xs">
          <EditableCell 
            value={editData.expenses} 
            type="number"
            onChange={(v) => updateField('expenses', v)}
            isEditing={isEditing}
            format={formatCurrency}
          />
        </td>
        <td className="px-2 py-2 text-xs font-medium">
          {formatCurrency((editData.grossRent * 0.95) - editData.expenses)}
        </td>
        <td className="px-2 py-2 text-xs">
          <EditableCell 
            value={editData.cashFlow} 
            type="number"
            onChange={(v) => updateField('cashFlow', v)}
            isEditing={isEditing}
            format={formatCurrency}
          />
        </td>
        <td className="px-2 py-2 text-xs font-medium">
          {formatPercent(editData.currentValue ? (((editData.grossRent * 0.95) - editData.expenses) * 12) / editData.currentValue : 0)}
        </td>
        <td className="px-2 py-2 text-xs">
          <EditableCell 
            value={editData.cocReturn} 
            type="number"
            onChange={(v) => updateField('cocReturn', v)}
            isEditing={isEditing}
            format={(v) => formatPercent(v)}
          />
        </td>
        <td className="px-2 py-2 text-xs">
          <EditableCell 
            value={editData.annualizedReturn} 
            type="number"
            onChange={(v) => updateField('annualizedReturn', v)}
            isEditing={isEditing}
            format={(v) => formatPercent(v)}
          />
        </td>
        <td className="px-2 py-2 text-xs font-medium text-green-600">
          {formatCurrency(editData.currentValue - (editData.purchasePrice + editData.rehabCosts))}
        </td>
        <td className="px-2 py-2 text-xs">
          <EditableCell 
            value={editData.status} 
            onChange={(v) => updateField('status', v)}
            isEditing={isEditing}
            options={['Active', 'Sold', 'Under Contract', 'Rehab']}
          />
        </td>
        <td className="px-2 py-2 text-xs">
          <EditableCell 
            value={editData.propertyType} 
            onChange={(v) => updateField('propertyType', v)}
            isEditing={isEditing}
            options={['Multifamily', 'Single Family', 'Commercial']}
          />
        </td>
        <td className="px-2 py-2 text-xs">
          <EditableCell 
            value={editData.strategy} 
            onChange={(v) => updateField('strategy', v)}
            isEditing={isEditing}
            options={['Buy & Hold', 'Fix & Flip', 'BRRRR', 'Value-Add']}
          />
        </td>
        <td className="px-2 py-2 text-xs">
          <div className="flex space-x-1">
            {isEditing ? (
              <>
                <button
                  onClick={() => handleSave(property.id, editData)}
                  className="text-green-600 hover:text-green-800"
                >
                  <Save className="h-3 w-3" />
                </button>
                <button
                  onClick={handleCancel}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleEdit(property.id)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Edit3 className="h-3 w-3" />
                </button>
                <button
                  onClick={() => handleDelete(property.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Properties Management</h1>
            <p className="text-gray-600">Manage your real estate portfolio with Excel-style editing</p>
          </div>
          <div className="flex space-x-3">
            <button className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <button className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </button>
            <button 
              onClick={() => setShowAddForm(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </button>
          </div>
        </div>
      </div>

      {/* Portfolio Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Total Properties</p>
              <p className="text-xl font-bold text-gray-900">{metrics.totalProperties}</p>
            </div>
            <Building className="h-6 w-6 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Total Units</p>
              <p className="text-xl font-bold text-gray-900">{metrics.totalUnits}</p>
            </div>
            <Home className="h-6 w-6 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Portfolio Value</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(metrics.totalValue)}</p>
            </div>
            <DollarSign className="h-6 w-6 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Total Investment</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(metrics.totalInvestment)}</p>
            </div>
            <Calculator className="h-6 w-6 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Equity Created</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(metrics.totalEquityCreated)}</p>
            </div>
            <TrendingUp className="h-6 w-6 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Monthly Rent</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(metrics.totalMonthlyRent)}</p>
            </div>
            <Target className="h-6 w-6 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Avg Cash-on-Cash</p>
              <p className="text-xl font-bold text-green-600">{formatPercent(metrics.avgCashOnCash)}</p>
            </div>
            <PieChart className="h-6 w-6 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Avg Annual Return</p>
              <p className="text-xl font-bold text-green-600">{formatPercent(metrics.avgAnnualizedReturn)}</p>
            </div>
            <TrendingUp className="h-6 w-6 text-green-600" />
          </div>
        </div>
      </div>

      {/* Add Property Form */}
      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Property</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Address"
              value={newProperty.address || ''}
              onChange={(e) => setNewProperty({...newProperty, address: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <input
              type="text"
              placeholder="City"
              value={newProperty.city || ''}
              onChange={(e) => setNewProperty({...newProperty, city: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <input
              type="text"
              placeholder="State"
              value={newProperty.state || ''}
              onChange={(e) => setNewProperty({...newProperty, state: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <input
              type="text"
              placeholder="Zip Code"
              value={newProperty.zipCode || ''}
              onChange={(e) => setNewProperty({...newProperty, zipCode: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <input
              type="number"
              placeholder="Units"
              value={newProperty.units || ''}
              onChange={(e) => setNewProperty({...newProperty, units: parseInt(e.target.value) || 0})}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <input
              type="number"
              placeholder="Purchase Price"
              value={newProperty.purchasePrice || ''}
              onChange={(e) => setNewProperty({...newProperty, purchasePrice: parseInt(e.target.value) || 0})}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <input
              type="number"
              placeholder="Rehab Costs"
              value={newProperty.rehabCosts || ''}
              onChange={(e) => setNewProperty({...newProperty, rehabCosts: parseInt(e.target.value) || 0})}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <input
              type="number"
              placeholder="Current Value"
              value={newProperty.currentValue || ''}
              onChange={(e) => setNewProperty({...newProperty, currentValue: parseInt(e.target.value) || 0})}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div className="flex space-x-3 mt-4">
            <button 
              onClick={handleAddProperty}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Property
            </button>
            <button 
              onClick={() => {setShowAddForm(false); setNewProperty({});}}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Properties Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-3 text-left font-medium text-gray-900">Address</th>
                <th className="px-2 py-3 text-left font-medium text-gray-900">City</th>
                <th className="px-2 py-3 text-left font-medium text-gray-900">State</th>
                <th className="px-2 py-3 text-left font-medium text-gray-900">Zip</th>
                <th className="px-2 py-3 text-left font-medium text-gray-900">Units</th>
                <th className="px-2 py-3 text-left font-medium text-gray-900">Purchase Price</th>
                <th className="px-2 py-3 text-left font-medium text-gray-900">Purchase Date</th>
                <th className="px-2 py-3 text-left font-medium text-gray-900">Rehab Costs</th>
                <th className="px-2 py-3 text-left font-medium text-gray-900 bg-yellow-50">Total Investment</th>
                <th className="px-2 py-3 text-left font-medium text-gray-900">Current Value</th>
                <th className="px-2 py-3 text-left font-medium text-gray-900">Gross Rent</th>
                <th className="px-2 py-3 text-left font-medium text-gray-900">Expenses</th>
                <th className="px-2 py-3 text-left font-medium text-gray-900 bg-blue-50">NOI</th>
                <th className="px-2 py-3 text-left font-medium text-gray-900">Cash Flow</th>
                <th className="px-2 py-3 text-left font-medium text-gray-900 bg-green-50">Cap Rate</th>
                <th className="px-2 py-3 text-left font-medium text-gray-900">CoC Return</th>
                <th className="px-2 py-3 text-left font-medium text-gray-900">Annual Return</th>
                <th className="px-2 py-3 text-left font-medium text-gray-900 bg-green-50">Equity Created</th>
                <th className="px-2 py-3 text-left font-medium text-gray-900">Status</th>
                <th className="px-2 py-3 text-left font-medium text-gray-900">Type</th>
                <th className="px-2 py-3 text-left font-medium text-gray-900">Strategy</th>
                <th className="px-2 py-3 text-left font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {properties.map((property) => (
                <PropertyRow key={property.id} property={property} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Row */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          <div>
            <p className="text-sm text-gray-600">Total Portfolio Value</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(metrics.totalValue)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Investment</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.totalInvestment)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Equity Created</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(metrics.totalEquityCreated)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Monthly Cash Flow</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(metrics.totalMonthlyCashFlow)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Equity Multiple</p>
            <p className="text-2xl font-bold text-purple-600">{metrics.equityMultiple.toFixed(2)}x</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total ROI</p>
            <p className="text-2xl font-bold text-green-600">{formatPercent(metrics.totalROI)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}