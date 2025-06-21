// Property Field Auto-Calculation Logic
// Determines which fields should be editable vs auto-calculated based on dependencies

export interface FieldInteraction {
  fieldName: string;
  isEditable: boolean;
  calculationDependencies: string[];
  calculationFormula?: (data: any) => number;
  description: string;
}

export interface PropertyCalculationConfig {
  overview: FieldInteraction[];
  rentroll: FieldInteraction[];
  rehab: FieldInteraction[];
  incomeExpenses: FieldInteraction[];
  financing: FieldInteraction[];
  sensitivity: FieldInteraction[];
  proforma: FieldInteraction[];
  exit: FieldInteraction[];
}

// Helper functions for calculations
const calculateMonthlyPayment = (principal: number, rate: number, years: number): number => {
  if (rate === 0) return principal / (years * 12);
  const monthlyRate = rate / 12;
  const numPayments = years * 12;
  return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
};

const calculateNOI = (grossIncome: number, expenses: number, vacancyRate: number = 0.05): number => {
  const effectiveGrossIncome = grossIncome * (1 - vacancyRate);
  return effectiveGrossIncome - expenses;
};

const calculateCashFlow = (noi: number, debtService: number): number => {
  return noi - debtService;
};

const calculateCashOnCashReturn = (annualCashFlow: number, initialInvestment: number): number => {
  return initialInvestment > 0 ? (annualCashFlow / initialInvestment) * 100 : 0;
};

const calculateCapRate = (noi: number, propertyValue: number): number => {
  return propertyValue > 0 ? (noi / propertyValue) * 100 : 0;
};

const calculateDSCR = (noi: number, debtService: number): number => {
  return debtService > 0 ? noi / debtService : 0;
};

const calculateBreakEvenOccupancy = (totalExpenses: number, debtService: number, grossPotentialIncome: number): number => {
  return grossPotentialIncome > 0 ? ((totalExpenses + debtService) / grossPotentialIncome) * 100 : 0;
};

