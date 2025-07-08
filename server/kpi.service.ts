import { storage } from './storage';
import type { 
  Deal, DealRehab, DealUnits, DealExpenses, DealClosingCosts, 
  DealHoldingCosts, DealLoans, DealOtherIncome 
} from '@shared/schema';

export interface DealKPIs {
  // Financial metrics
  totalRehab: number;
  totalClosingCosts: number;
  totalHoldingCosts: number;
  allInCost: number;
  
  // Income calculations
  grossRentalIncome: number;
  effectiveGrossIncome: number;
  netOperatingIncome: number;
  totalOtherIncome: number;
  
  // Expense calculations
  totalOperatingExpenses: number;
  
  // Debt service
  monthlyDebtService: number;
  annualDebtService: number;
  
  // Key ratios
  arv: number;
  cashFlow: number;
  cashOnCashReturn: number;
  capRate: number;
  dscr: number;
  ltc: number;
  ltv: number;
  
  // Investment metrics
  capitalRequired: number;
  totalCashInvested: number;
  initialLoanAmount: number;
  
  // Break-even analysis
  breakEvenOccupancy: number;
  
  // Return metrics
  irr: number;
  equityMultiple: number;
  
  // Refinance metrics
  newLoanAmount: number;
  cashOut: number;
  totalProfit: number;
  
  // Risk indicators
  isSpeculative: boolean;
  dscrWarning: boolean;
  occupancyRisk: boolean;
}

export class KPIService {
  /**
   * Calculate comprehensive KPIs for a deal
   */
  async calculateKPIs(dealId: number): Promise<DealKPIs> {
    const deal = await storage.getDeal(dealId);
    if (!deal) throw new Error('Deal not found');

    const [
      rehabItems,
      units,
      expenses,
      closingCosts,
      holdingCosts,
      loans,
      otherIncome
    ] = await Promise.all([
      storage.getDealRehab(dealId),
      storage.getDealUnits(dealId),
      storage.getDealExpenses(dealId),
      storage.getDealClosingCosts(dealId),
      storage.getDealHoldingCosts(dealId),
      storage.getDealLoans(dealId),
      storage.getDealOtherIncome(dealId)
    ]);

    return this.computeKPIs(deal, {
      rehabItems,
      units,
      expenses,
      closingCosts,
      holdingCosts,
      loans,
      otherIncome
    });
  }

