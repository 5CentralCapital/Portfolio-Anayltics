import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { UnifiedCalculationService, PropertyFinancials } from '@/services/unifiedCalculations';

interface CalculationsContextType {
  calculateProperty: (property: any) => PropertyFinancials;
  calculatePortfolioMetrics: (properties: any[]) => any;
  formatCurrency: (value: number | string) => string;
  formatPercentage: (value: number, decimals?: number) => string;
}

const CalculationsContext = createContext<CalculationsContextType | undefined>(undefined);

export function CalculationsProvider({ children }: { children: ReactNode }) {
  const contextValue = useMemo(() => ({
    calculateProperty: (property: any) => {
      console.log('CalculationsContext - property data:', {
        id: property.id,
        address: property.address,
        hasRentRoll: !!property.rentRoll,
        rentRollLength: property.rentRoll?.length || 0,
        hasPropertyLoans: !!property.propertyLoans,
        propertyLoansLength: property.propertyLoans?.length || 0
      });
      
      const propertyData = {
        property,
        rentRoll: property.rentRoll || [],
        propertyLoans: property.propertyLoans || [],
        assumptions: property.assumptions,
        editedExpenses: property.editedExpenses
      };
      return UnifiedCalculationService.calculateProperty(propertyData);
    },
    calculatePortfolioMetrics: (properties: any[]) => {
      const propertyDataArray = properties.map(property => ({
        property,
        rentRoll: property.rentRoll,
        propertyLoans: property.propertyLoans,
        assumptions: property.assumptions,
        editedExpenses: property.editedExpenses
      }));
      return UnifiedCalculationService.calculatePortfolioMetrics(propertyDataArray);
    },
    formatCurrency: UnifiedCalculationService.formatCurrency,
    formatPercentage: UnifiedCalculationService.formatPercentage,
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