export const propertyCalculationConfig: PropertyCalculationConfig = {
  overview: [
    {
      fieldName: 'address',
      isEditable: true,
      calculationDependencies: [],
      description: 'Property address - directly editable'
    },
    {
      fieldName: 'units',
      isEditable: true,
      calculationDependencies: [],
      description: 'Number of units - affects rent roll calculations'
    },
    {
      fieldName: 'acquisitionPrice',
      isEditable: true,
      calculationDependencies: [],
      description: 'Purchase price - base for loan calculations'
    },
    {
      fieldName: 'arvAtTimePurchased',
      isEditable: false,
      calculationDependencies: ['noi', 'marketCapRate'],
      calculationFormula: (data) => {
        const noi = data.noi || 0;
        const capRate = data.marketCapRate || 0.055;
        return capRate > 0 ? noi / capRate : 0;
      },
      description: 'Auto-calculated: NOI ÷ Market Cap Rate'
    },
    {
      fieldName: 'initialCapitalRequired',
      isEditable: false,
      calculationDependencies: ['acquisitionPrice', 'loanPercentage', 'closingCosts', 'rehabCosts'],
      calculationFormula: (data) => {
        const purchasePrice = data.acquisitionPrice || 0;
        const loanPercentage = data.loanPercentage || 0.75;
        const downPayment = purchasePrice * (1 - loanPercentage);
        const closingCosts = data.closingCosts || (purchasePrice * 0.02);
        const rehabCosts = data.rehabCosts || 0;
        return downPayment + closingCosts + rehabCosts;
      },
      description: 'Auto-calculated: Down Payment + Closing Costs + Rehab Budget'
    },
    {
      fieldName: 'annualCashFlow',
      isEditable: false,
      calculationDependencies: ['noi', 'annualDebtService'],
      calculationFormula: (data) => calculateCashFlow(data.noi || 0, data.annualDebtService || 0),
      description: 'Auto-calculated: NOI - Annual Debt Service'
    },
    {
      fieldName: 'cashOnCashReturn',
      isEditable: false,
      calculationDependencies: ['annualCashFlow', 'initialCapitalRequired'],
      calculationFormula: (data) => calculateCashOnCashReturn(data.annualCashFlow || 0, data.initialCapitalRequired || 0),
      description: 'Auto-calculated: Annual Cash Flow ÷ Initial Investment'
    }
  ],

  rentroll: [
    {
      fieldName: 'unitNumber',
      isEditable: true,
      calculationDependencies: [],
      description: 'Unit identifier - directly editable'
    },
    {
      fieldName: 'currentRent',
      isEditable: true,
      calculationDependencies: [],
      description: 'Current tenant rent - directly editable'
    },
    {
      fieldName: 'proFormaRent',
      isEditable: true,
      calculationDependencies: [],
      description: 'Market rent potential - directly editable'
    },
    {
      fieldName: 'grossPotentialIncome',
      isEditable: false,
      calculationDependencies: ['proFormaRent'],
      calculationFormula: (data) => {
        return data.rentRoll?.reduce((sum: number, unit: any) => sum + (parseFloat(unit.proFormaRent) || 0), 0) * 12 || 0;
      },
      description: 'Auto-calculated: Sum of all Pro Forma Rents × 12'
    },
    {
      fieldName: 'effectiveGrossIncome',
      isEditable: false,
      calculationDependencies: ['grossPotentialIncome', 'vacancyRate'],
      calculationFormula: (data) => {
        const grossIncome = data.grossPotentialIncome || 0;
        const vacancyRate = data.vacancyRate || 0.05;
        return grossIncome * (1 - vacancyRate);
      },
      description: 'Auto-calculated: Gross Potential Income × (1 - Vacancy Rate)'
    }
  ],

  rehab: [
    {
      fieldName: 'categoryAmount',
      isEditable: true,
      calculationDependencies: [],
      description: 'Individual line item costs - directly editable'
    },
    {
      fieldName: 'categoryTotal',
      isEditable: false,
      calculationDependencies: ['categoryAmount'],
      calculationFormula: (data) => {
        return data.items?.reduce((sum: number, item: any) => sum + (parseFloat(item.amount) || 0), 0) || 0;
      },
      description: 'Auto-calculated: Sum of category line items'
    },
    {
      fieldName: 'totalRehabCost',
      isEditable: false,
      calculationDependencies: ['categoryTotal'],
      calculationFormula: (data) => {
        return data.categories?.reduce((sum: number, category: any) => sum + (category.total || 0), 0) || 0;
      },
      description: 'Auto-calculated: Sum of all category totals'
    },
    {
      fieldName: 'bufferAmount',
      isEditable: false,
      calculationDependencies: ['totalRehabCost'],
      calculationFormula: (data) => {
        const totalCost = data.totalRehabCost || 0;
        return totalCost * 0.10; // 10% buffer
      },
      description: 'Auto-calculated: 10% of Total Rehab Cost'
    },
    {
      fieldName: 'totalWithBuffer',
      isEditable: false,
      calculationDependencies: ['totalRehabCost', 'bufferAmount'],
      calculationFormula: (data) => {
        return (data.totalRehabCost || 0) + (data.bufferAmount || 0);
      },
      description: 'Auto-calculated: Total Rehab Cost + Buffer'
    }
  ],

  incomeExpenses: [
    {
      fieldName: 'rentalIncome',
      isEditable: false,
      calculationDependencies: ['effectiveGrossIncome'],
      calculationFormula: (data) => data.effectiveGrossIncome || 0,
      description: 'Auto-calculated from Rent Roll'
    },
    {
      fieldName: 'otherIncome',
      isEditable: true,
      calculationDependencies: [],
      description: 'Additional income sources - directly editable'
    },
    {
      fieldName: 'totalIncome',
      isEditable: false,
      calculationDependencies: ['rentalIncome', 'otherIncome'],
      calculationFormula: (data) => (data.rentalIncome || 0) + (data.otherIncome || 0),
      description: 'Auto-calculated: Rental Income + Other Income'
    },
    {
      fieldName: 'operatingExpense',
      isEditable: true,
      calculationDependencies: [],
      description: 'Individual expense amounts - directly editable'
    },
    {
      fieldName: 'totalExpenses',
      isEditable: false,
      calculationDependencies: ['operatingExpense'],
      calculationFormula: (data) => {
        return data.operatingExpenses?.reduce((sum: number, expense: any) => sum + (parseFloat(expense.annualAmount) || 0), 0) || 0;
      },
      description: 'Auto-calculated: Sum of all operating expenses'
    },
    {
      fieldName: 'noi',
      isEditable: false,
      calculationDependencies: ['totalIncome', 'totalExpenses'],
      calculationFormula: (data) => (data.totalIncome || 0) - (data.totalExpenses || 0),
      description: 'Auto-calculated: Total Income - Total Expenses'
    }
  ],

  financing: [
    {
      fieldName: 'loanAmount',
      isEditable: true,
      calculationDependencies: [],
      description: 'Loan principal amount - directly editable'
    },
    {
      fieldName: 'interestRate',
      isEditable: true,
      calculationDependencies: [],
      description: 'Annual interest rate - directly editable'
    },
    {
      fieldName: 'loanTerm',
      isEditable: true,
      calculationDependencies: [],
      description: 'Loan term in years - directly editable'
    },
    {
      fieldName: 'monthlyPayment',
      isEditable: false,
      calculationDependencies: ['loanAmount', 'interestRate', 'loanTerm'],
      calculationFormula: (data) => {
        const principal = data.loanAmount || 0;
        const rate = data.interestRate || 0;
        const years = data.loanTerm || 30;
        return calculateMonthlyPayment(principal, rate, years);
      },
      description: 'Auto-calculated: Monthly P&I payment'
    },
    {
      fieldName: 'annualDebtService',
      isEditable: false,
      calculationDependencies: ['monthlyPayment'],
      calculationFormula: (data) => (data.monthlyPayment || 0) * 12,
      description: 'Auto-calculated: Monthly Payment × 12'
    },
    {
      fieldName: 'dscr',
      isEditable: false,
      calculationDependencies: ['noi', 'annualDebtService'],
      calculationFormula: (data) => calculateDSCR(data.noi || 0, data.annualDebtService || 0),
      description: 'Auto-calculated: NOI ÷ Annual Debt Service'
    }
  ],

  sensitivity: [
    {
      fieldName: 'vacancyRate',
      isEditable: true,
      calculationDependencies: [],
      description: 'Vacancy assumption - affects income calculations'
    },
    {
      fieldName: 'rentGrowth',
      isEditable: true,
      calculationDependencies: [],
      description: 'Annual rent growth assumption'
    },
    {
      fieldName: 'expenseGrowth',
      isEditable: true,
      calculationDependencies: [],
      description: 'Annual expense growth assumption'
    }
  ],

  proforma: [
    {
      fieldName: 'monthlyRentalIncome',
      isEditable: false,
      calculationDependencies: ['effectiveGrossIncome'],
      calculationFormula: (data) => (data.effectiveGrossIncome || 0) / 12,
      description: 'Auto-calculated: Effective Gross Income ÷ 12'
    },
    {
      fieldName: 'monthlyExpenses',
      isEditable: false,
      calculationDependencies: ['totalExpenses'],
      calculationFormula: (data) => (data.totalExpenses || 0) / 12,
      description: 'Auto-calculated: Total Expenses ÷ 12'
    },
    {
      fieldName: 'monthlyDebtService',
      isEditable: false,
      calculationDependencies: ['monthlyPayment'],
      calculationFormula: (data) => data.monthlyPayment || 0,
      description: 'Auto-calculated from active loan payment'
    },
    {
      fieldName: 'monthlyCashFlow',
      isEditable: false,
      calculationDependencies: ['monthlyRentalIncome', 'monthlyExpenses', 'monthlyDebtService'],
      calculationFormula: (data) => {
        return (data.monthlyRentalIncome || 0) - (data.monthlyExpenses || 0) - (data.monthlyDebtService || 0);
      },
      description: 'Auto-calculated: Monthly Income - Monthly Expenses - Monthly Debt Service'
    }
  ],

  exit: [
    {
      fieldName: 'holdPeriod',
      isEditable: true,
      calculationDependencies: [],
      description: 'Investment hold period in years'
    },
    {
      fieldName: 'exitCapRate',
      isEditable: true,
      calculationDependencies: [],
      description: 'Cap rate for sale valuation'
    },
    {
      fieldName: 'saleCosts',
      isEditable: true,
      calculationDependencies: [],
      description: 'Transaction costs as percentage'
    },
    {
      fieldName: 'projectedNOI',
      isEditable: false,
      calculationDependencies: ['noi', 'holdPeriod', 'rentGrowth', 'expenseGrowth'],
      calculationFormula: (data) => {
        const currentNOI = data.noi || 0;
        const years = data.holdPeriod || 3;
        const rentGrowth = data.rentGrowth || 0.03;
        const expenseGrowth = data.expenseGrowth || 0.03;
        
        // Project future NOI with growth rates
        const futureIncome = (data.totalIncome || 0) * Math.pow(1 + rentGrowth, years);
        const futureExpenses = (data.totalExpenses || 0) * Math.pow(1 + expenseGrowth, years);
        return futureIncome - futureExpenses;
      },
      description: 'Auto-calculated: Current NOI grown by rent/expense growth rates'
    },
    {
      fieldName: 'projectedSalePrice',
      isEditable: false,
      calculationDependencies: ['projectedNOI', 'exitCapRate'],
      calculationFormula: (data) => {
        const noi = data.projectedNOI || 0;
        const capRate = data.exitCapRate || 0.055;
        return capRate > 0 ? noi / capRate : 0;
      },
      description: 'Auto-calculated: Projected NOI ÷ Exit Cap Rate'
    },
    {
      fieldName: 'netSaleProceeds',
      isEditable: false,
      calculationDependencies: ['projectedSalePrice', 'saleCosts'],
      calculationFormula: (data) => {
        const salePrice = data.projectedSalePrice || 0;
        const costPercent = data.saleCosts || 0.06;
        return salePrice * (1 - costPercent);
      },
      description: 'Auto-calculated: Sale Price × (1 - Sale Costs %)'
    }
  ]
};

