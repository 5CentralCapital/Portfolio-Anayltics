import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Cell
} from 'recharts';

interface PropertyData {
  id: string;
  address: string;
  city: string;
  state: string;
  units: number;
  acquisition_price: number;
  current_value: number;
  monthly_rent: number;
  cash_on_cash_return: number;
  annualized_return: number;
  status: string;
  equity_created: number;
  rental_yield: number;
}

interface PropertyPerformanceChartProps {
  data: PropertyData[];
  type?: 'returns' | 'equity' | 'scatter';
  height?: number;
}

const PropertyPerformanceChart: React.FC<PropertyPerformanceChartProps> = ({ 
  data, 
  type = 'returns', 
  height = 400 
}) => {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getPropertyLabel = (property: PropertyData) => {
    return `${property.address.split(' ')[0]}...`;
  };

  const formattedData = data.map(property => ({
    ...property,
    label: getPropertyLabel(property),
    equityCreatedK: property.equity_created / 1000,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg max-w-xs">
          <p className="font-semibold text-gray-900 mb-2">{data.address}</p>
          <p className="text-sm text-gray-600 mb-2">{data.city}, {data.state}</p>
          <div className="space-y-1 text-sm">
            <p>Units: {data.units}</p>
            <p>Cash-on-Cash: {formatPercentage(data.cash_on_cash_return)}</p>
            <p>Annualized Return: {formatPercentage(data.annualized_return)}</p>
            <p>Equity Created: {formatCurrency(data.equity_created)}</p>
            <p>Monthly Rent: {formatCurrency(data.monthly_rent)}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Color scheme for different performance levels
  const getBarColor = (value: number, type: 'return' | 'equity') => {
    if (type === 'return') {
      if (value >= 300) return '#16a34a'; // Green for high returns
      if (value >= 100) return '#eab308'; // Yellow for medium returns
      return '#dc2626'; // Red for low returns
    } else {
      if (value >= 500000) return '#16a34a';
      if (value >= 200000) return '#eab308';
      return '#dc2626';
    }
  };

  if (type === 'scatter') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            type="number" 
            dataKey="cash_on_cash_return" 
            name="Cash-on-Cash Return"
            stroke="#666"
            fontSize={12}
            tickFormatter={formatPercentage}
          />
          <YAxis 
            type="number" 
            dataKey="annualized_return" 
            name="Annualized Return"
            stroke="#666"
            fontSize={12}
            tickFormatter={formatPercentage}
          />
          <Tooltip content={<CustomTooltip />} />
          <Scatter name="Properties" data={formattedData} fill="#004B87">
            {formattedData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.status === 'active' ? '#004B87' : '#94a3b8'} 
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'equity') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="label" 
            stroke="#666"
            fontSize={12}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            stroke="#666"
            fontSize={12}
            tickFormatter={formatCurrency}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="equity_created" 
            name="Equity Created"
            radius={[2, 2, 0, 0]}
          >
            {formattedData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getBarColor(entry.equity_created, 'equity')} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="label" 
          stroke="#666"
          fontSize={12}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis 
          stroke="#666"
          fontSize={12}
          tickFormatter={formatPercentage}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar 
          dataKey="cash_on_cash_return" 
          name="Cash-on-Cash Return (%)"
          radius={[2, 2, 0, 0]}
        >
          {formattedData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={getBarColor(entry.cash_on_cash_return, 'return')} 
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default PropertyPerformanceChart;