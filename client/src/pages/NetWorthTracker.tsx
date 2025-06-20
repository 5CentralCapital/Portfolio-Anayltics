import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Building, 
  TrendingUp, 
  Wallet, 
  PieChart,
  Edit3,
  Save,
  Download,
  Printer,
  Plus,
  Minus,
  BarChart3,
  Target,
  Calendar
} from 'lucide-react';

interface NetWorthData {
  totalNetWorth: number;
  realEstateEquity: number;
  liquidAssets: number;
  monthlyCashFlow: number;
}

interface AssetAllocation {
  realEstate: {
    value: number;
    debt: number;
    equity: number;
    propertyCount: number;
  };
  stockPortfolio: {
    totalValue: number;
    unrealizedGainLoss: number;
    holdingsCount: number;
  };
  cashEquivalents: {
    totalValue: number;
    accountCount: number;
    avgInterestRate: number;
  };
}

interface Entity {
  id: number;
  name: string;
  totalValue: number;
  debt: number;
  equity: number;
  propertyCount: number;
}

interface EditableFieldProps {
  value: number;
  onSave: (value: number) => void;
  format?: 'currency' | 'percentage' | 'number';
  className?: string;
}

const EditableField: React.FC<EditableFieldProps> = ({ 
  value, 
  onSave, 
  format = 'currency', 
  className = '' 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());

  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val);
      case 'percentage':
        return `${val.toFixed(1)}%`;
      default:
        return val.toLocaleString();
    }
  };

  const handleSave = () => {
    const numValue = parseFloat(editValue.replace(/[^0-9.-]/g, ''));
    if (!isNaN(numValue)) {
      onSave(numValue);
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center space-x-2">
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') {
              setEditValue(value.toString());
              setIsEditing(false);
            }
          }}
          className="px-2 py-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
        <button
          onClick={handleSave}
          className="p-1 text-green-600 hover:text-green-700"
        >
          <Save className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div 
      className={`group flex items-center space-x-1 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded ${className}`}
      onClick={() => setIsEditing(true)}
    >
      <span>{formatValue(value)}</span>
      <Edit3 className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};

