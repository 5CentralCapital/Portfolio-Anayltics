import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { CalculationService, PropertyKPIs, PortfolioMetrics } from '@/services/calculations';

interface CalculationsContextType {
  calculatePropertyKPIs: (property: any) => PropertyKPIs;
  calculatePortfolioMetrics: (properties: any[]) => PortfolioMetrics;
  formatCurrency: (value: number) => string;
  formatPercentage: (value: number, decimals?: number) => string;
}

const CalculationsContext = createContext<CalculationsContextType | undefined>(undefined);

export function CalculationsProvider({ children }: { children: ReactNode }) {
  const contextValue = useMemo(() => ({
    calculatePropertyKPIs: CalculationService.calculatePropertyKPIs,
    calculatePortfolioMetrics: CalculationService.calculatePortfolioMetrics,
    formatCurrency: CalculationService.formatCurrency,
    formatPercentage: CalculationService.formatPercentage,
  }), []);

  return (
    <CalculationsContext.Provider value={contextValue}>
      {children}
    </CalculationsContext.Provider>
  );
}

export function useCalculations() {
  const context = useContext(CalculationsContext);
  if (!context) {
    throw new Error('useCalculations must be used within a CalculationsProvider');
  }
  return context;
}