// Function to determine if a field should be editable
export const isFieldEditable = (tabName: keyof PropertyCalculationConfig, fieldName: string): boolean => {
  const tabConfig = propertyCalculationConfig[tabName];
  const fieldConfig = tabConfig?.find(field => field.fieldName === fieldName);
  return fieldConfig?.isEditable ?? true; // Default to editable if not found
};

// Function to get calculation dependencies for a field
export const getFieldDependencies = (tabName: keyof PropertyCalculationConfig, fieldName: string): string[] => {
  const tabConfig = propertyCalculationConfig[tabName];
  const fieldConfig = tabConfig?.find(field => field.fieldName === fieldName);
  return fieldConfig?.calculationDependencies ?? [];
};

// Function to calculate field value based on dependencies
export const calculateFieldValue = (
  tabName: keyof PropertyCalculationConfig, 
  fieldName: string, 
  propertyData: any
): number | null => {
  const tabConfig = propertyCalculationConfig[tabName];
  const fieldConfig = tabConfig?.find(field => field.fieldName === fieldName);
  
  if (!fieldConfig?.calculationFormula) {
    return null;
  }
  
  try {
    return fieldConfig.calculationFormula(propertyData);
  } catch (error) {
    console.warn(`Error calculating ${fieldName}:`, error);
    return null;
  }
};

// Function to get field description for tooltips/help
export const getFieldDescription = (tabName: keyof PropertyCalculationConfig, fieldName: string): string => {
  const tabConfig = propertyCalculationConfig[tabName];
  const fieldConfig = tabConfig?.find(field => field.fieldName === fieldName);
  return fieldConfig?.description ?? 'Field description not available';
};

// Function to validate field dependencies are met
export const validateFieldDependencies = (
  tabName: keyof PropertyCalculationConfig, 
  fieldName: string, 
  propertyData: any
): boolean => {
  const dependencies = getFieldDependencies(tabName, fieldName);
  
  return dependencies.every(dep => {
    // Check if dependency exists in data
    return propertyData.hasOwnProperty(dep) && propertyData[dep] !== null && propertyData[dep] !== undefined;
  });
};

// Function to get all auto-calculated fields that need updates when a field changes
export const getAffectedFields = (
  tabName: keyof PropertyCalculationConfig, 
  changedFieldName: string
): string[] => {
  const tabConfig = propertyCalculationConfig[tabName];
  
  return tabConfig
    .filter(field => !field.isEditable && field.calculationDependencies.includes(changedFieldName))
    .map(field => field.fieldName);
};

// Function to recalculate all dependent fields
export const recalculateFields = (
  tabName: keyof PropertyCalculationConfig, 
  propertyData: any
): any => {
  const tabConfig = propertyCalculationConfig[tabName];
  const updatedData = { ...propertyData };
  
  // Sort fields by dependency order (fields with fewer dependencies first)
  const sortedFields = tabConfig
    .filter(field => !field.isEditable)
    .sort((a, b) => a.calculationDependencies.length - b.calculationDependencies.length);
  
  // Calculate each auto-calculated field
  for (const fieldConfig of sortedFields) {
    if (validateFieldDependencies(tabName, fieldConfig.fieldName, updatedData)) {
      const calculatedValue = calculateFieldValue(tabName, fieldConfig.fieldName, updatedData);
      if (calculatedValue !== null) {
        updatedData[fieldConfig.fieldName] = calculatedValue;
      }
    }
  }
  
  return updatedData;
};