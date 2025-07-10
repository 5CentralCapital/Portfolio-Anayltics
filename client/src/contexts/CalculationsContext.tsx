import React, { createContext, useContext } from 'react';
import { calculatePropertyWithLegacy, formatters, type CalculationResult } from '@shared/calculations/calculation-engine';

interface CalculationsContextType {
  calculateProperty: (property: any) => any; // Using any for backward compatibility
  formatCurrency: (value: number | string | undefined | null) => string;
  formatPercentage: (value: number | undefined | null, decimals?: number) => string;
  calculatePortfolioMetrics: (properties: any[]) => any;
}

const CalculationsContext = createContext<CalculationsContextType | undefined>(undefined);

export const CalculationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const calculatePortfolioMetrics = (properties: any[]) => {
    let totalAUM = 0;
    let totalUnits = 0;
    let totalEquity = 0;
    let totalMonthlyCashFlow = 0;
    let totalEquityMultiples = 0;
    let totalCoCReturns = 0;
    let propertiesWithMetrics = 0;
    
    properties.forEach(property => {
      const metrics = calculatePropertyWithLegacy(property);
      
      // Only include active properties for AUM (exclude sold)
      if (property.status !== 'Sold') {
        totalAUM += metrics.currentARV;
        totalUnits += property.apartments || 0;
        totalEquity += metrics.currentEquity;
        
        if (property.status === 'Cashflowing') {
          totalMonthlyCashFlow += metrics.monthlyCashFlow;
        }
        
        if (metrics.equityMultiple > 0) {
          totalEquityMultiples += metrics.equityMultiple;
          propertiesWithMetrics++;
        }
        
        if (metrics.cashOnCashReturn > 0) {
          totalCoCReturns += metrics.cashOnCashReturn;
        }
      }
    });
    
    return {
      totalAUM,
      totalUnits,
      totalEquity,
      currentMonthlyIncome: totalMonthlyCashFlow,
      pricePerUnit: totalUnits > 0 ? totalAUM / totalUnits : 0,
      avgEquityMultiple: propertiesWithMetrics > 0 ? totalEquityMultiples / propertiesWithMetrics : 0,
      avgCoCReturn: propertiesWithMetrics > 0 ? (totalCoCReturns / propertiesWithMetrics) * 100 : 0 // Convert to percentage for display
    };
  };

  // Wrapper functions to handle type conversions
  const formatCurrency = (value: number | string | undefined | null): string => {
    if (value === undefined || value === null) return '$0';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '$0';
    return formatters.currency(numValue);
  };

  const formatPercentage = (value: number | undefined | null, decimals: number = 1): string => {
    if (value === undefined || value === null || isNaN(value)) return '0.0%';
    return formatters.percentage(value, decimals);
  };

  const value = {
    calculateProperty: calculatePropertyWithLegacy,
    formatCurrency,
    formatPercentage,
    calculatePortfolioMetrics
  };

  return (
    <CalculationsContext.Provider value={value}>
      {children}
    </CalculationsContext.Provider>
  );
};

export const useCalculations = () => {
  const context = useContext(CalculationsContext);
  if (!context) {
    throw new Error('useCalculations must be used within a CalculationsProvider');
  }
  return context;
};