  private computeKPIs(
    deal: Deal,
    data: {
      rehabItems: DealRehab[];
      units: DealUnits[];
      expenses: DealExpenses[];
      closingCosts: DealClosingCosts[];
      holdingCosts: DealHoldingCosts[];
      loans: DealLoans[];
      otherIncome: DealOtherIncome[];
    }
  ): DealKPIs {
    // Basic cost calculations
    const totalRehab = data.rehabItems.reduce((sum, item) => sum + Number(item.totalCost), 0);
    const totalClosingCosts = data.closingCosts.reduce((sum, cost) => sum + Number(cost.amount), 0);
    const totalHoldingCosts = data.holdingCosts.reduce((sum, cost) => sum + Number(cost.monthlyAmount), 0) * 
                              (Number(deal.startToStabilizationMonths) || 12);
    
    const allInCost = Number(deal.purchasePrice) + totalRehab + totalClosingCosts + totalHoldingCosts;

    // Income calculations
    const grossRentalIncome = data.units.reduce((sum, unit) => {
      const rent = unit.isOccupied ? Number(unit.currentRent) : Number(unit.marketRent);
      return sum + rent * 12;
    }, 0);

    const totalOtherIncome = data.otherIncome.reduce((sum, income) => 
      sum + Number(income.monthlyAmount) * 12, 0);

    // Apply vacancy and bad debt rates
    const vacancyLoss = grossRentalIncome * Number(deal.vacancyRate);
    const badDebtLoss = grossRentalIncome * Number(deal.badDebtRate);
    const effectiveGrossIncome = grossRentalIncome + totalOtherIncome - vacancyLoss - badDebtLoss;

    // Operating expenses
    const totalOperatingExpenses = data.expenses.reduce((sum, expense) => {
      if (expense.isPercentOfRent && expense.percentage) {
        return sum + (grossRentalIncome * Number(expense.percentage));
      }
      return sum + Number(expense.monthlyAmount) * 12;
    }, 0);

    // Add reserves
    const capexReserve = Number(deal.capexReservePerUnit) * Number(deal.units);
    const operatingReserve = (effectiveGrossIncome - totalOperatingExpenses) / 12 * 
                            (Number(deal.operatingReserveMonths) || 6);

    const adjustedOperatingExpenses = totalOperatingExpenses + capexReserve;
    const netOperatingIncome = effectiveGrossIncome - adjustedOperatingExpenses;

    // Initial loan calculation: loan percentage of (purchase price + total rehab cost)
    const loanPercentage = Number(deal.loanPercentage) || 0; // Use stored loan percentage
    const initialLoanAmount = (Number(deal.purchasePrice) + totalRehab) * loanPercentage;
    
    // Debt service calculations using active loan or fall back to initial loan
    const activeLoan = data.loans.find(loan => loan.isActive) || 
                      data.loans.find(loan => loan.loanType === 'acquisition') || 
                      data.loans[0];
    let monthlyDebtService = 0;
    let annualDebtService = 0;

    if (activeLoan) {
      const loanAmount = Number(activeLoan.loanAmount);
      const monthlyRate = Number(activeLoan.interestRate) / 12;
      const totalPayments = Number(activeLoan.amortizationYears) * 12;
      
      if (activeLoan.ioMonths && activeLoan.ioMonths > 0) {
        // Interest-only period
        monthlyDebtService = loanAmount * monthlyRate;
      } else {
        // Amortizing payment
        const numerator = monthlyRate * Math.pow(1 + monthlyRate, totalPayments);
        const denominator = Math.pow(1 + monthlyRate, totalPayments) - 1;
        monthlyDebtService = loanAmount * (numerator / denominator);
      }
      annualDebtService = monthlyDebtService * 12;
    } else {
      // No loans defined - don't make assumptions
      monthlyDebtService = 0;
      annualDebtService = 0;
    }

    // Key ratios and metrics
    const arv = netOperatingIncome / Number(deal.marketCapRate);
    const cashFlow = netOperatingIncome - annualDebtService;
    
    // Capital required calculation: all-in cost minus initial loan
    const capitalRequired = allInCost - initialLoanAmount;
    
    // Total cash invested = capital required + holding costs
    const totalCashInvested = capitalRequired + totalHoldingCosts;
    
    const cashOnCashReturn = capitalRequired > 0 ? cashFlow / capitalRequired : 0;
    const capRate = Number(deal.purchasePrice) > 0 ? netOperatingIncome / Number(deal.purchasePrice) : 0;
    const dscr = annualDebtService > 0 ? netOperatingIncome / annualDebtService : 0;
    
    // Loan-to-cost and loan-to-value ratios
    const ltc = initialLoanAmount / allInCost;
    const ltv = initialLoanAmount / arv;

    // Break-even occupancy
    const fixedExpenses = totalOperatingExpenses + annualDebtService;
    const averageRentPerUnit = grossRentalIncome / Number(deal.units);
    const breakEvenOccupancy = averageRentPerUnit > 0 ? 
      (fixedExpenses / (averageRentPerUnit * Number(deal.units))) : 1;

    // Simplified IRR calculation (assuming 5-year hold)
    const holdYears = 5;
    const exitCapRate = Number(deal.exitCapRate) || Number(deal.marketCapRate);
    const futureNOI = netOperatingIncome * Math.pow(1 + Number(deal.annualRentGrowth), holdYears);
    const exitValue = futureNOI / exitCapRate;
    const totalCashFlow = cashFlow * holdYears;
    const totalReturn = exitValue - allInCost + totalCashFlow;
    const irr = Math.pow(totalReturn / capitalRequired, 1 / holdYears) - 1;
    
    // Equity Multiple = Current Equity Value / Total Invested Capital
    const currentLoanBalance = initialLoanAmount; // Simplified - use initial loan amount
    const currentEquityValue = arv - currentLoanBalance;
    const equityMultiple = capitalRequired > 0 ? currentEquityValue / capitalRequired : 0;

    // Refinance calculations using editable LTV
    const refiLTV = Number(deal.refinanceLTV) || 0; // Use stored refinance LTV
    const newLoanAmount = arv * refiLTV;
    const existingLoanBalance = activeLoan ? Number(activeLoan.loanAmount) * 0.9 : initialLoanAmount * 0.9; // Assume 10% paid down
    const cashOut = Math.max(0, newLoanAmount - existingLoanBalance);
    const totalProfit = arv - allInCost + cashOut;

    // Risk indicators
    const isSpeculative = Number(deal.exitCapRate || deal.marketCapRate) < Number(deal.marketCapRate);
    const dscrWarning = dscr < 1.15;
    const occupancyRisk = breakEvenOccupancy > 0.90;

    return {
      totalRehab,
      totalClosingCosts,
      totalHoldingCosts,
      allInCost,
      grossRentalIncome,
      effectiveGrossIncome,
      netOperatingIncome,
      totalOtherIncome,
      totalOperatingExpenses: adjustedOperatingExpenses,
      monthlyDebtService,
      annualDebtService,
      arv,
      cashFlow,
      cashOnCashReturn,
      capRate,
      dscr,
      ltc,
      ltv,
      breakEvenOccupancy,
      irr,
      equityMultiple,
      newLoanAmount,
      cashOut,
      totalProfit,
      capitalRequired,
      totalCashInvested,
      initialLoanAmount,
      isSpeculative,
      dscrWarning,
      occupancyRisk
    };
  }

  /**
   * Format currency values for display
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  /**
   * Format percentage values for display
   */
  formatPercentage(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    }).format(value);
  }
}

export const kpiService = new KPIService();