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
    <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Net Worth Dashboard</h1>
          <p className="text-lg text-gray-600">Real-time wealth tracking and asset allocation analysis</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* View Mode Toggle */}
          <div className="flex bg-white rounded-xl shadow-md border border-gray-100 p-1">
            {[
              { id: 'current', label: 'Current', icon: Target },
              { id: 'historical', label: 'Historical', icon: BarChart3 },
              { id: 'projections', label: 'Projections', icon: Calendar }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setViewMode(id as any)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === id
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={exportData}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-md"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          
          <button
            onClick={printReport}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </button>
        </div>
      </div>

      {/* Main Net Worth Summary Card */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-2xl shadow-2xl p-8 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Total Net Worth</h2>
            <p className="text-indigo-100">Updated in real-time</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-full p-4">
            <DollarSign className="h-12 w-12" />
          </div>
        </div>
        <div className="text-6xl font-bold mb-4">{formatCurrency(netWorthData.totalNetWorth)}</div>
        <div className="grid grid-cols-3 gap-6 mt-8">
          <div className="bg-white bg-opacity-15 rounded-xl p-4">
            <div className="flex items-center mb-2">
              <Building className="h-6 w-6 mr-2 text-blue-200" />
              <span className="text-blue-100 text-sm font-medium">Real Estate Equity</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(netWorthData.realEstateEquity)}</div>
            <div className="text-blue-100 text-sm mt-1">
              {calculatePercentage(netWorthData.realEstateEquity, netWorthData.totalNetWorth).toFixed(1)}% of total
            </div>
          </div>
          
          <div className="bg-white bg-opacity-15 rounded-xl p-4">
            <div className="flex items-center mb-2">
              <TrendingUp className="h-6 w-6 mr-2 text-green-200" />
              <span className="text-green-100 text-sm font-medium">Liquid Assets</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(netWorthData.liquidAssets)}</div>
            <div className="text-green-100 text-sm mt-1">
              {calculatePercentage(netWorthData.liquidAssets, netWorthData.totalNetWorth).toFixed(1)}% of total
            </div>
          </div>
          
          <div className="bg-white bg-opacity-15 rounded-xl p-4">
            <div className="flex items-center mb-2">
              <Wallet className="h-6 w-6 mr-2 text-purple-200" />
              <span className="text-purple-100 text-sm font-medium">Monthly Cash Flow</span>
            </div>
            <div className="text-2xl font-bold">
              <EditableField
                value={netWorthData.monthlyCashFlow}
                onSave={(value) => setNetWorthData(prev => ({ ...prev, monthlyCashFlow: value }))}
                className="text-white"
              />
            </div>
            <div className="text-purple-100 text-sm mt-1">
              {formatCurrency(netWorthData.monthlyCashFlow * 12)} annually
            </div>
          </div>
        </div>
      </div>

      {/* Asset Allocation & Portfolio Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Asset Allocation Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Asset Allocation</h3>
          
          {/* Circular Progress Indicators */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-3">
                <div className="w-20 h-20 rounded-full border-8 border-gray-200"></div>
                <div 
                  className="absolute top-0 left-0 w-20 h-20 rounded-full border-8 border-blue-500 border-t-transparent transform -rotate-90"
                  style={{
                    background: `conic-gradient(#3b82f6 ${calculatePercentage(assetAllocation.realEstate.equity, netWorthData.totalNetWorth) * 3.6}deg, transparent 0deg)`
                  }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">
                    {calculatePercentage(assetAllocation.realEstate.equity, netWorthData.totalNetWorth).toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="text-sm font-medium text-gray-700">Real Estate</div>
              <div className="text-lg font-bold text-blue-600">{formatCurrency(assetAllocation.realEstate.equity)}</div>
            </div>
            
            <div className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-3">
                <div className="w-20 h-20 rounded-full border-8 border-gray-200"></div>
                <div 
                  className="absolute top-0 left-0 w-20 h-20 rounded-full border-8 border-green-500 border-t-transparent transform -rotate-90"
                  style={{
                    background: `conic-gradient(#10b981 ${calculatePercentage(assetAllocation.stockPortfolio.totalValue, netWorthData.totalNetWorth) * 3.6}deg, transparent 0deg)`
                  }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-green-600">
                    {calculatePercentage(assetAllocation.stockPortfolio.totalValue, netWorthData.totalNetWorth).toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="text-sm font-medium text-gray-700">Stocks</div>
              <div className="text-lg font-bold text-green-600">{formatCurrency(assetAllocation.stockPortfolio.totalValue)}</div>
            </div>
            
            <div className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-3">
                <div className="w-20 h-20 rounded-full border-8 border-gray-200"></div>
                <div 
                  className="absolute top-0 left-0 w-20 h-20 rounded-full border-8 border-purple-500 border-t-transparent transform -rotate-90"
                  style={{
                    background: `conic-gradient(#8b5cf6 ${calculatePercentage(assetAllocation.cashEquivalents.totalValue, netWorthData.totalNetWorth) * 3.6}deg, transparent 0deg)`
                  }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-purple-600">
                    {calculatePercentage(assetAllocation.cashEquivalents.totalValue, netWorthData.totalNetWorth).toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="text-sm font-medium text-gray-700">Cash</div>
              <div className="text-lg font-bold text-purple-600">{formatCurrency(assetAllocation.cashEquivalents.totalValue)}</div>
            </div>
          </div>
          
          {/* Linear Progress Bars */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Real Estate Portfolio</span>
                <span className="text-sm text-gray-500">{assetAllocation.realEstate.propertyCount} properties</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${calculatePercentage(assetAllocation.realEstate.equity, netWorthData.totalNetWorth)}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Stock Portfolio</span>
                <span className="text-sm text-gray-500">{assetAllocation.stockPortfolio.holdingsCount} holdings</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${calculatePercentage(assetAllocation.stockPortfolio.totalValue, netWorthData.totalNetWorth)}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Cash & Equivalents</span>
                <span className="text-sm text-gray-500">{assetAllocation.cashEquivalents.accountCount} accounts</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${calculatePercentage(assetAllocation.cashEquivalents.totalValue, netWorthData.totalNetWorth)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Real Estate Details */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 rounded-lg p-2 mr-3">
              <Building className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Real Estate</h3>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Total Value</div>
              <EditableField
                value={assetAllocation.realEstate.value}
                onSave={(value) => updateAssetValue('realEstate', 'value', value)}
                className="text-lg font-bold"
              />
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Total Debt</div>
              <EditableField
                value={assetAllocation.realEstate.debt}
                onSave={(value) => updateAssetValue('realEstate', 'debt', value)}
                className="text-lg font-bold"
              />
            </div>
            
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <div className="text-xs text-blue-600 mb-1">Net Equity</div>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(assetAllocation.realEstate.equity)}
              </div>
            </div>
          </div>
        </div>

        {/* Investment Portfolio */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center mb-4">
            <div className="bg-green-100 rounded-lg p-2 mr-3">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Investments</h3>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Stock Portfolio</div>
              <EditableField
                value={assetAllocation.stockPortfolio.totalValue}
                onSave={(value) => updateAssetValue('stockPortfolio', 'totalValue', value)}
                className="text-lg font-bold"
              />
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Unrealized Gain/Loss</div>
              <EditableField
                value={assetAllocation.stockPortfolio.unrealizedGainLoss}
                onSave={(value) => updateAssetValue('stockPortfolio', 'unrealizedGainLoss', value)}
                className={`text-lg font-bold ${assetAllocation.stockPortfolio.unrealizedGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}
              />
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Cash & Equivalents</div>
              <EditableField
                value={assetAllocation.cashEquivalents.totalValue}
                onSave={(value) => updateAssetValue('cashEquivalents', 'totalValue', value)}
                className="text-lg font-bold"
              />
              <div className="text-xs text-gray-500 mt-2">
                Avg Rate: 
                <EditableField
                  value={assetAllocation.cashEquivalents.avgInterestRate}
                  onSave={(value) => updateAssetValue('cashEquivalents', 'avgInterestRate', value)}
                  format="percentage"
                  className="ml-1 text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real Estate Holdings by Entity */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="bg-indigo-100 rounded-lg p-2 mr-3">
              <Building className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Real Estate Holdings</h3>
              <p className="text-sm text-gray-600">Portfolio breakdown by entity</p>
            </div>
          </div>
          <button
            onClick={addEntity}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Entity
          </button>
        </div>
        
        {/* Entity Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {entities.map((entity) => (
            <div key={entity.id} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-gray-900">{entity.name}</h4>
                <button
                  onClick={() => removeEntity(entity.id)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">Total Value</div>
                  <EditableField
                    value={entity.totalValue}
                    onSave={(value) => updateEntity(entity.id, 'totalValue', value)}
                    className="text-sm font-bold"
                  />
                </div>
                
                <div className="bg-white rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">Debt</div>
                  <EditableField
                    value={entity.debt}
                    onSave={(value) => updateEntity(entity.id, 'debt', value)}
                    className="text-sm font-bold"
                  />
                </div>
                
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="text-xs text-blue-600 mb-1">Net Equity</div>
                  <div className="text-lg font-bold text-blue-600">
                    {formatCurrency(entity.totalValue - entity.debt)}
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">Properties</div>
                  <EditableField
                    value={entity.propertyCount}
                    onSave={(value) => updateEntity(entity.id, 'propertyCount', value)}
                    format="number"
                    className="text-sm font-bold"
                  />
                </div>
              </div>
              
              {/* Entity Performance Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Portfolio Share</span>
                  <span>{calculatePercentage(entity.totalValue - entity.debt, entities.reduce((sum, e) => sum + (e.totalValue - e.debt), 0)).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${calculatePercentage(entity.totalValue - entity.debt, entities.reduce((sum, e) => sum + (e.totalValue - e.debt), 0))}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Summary Totals */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
          <h4 className="text-lg font-bold mb-4">Portfolio Summary</h4>
          <div className="grid grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {formatCurrency(entities.reduce((sum, e) => sum + e.totalValue, 0))}
              </div>
              <div className="text-indigo-100 text-sm">Total Value</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {formatCurrency(entities.reduce((sum, e) => sum + e.debt, 0))}
              </div>
              <div className="text-indigo-100 text-sm">Total Debt</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {formatCurrency(entities.reduce((sum, e) => sum + (e.totalValue - e.debt), 0))}
              </div>
              <div className="text-indigo-100 text-sm">Net Equity</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {entities.reduce((sum, e) => sum + e.propertyCount, 0)}
              </div>
              <div className="text-indigo-100 text-sm">Properties</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetWorthTracker;