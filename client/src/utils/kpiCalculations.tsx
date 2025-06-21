import { KPIBreakdownItem } from '../components/KPICalculationModal';

interface Property {
  id: number;
  status: string;
  apartments: number;
  address: string;
  city: string;
  state: string;
  acquisitionPrice: string;
  rehabCosts: string;
  initialCapitalRequired: string;
  cashFlow: string;
  totalProfits: string;
  cashOnCashReturn: string;
  annualizedReturn: string;
  dealAnalyzerData?: string;
}

interface DealAnalyzerData {
  assumptions?: any;
  closingCosts?: any;
  holdingCosts?: any;
  rehabBudget?: any;
  calculations?: any;
}

export const getKPICalculationBreakdown = (
  kpiType: string,
  value: number,
  properties: Property[] = [],
  propertyData?: Property,
  additionalData?: any
): {
  title: string;
  formula: string;
  breakdown: KPIBreakdownItem[];
} => {
  const parseNumber = (str: string | number): number => {
    if (typeof str === 'number') return str;
    return parseFloat(str.toString().replace(/[^0-9.-]/g, '')) || 0;
  };

  const getDealAnalyzerData = (property: Property): DealAnalyzerData => {
    try {
      return property.dealAnalyzerData ? JSON.parse(property.dealAnalyzerData) : {};
    } catch {
      return {};
    }
  };

  switch (kpiType.toLowerCase()) {
    case 'total_cash_invested':
    case 'initial_capital_required':
      if (propertyData) {
        const dealData = getDealAnalyzerData(propertyData);
        const acquisitionPrice = parseNumber(propertyData.acquisitionPrice);
        const loanPercentage = dealData.assumptions?.loanPercentage || 0.75;
        const downPayment = acquisitionPrice * (1 - loanPercentage);
        
        const closingCosts = dealData.closingCosts ? 
          Object.values(dealData.closingCosts).reduce((sum: number, cost: any) => sum + parseNumber(cost), 0) : 
          acquisitionPrice * 0.03;
        
        const holdingCosts = dealData.holdingCosts ? 
          Object.values(dealData.holdingCosts).reduce((sum: number, cost: any) => sum + parseNumber(cost), 0) : 
          acquisitionPrice * 0.04;
        
        const rehabCosts = parseNumber(propertyData.rehabCosts);
        
        return {
          title: 'Total Cash Invested Breakdown',
          formula: 'Down Payment + Closing Costs + Holding Costs + Rehab Costs',
          breakdown: [
            {
              label: 'Down Payment',
              description: 'Purchase Price - Initial Loan',
              value: downPayment,
              formula: `$${acquisitionPrice.toLocaleString()} × ${((1 - loanPercentage) * 100).toFixed(1)}%`
            },
            {
              label: 'Closing Costs',
              description: 'Sum of all closing costs',
              value: closingCosts,
              subItems: dealData.closingCosts ? Object.entries(dealData.closingCosts).map(([key, val]: [string, any]) => ({
                label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
                value: parseNumber(val)
              })) : [
                { label: 'Title Insurance', value: closingCosts * 0.4 },
                { label: 'Attorney Fees', value: closingCosts * 0.3 },
                { label: 'Inspections', value: closingCosts * 0.3 }
              ]
            },
            {
              label: 'Holding Costs',
              description: 'Sum of all holding costs',
              value: holdingCosts,
              subItems: dealData.holdingCosts ? Object.entries(dealData.holdingCosts).map(([key, val]: [string, any]) => ({
                label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
                value: parseNumber(val)
              })) : [
                { label: 'Property Tax', value: holdingCosts * 0.4 },
                { label: 'Insurance', value: holdingCosts * 0.3 },
                { label: 'Utilities', value: holdingCosts * 0.3 }
              ]
            },
            {
              label: 'Rehab Costs',
              description: 'Sum of all rehab sections + buffer',
              value: rehabCosts,
              subItems: dealData.rehabBudget ? Object.entries(dealData.rehabBudget).map(([key, val]: [string, any]) => ({
                label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
                value: parseNumber(val)
              })) : [
                { label: 'Exterior Work', value: rehabCosts * 0.3 },
                { label: 'Kitchen Renovation', value: rehabCosts * 0.25 },
                { label: 'Bathroom Renovation', value: rehabCosts * 0.2 },
                { label: 'General Interior', value: rehabCosts * 0.15 },
                { label: 'Contingency Buffer', value: rehabCosts * 0.1 }
              ]
            }
          ]
        };
      }
      break;

    case 'portfolio_aum':
    case 'total_aum':
      const totalAUM = properties.reduce((sum, prop) => {
        const acquisition = parseNumber(prop.acquisitionPrice);
        const rehab = parseNumber(prop.rehabCosts);
        return sum + acquisition + rehab;
      }, 0);

      return {
        title: 'Portfolio AUM Breakdown',
        formula: 'Sum of (Acquisition Price + Rehab Costs) for all properties',
        breakdown: [
          {
            label: 'Total Properties',
            description: 'Number of properties in portfolio',
            value: properties.length
          },
          {
            label: 'Acquisition Costs',
            description: 'Sum of all property purchase prices',
            value: properties.reduce((sum, prop) => sum + parseNumber(prop.acquisitionPrice), 0),
            subItems: properties.map(prop => ({
              label: prop.address,
              value: parseNumber(prop.acquisitionPrice)
            }))
          },
          {
            label: 'Rehab Investments',
            description: 'Sum of all renovation costs',
            value: properties.reduce((sum, prop) => sum + parseNumber(prop.rehabCosts), 0),
            subItems: properties.map(prop => ({
              label: prop.address,
              value: parseNumber(prop.rehabCosts)
            }))
          }
        ]
      };

    case 'cash_flow':
    case 'monthly_cash_flow':
      const monthlyFlow = properties
        .filter(prop => prop.status === 'Cashflowing')
        .reduce((sum, prop) => sum + parseNumber(prop.cashFlow), 0);

      return {
        title: 'Monthly Cash Flow Breakdown',
        formula: 'Sum of monthly cash flow from all cashflowing properties',
        breakdown: [
          {
            label: 'Cashflowing Properties',
            description: 'Properties generating monthly income',
            value: properties.filter(prop => prop.status === 'Cashflowing').length
          },
          {
            label: 'Individual Property Cash Flows',
            description: 'Monthly cash flow by property',
            value: monthlyFlow,
            subItems: properties
              .filter(prop => prop.status === 'Cashflowing')
              .map(prop => ({
                label: prop.address,
                value: parseNumber(prop.cashFlow),
                description: `${prop.apartments} units`
              }))
          }
        ]
      };

    case 'cash_on_cash_return':
    case 'coc_return':
      if (propertyData) {
        const annualCashFlow = parseNumber(propertyData.cashFlow) * 12;
        const initialCapital = parseNumber(propertyData.initialCapitalRequired);
        const cocReturn = initialCapital > 0 ? (annualCashFlow / initialCapital) * 100 : 0;

        return {
          title: 'Cash-on-Cash Return Breakdown',
          formula: '(Annual Cash Flow ÷ Initial Capital Required) × 100',
          breakdown: [
            {
              label: 'Annual Cash Flow',
              description: 'Monthly cash flow × 12 months',
              value: annualCashFlow,
              formula: `$${parseNumber(propertyData.cashFlow).toLocaleString()} × 12`
            },
            {
              label: 'Initial Capital Required',
              description: 'Total cash invested in property',
              value: initialCapital
            },
            {
              label: 'Cash-on-Cash Return',
              description: 'Annual return percentage',
              value: cocReturn,
              formula: `($${annualCashFlow.toLocaleString()} ÷ $${initialCapital.toLocaleString()}) × 100`
            }
          ]
        };
      }
      break;

    case 'total_units':
      return {
        title: 'Total Units Breakdown',
        formula: 'Sum of apartments across all properties',
        breakdown: [
          {
            label: 'Property Count',
            description: 'Total number of properties',
            value: properties.length
          },
          {
            label: 'Unit Distribution',
            description: 'Units by property',
            value: properties.reduce((sum, prop) => sum + (prop.apartments || 0), 0),
            subItems: properties.map(prop => ({
              label: prop.address,
              value: prop.apartments || 0,
              description: prop.status
            }))
          }
        ]
      };

    case 'price_per_unit':
      const totalValue = properties.reduce((sum, prop) => {
        return sum + parseNumber(prop.acquisitionPrice) + parseNumber(prop.rehabCosts);
      }, 0);
      const totalUnits = properties.reduce((sum, prop) => sum + (prop.apartments || 0), 0);

      return {
        title: 'Price Per Unit Breakdown',
        formula: 'Total Portfolio Value ÷ Total Units',
        breakdown: [
          {
            label: 'Total Portfolio Value',
            description: 'Sum of acquisition + rehab costs',
            value: totalValue
          },
          {
            label: 'Total Units',
            description: 'Sum of all apartment units',
            value: totalUnits
          },
          {
            label: 'Average Price Per Unit',
            description: 'Portfolio efficiency metric',
            value: totalUnits > 0 ? totalValue / totalUnits : 0,
            formula: `$${totalValue.toLocaleString()} ÷ ${totalUnits} units`
          }
        ]
      };

    case 'equity_multiple':
      if (propertyData) {
        const totalReturns = parseNumber(propertyData.totalProfits);
        const initialInvestment = parseNumber(propertyData.initialCapitalRequired);
        const equityMultiple = initialInvestment > 0 ? totalReturns / initialInvestment : 0;

        return {
          title: 'Equity Multiple Breakdown',
          formula: 'Total Returns ÷ Initial Investment',
          breakdown: [
            {
              label: 'Total Returns',
              description: 'Cumulative profits from property',
              value: totalReturns
            },
            {
              label: 'Initial Investment',
              description: 'Original capital invested',
              value: initialInvestment
            },
            {
              label: 'Equity Multiple',
              description: 'Return multiple on investment',
              value: equityMultiple,
              formula: `$${totalReturns.toLocaleString()} ÷ $${initialInvestment.toLocaleString()}`
            }
          ]
        };
      }
      break;

    case 'total_equity':
      const totalEquity = properties.reduce((sum, prop) => {
        const dealData = getDealAnalyzerData(prop);
        const arv = dealData.assumptions?.arv || parseNumber(prop.acquisitionPrice) * 1.2;
        const loanBalance = dealData.assumptions?.loanAmount || parseNumber(prop.acquisitionPrice) * 0.75;
        return sum + Math.max(0, arv - loanBalance);
      }, 0);

      return {
        title: 'Total Equity Breakdown',
        formula: 'Sum of (Current Property Value - Loan Balance) for all properties',
        breakdown: [
          {
            label: 'Portfolio Properties',
            description: 'Number of properties with equity',
            value: properties.length
          },
          {
            label: 'Property Equity Distribution',
            description: 'Equity by individual property',
            value: totalEquity,
            subItems: properties.map(prop => {
              const dealData = getDealAnalyzerData(prop);
              const arv = dealData.assumptions?.arv || parseNumber(prop.acquisitionPrice) * 1.2;
              const loanBalance = dealData.assumptions?.loanAmount || parseNumber(prop.acquisitionPrice) * 0.75;
              const equity = Math.max(0, arv - loanBalance);
              return {
                label: prop.address,
                value: equity,
                description: `ARV: ${arv.toLocaleString()} - Loan: ${loanBalance.toLocaleString()}`
              };
            })
          }
        ]
      };

    case 'total_profits':
      const portfolioProfits = properties.reduce((sum, prop) => sum + parseNumber(prop.totalProfits), 0);
      
      return {
        title: 'Total Profits Breakdown',
        formula: 'Sum of all realized and unrealized profits across portfolio',
        breakdown: [
          {
            label: 'Profit-Generating Properties',
            description: 'Properties with positive returns',
            value: properties.filter(prop => parseNumber(prop.totalProfits) > 0).length
          },
          {
            label: 'Individual Property Profits',
            description: 'Profit breakdown by property',
            value: portfolioProfits,
            subItems: properties.map(prop => ({
              label: prop.address,
              value: parseNumber(prop.totalProfits),
              description: `Status: ${prop.status}`
            }))
          }
        ]
      };

    case 'total_properties':
      return {
        title: 'Total Properties Breakdown',
        formula: 'Count of all properties in portfolio',
        breakdown: [
          {
            label: 'Portfolio Size',
            description: 'Total number of properties',
            value: properties.length
          },
          {
            label: 'Properties by Status',
            description: 'Distribution across investment stages',
            value: properties.length,
            subItems: [
              {
                label: 'Under Contract',
                value: properties.filter(p => p.status === 'Under Contract').length,
                description: 'Properties in acquisition phase'
              },
              {
                label: 'Rehabbing',
                value: properties.filter(p => p.status === 'Rehabbing').length,
                description: 'Properties under renovation'
              },
              {
                label: 'Cashflowing',
                value: properties.filter(p => p.status === 'Cashflowing').length,
                description: 'Properties generating income'
              },
              {
                label: 'Sold',
                value: properties.filter(p => p.status === 'Sold').length,
                description: 'Properties successfully exited'
              }
            ]
          }
        ]
      };

    default:
      return {
        title: 'KPI Breakdown',
        formula: 'Calculation details not available',
        breakdown: [
          {
            label: 'Value',
            description: 'Current metric value',
            value: value
          }
        ]
      };
  }

  return {
    title: 'KPI Breakdown',
    formula: 'Calculation details not available',
    breakdown: [
      {
        label: 'Value',
        description: 'Current metric value',
        value: value
      }
    ]
  };
};