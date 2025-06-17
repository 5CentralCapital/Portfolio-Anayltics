import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { format } from 'date-fns';

interface RevenueData {
  metric_date: string;
  revenue: number;
  expenses: number;
  profit_margin: number;
  monthly_recurring_revenue: number;
}

interface RevenueChartProps {
  data: RevenueData[];
  type?: 'line' | 'bar';
  height?: number;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ 
  data, 
  type = 'line', 
  height = 300 
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM yyyy');
    } catch {
      return dateString;
    }
  };

  const formattedData = data.map(item => ({
    ...item,
    month: formatDate(item.metric_date),
    profit: item.revenue - item.expenses,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="month" 
            stroke="#666"
            fontSize={12}
          />
          <YAxis 
            stroke="#666"
            fontSize={12}
            tickFormatter={formatCurrency}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="revenue" 
            fill="#004B87" 
            name="Revenue"
            radius={[2, 2, 0, 0]}
          />
          <Bar 
            dataKey="expenses" 
            fill="#dc2626" 
            name="Expenses"
            radius={[2, 2, 0, 0]}
          />
          <Bar 
            dataKey="profit" 
            fill="#16a34a" 
            name="Profit"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="month" 
          stroke="#666"
          fontSize={12}
        />
        <YAxis 
          stroke="#666"
          fontSize={12}
          tickFormatter={formatCurrency}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="revenue" 
          stroke="#004B87" 
          strokeWidth={3}
          name="Revenue"
          dot={{ fill: '#004B87', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: '#004B87', strokeWidth: 2 }}
        />
        <Line 
          type="monotone" 
          dataKey="expenses" 
          stroke="#dc2626" 
          strokeWidth={3}
          name="Expenses"
          dot={{ fill: '#dc2626', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: '#dc2626', strokeWidth: 2 }}
        />
        <Line 
          type="monotone" 
          dataKey="monthly_recurring_revenue" 
          stroke="#16a34a" 
          strokeWidth={3}
          name="MRR"
          dot={{ fill: '#16a34a', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: '#16a34a', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default RevenueChart;