const NetWorthTracker: React.FC = () => {
  const [netWorthData, setNetWorthData] = useState<NetWorthData>({
    totalNetWorth: 2850000,
    realEstateEquity: 1950000,
    liquidAssets: 900000,
    monthlyCashFlow: 18500
  });

  const [assetAllocation, setAssetAllocation] = useState<AssetAllocation>({
    realEstate: {
      value: 3200000,
      debt: 1250000,
      equity: 1950000,
      propertyCount: 12
    },
    stockPortfolio: {
      totalValue: 650000,
      unrealizedGainLoss: 85000,
      holdingsCount: 25
    },
    cashEquivalents: {
      totalValue: 250000,
      accountCount: 4,
      avgInterestRate: 4.2
    }
  });

  const [entities, setEntities] = useState<Entity[]>([
    {
      id: 1,
      name: "5Central Capital LLC",
      totalValue: 2400000,
      debt: 950000,
      equity: 1450000,
      propertyCount: 8
    },
    {
      id: 2,
      name: "Crystal Holdings LLC",
      totalValue: 800000,
      debt: 300000,
      equity: 500000,
      propertyCount: 4
    }
  ]);

  const [viewMode, setViewMode] = useState<'current' | 'historical' | 'projections'>('current');

  // Auto-calculate derived values
  useEffect(() => {
    const totalEquity = assetAllocation.realEstate.equity;
    const totalLiquid = assetAllocation.stockPortfolio.totalValue + assetAllocation.cashEquivalents.totalValue;
    const totalNetWorth = totalEquity + totalLiquid;

    setNetWorthData(prev => ({
      ...prev,
      totalNetWorth,
      realEstateEquity: totalEquity,
      liquidAssets: totalLiquid
    }));
  }, [assetAllocation]);

  // Auto-calculate real estate equity
  useEffect(() => {
    setAssetAllocation(prev => ({
      ...prev,
      realEstate: {
        ...prev.realEstate,
        equity: prev.realEstate.value - prev.realEstate.debt
      }
    }));
  }, [assetAllocation.realEstate.value, assetAllocation.realEstate.debt]);

  const updateAssetValue = (category: keyof AssetAllocation, field: string, value: number) => {
    setAssetAllocation(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const updateEntity = (id: number, field: keyof Entity, value: number) => {
    setEntities(prev => prev.map(entity => 
      entity.id === id 
        ? { 
            ...entity, 
            [field]: value,
            ...(field === 'totalValue' || field === 'debt' ? { equity: entity.totalValue - entity.debt } : {})
          }
        : entity
    ));
  };

  const addEntity = () => {
    const newEntity: Entity = {
      id: Date.now(),
      name: "New Entity",
      totalValue: 0,
      debt: 0,
      equity: 0,
      propertyCount: 0
    };
    setEntities(prev => [...prev, newEntity]);
  };

  const removeEntity = (id: number) => {
    setEntities(prev => prev.filter(entity => entity.id !== id));
  };

  const calculatePercentage = (value: number, total: number) => {
    return total > 0 ? (value / total) * 100 : 0;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const exportData = () => {
    const exportData = {
      netWorth: netWorthData,
      assetAllocation,
      entities,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `net_worth_tracker_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Net Worth Tracker</h1>
          <p className="text-gray-600">Monitor asset allocation and real estate portfolio performance</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* View Mode Toggle */}
          <div className="flex bg-white rounded-lg border border-gray-200 p-1">
            {[
              { id: 'current', label: 'Current', icon: Target },
              { id: 'historical', label: 'Historical', icon: BarChart3 },
              { id: 'projections', label: 'Projections', icon: Calendar }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setViewMode(id as any)}
                className={`flex items-center px-3 py-2 rounded text-sm font-medium transition-colors ${
                  viewMode === id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="h-4 w-4 mr-1" />
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={exportData}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          
          <button
            onClick={printReport}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </button>
        </div>
      </div>

      {/* Top-Level KPI Tile */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <DollarSign className="h-8 w-8 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Total Net Worth</h3>
            </div>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(netWorthData.totalNetWorth)}</p>
            <p className="text-sm text-gray-500 mt-1">Auto-calculated</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Building className="h-8 w-8 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Real Estate Equity</h3>
            </div>
            <p className="text-3xl font-bold text-blue-600">{formatCurrency(netWorthData.realEstateEquity)}</p>
            <p className="text-sm text-gray-500 mt-1">Value - Debt</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Wallet className="h-8 w-8 text-purple-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Liquid Assets</h3>
            </div>
            <p className="text-3xl font-bold text-purple-600">{formatCurrency(netWorthData.liquidAssets)}</p>
            <p className="text-sm text-gray-500 mt-1">Cash + Stocks</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-8 w-8 text-orange-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Monthly Cash Flow</h3>
            </div>
            <div className="text-3xl font-bold text-orange-600">
              <EditableField
                value={netWorthData.monthlyCashFlow}
                onSave={(value) => setNetWorthData(prev => ({ ...prev, monthlyCashFlow: value }))}
                className="justify-center"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {formatCurrency(netWorthData.monthlyCashFlow * 12)} annually
            </p>
          </div>
        </div>
      </div>

      {/* Asset Allocation Module */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real Estate */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center mb-4">
            <Building className="h-6 w-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Real Estate</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Value:</span>
              <EditableField
                value={assetAllocation.realEstate.value}
                onSave={(value) => updateAssetValue('realEstate', 'value', value)}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Debt:</span>
              <EditableField
                value={assetAllocation.realEstate.debt}
                onSave={(value) => updateAssetValue('realEstate', 'debt', value)}
              />
            </div>
            
            <div className="flex justify-between items-center border-t pt-2">
              <span className="font-medium text-gray-900">Equity:</span>
              <span className="font-bold text-blue-600">
                {formatCurrency(assetAllocation.realEstate.equity)}
              </span>
            </div>
            
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex justify-between text-sm">
                <span>% of Net Worth</span>
                <span className="font-medium">
                  {calculatePercentage(assetAllocation.realEstate.equity, netWorthData.totalNetWorth).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ 
                    width: `${calculatePercentage(assetAllocation.realEstate.equity, netWorthData.totalNetWorth)}%` 
                  }}
                ></div>
              </div>
              <div className="text-sm text-gray-600 mt-2">
                {assetAllocation.realEstate.propertyCount} Properties
              </div>
            </div>
          </div>
        </div>

        {/* Stock Portfolio */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center mb-4">
            <TrendingUp className="h-6 w-6 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Stock Portfolio</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Value:</span>
              <EditableField
                value={assetAllocation.stockPortfolio.totalValue}
                onSave={(value) => updateAssetValue('stockPortfolio', 'totalValue', value)}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Unrealized Gain/Loss:</span>
              <EditableField
                value={assetAllocation.stockPortfolio.unrealizedGainLoss}
                onSave={(value) => updateAssetValue('stockPortfolio', 'unrealizedGainLoss', value)}
                className={assetAllocation.stockPortfolio.unrealizedGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}
              />
            </div>
            
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex justify-between text-sm">
                <span>% of Net Worth</span>
                <span className="font-medium">
                  {calculatePercentage(assetAllocation.stockPortfolio.totalValue, netWorthData.totalNetWorth).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-green-600 h-2 rounded-full"
                  style={{ 
                    width: `${calculatePercentage(assetAllocation.stockPortfolio.totalValue, netWorthData.totalNetWorth)}%` 
                  }}
                ></div>
              </div>
              <div className="text-sm text-gray-600 mt-2">
                {assetAllocation.stockPortfolio.holdingsCount} Holdings
              </div>
            </div>
          </div>
        </div>

        {/* Cash & Equivalents */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center mb-4">
            <Wallet className="h-6 w-6 text-purple-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Cash & Equivalents</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Value:</span>
              <EditableField
                value={assetAllocation.cashEquivalents.totalValue}
                onSave={(value) => updateAssetValue('cashEquivalents', 'totalValue', value)}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Avg Interest Rate:</span>
              <EditableField
                value={assetAllocation.cashEquivalents.avgInterestRate}
                onSave={(value) => updateAssetValue('cashEquivalents', 'avgInterestRate', value)}
                format="percentage"
              />
            </div>
            
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex justify-between text-sm">
                <span>% of Net Worth</span>
                <span className="font-medium">
                  {calculatePercentage(assetAllocation.cashEquivalents.totalValue, netWorthData.totalNetWorth).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full"
                  style={{ 
                    width: `${calculatePercentage(assetAllocation.cashEquivalents.totalValue, netWorthData.totalNetWorth)}%` 
                  }}
                ></div>
              </div>
              <div className="text-sm text-gray-600 mt-2">
                {assetAllocation.cashEquivalents.accountCount} Accounts
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real Estate by Entity Table */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Real Estate by Entity</h3>
          <button
            onClick={addEntity}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Entity
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Entity Name</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Total Value</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Debt</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Equity</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Properties</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entities.map((entity) => (
                <tr key={entity.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="font-medium text-gray-900">{entity.name}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <EditableField
                      value={entity.totalValue}
                      onSave={(value) => updateEntity(entity.id, 'totalValue', value)}
                    />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <EditableField
                      value={entity.debt}
                      onSave={(value) => updateEntity(entity.id, 'debt', value)}
                    />
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-blue-600">
                    {formatCurrency(entity.totalValue - entity.debt)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <EditableField
                      value={entity.propertyCount}
                      onSave={(value) => updateEntity(entity.id, 'propertyCount', value)}
                      format="number"
                    />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => removeEntity(entity.id)}
                      className="p-1 text-red-600 hover:text-red-700"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 bg-gray-50">
                <td className="py-3 px-4 font-bold text-gray-900">Total</td>
                <td className="py-3 px-4 text-right font-bold text-gray-900">
                  {formatCurrency(entities.reduce((sum, e) => sum + e.totalValue, 0))}
                </td>
                <td className="py-3 px-4 text-right font-bold text-gray-900">
                  {formatCurrency(entities.reduce((sum, e) => sum + e.debt, 0))}
                </td>
                <td className="py-3 px-4 text-right font-bold text-blue-600">
                  {formatCurrency(entities.reduce((sum, e) => sum + (e.totalValue - e.debt), 0))}
                </td>
                <td className="py-3 px-4 text-right font-bold text-gray-900">
                  {entities.reduce((sum, e) => sum + e.propertyCount, 0)}
                </td>
                <td className="py-3 px-4"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default NetWorthTracker;