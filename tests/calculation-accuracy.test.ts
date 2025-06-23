/**
 * Calculation Accuracy Tests
 * 
 * This test suite validates that all financial calculations are mathematically
 * accurate and consistent across different input scenarios.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { testDb } from './setup';
import { 
  calculateAllMetrics,
  calculateLoanPayment,
  calculateNOI,
  calculateARV,
  calculateInitialCapital,
  calculateCashOnCashReturn,
  calculateEquityMultiple,
  calculateDSCR,
  calculateBreakEvenOccupancy,
  calculateCapRate,
  calculateLTV,
  calculateOperatingExpenseRatio,
  calculateSensitivityAnalysis,
  calculateExitScenarios
} from '../server/finance-utils';
import type { PropertyFinancials } from '../server/finance-utils';

describe('Financial Calculation Accuracy', () => {
  const sampleFinancials: PropertyFinancials = {
    purchasePrice: 150000,
    rehabCosts: 25000,
    closingCosts: 5000,
    holdingCosts: 3000,
    grossRentalIncome: 54000,
    vacancyRate: 0.05,
    otherIncome: 2400,
    operatingExpenses: 18000,
    loanAmount: 120000,
    interestRate: 0.065,
    loanTermYears: 30,
    paymentType: 'principal_and_interest',
    marketCapRate: 0.07,
    exitCapRate: 0.065,
    refinanceLTV: 0.75,
    refinanceRate: 0.055
  };

  describe('Core Financial Metrics', () => {
    it('should calculate loan payment accurately', () => {
      const monthlyPayment = calculateLoanPayment(120000, 6.5, 30, 'principal_and_interest');
      expect(monthlyPayment).toBeCloseTo(758.48, 2); // Known correct value
      
      const interestOnlyPayment = calculateLoanPayment(120000, 6.5, 30, 'interest_only');
      expect(interestOnlyPayment).toBeCloseTo(650, 2); // 120000 * 0.065 / 12
    });

    it('should calculate NOI correctly', () => {
      const noi = calculateNOI(54000, 0.05, 2400, 18000);
      expect(noi).toBeCloseTo(35700, 2); // (54000 * 0.95) + 2400 - 18000
    });

    it('should calculate ARV using cap rate method', () => {
      const noi = 35700;
      const arv = calculateARV(noi, 0.07);
      expect(arv).toBeCloseTo(510000, 2); // 35700 / 0.07
    });

    it('should calculate initial capital required', () => {
      const downPayment = 150000 - 120000; // 30000
      const initialCapital = calculateInitialCapital(150000, 25000, 5000, 3000, 120000);
      expect(initialCapital).toBeCloseTo(63000, 2); // 30000 + 25000 + 5000 + 3000
    });

    it('should calculate cash-on-cash return', () => {
      const annualCashFlow = 24000;
      const initialCapital = 63000;
      const cocReturn = calculateCashOnCashReturn(annualCashFlow, initialCapital);
      expect(cocReturn).toBeCloseTo(0.381, 3); // 24000 / 63000
    });

    it('should calculate equity multiple', () => {
      const currentValue = 510000;
      const totalInvested = 183000; // 150000 + 25000 + 5000 + 3000
      const equityMultiple = calculateEquityMultiple(currentValue, 120000, totalInvested);
      expect(equityMultiple).toBeCloseTo(2.13, 2); // (510000 - 120000) / 183000
    });

    it('should calculate DSCR accurately', () => {
      const noi = 35700;
      const annualDebtService = 9102; // 758.48 * 12
      const dscr = calculateDSCR(noi, annualDebtService);
      expect(dscr).toBeCloseTo(3.92, 2); // 35700 / 9102
    });

    it('should calculate break-even occupancy', () => {
      const operatingExpenses = 18000;
      const annualDebtService = 9102;
      const grossRentalIncome = 54000;
      const breakEven = calculateBreakEvenOccupancy(operatingExpenses, annualDebtService, grossRentalIncome);
      expect(breakEven).toBeCloseTo(0.502, 3); // (18000 + 9102) / 54000
    });

    it('should calculate cap rate', () => {
      const noi = 35700;
      const currentValue = 510000;
      const capRate = calculateCapRate(noi, currentValue);
      expect(capRate).toBeCloseTo(0.07, 3); // 35700 / 510000
    });

    it('should calculate LTV ratio', () => {
      const loanAmount = 120000;
      const propertyValue = 510000;
      const ltv = calculateLTV(loanAmount, propertyValue);
      expect(ltv).toBeCloseTo(0.235, 3); // 120000 / 510000
    });

    it('should calculate operating expense ratio', () => {
      const operatingExpenses = 18000;
      const effectiveGrossIncome = 53700; // (54000 * 0.95) + 2400
      const oer = calculateOperatingExpenseRatio(operatingExpenses, effectiveGrossIncome);
      expect(oer).toBeCloseTo(0.335, 3); // 18000 / 53700
    });
  });

  describe('Comprehensive Metrics Calculation', () => {
    it('should calculate all metrics consistently', () => {
      const metrics = calculateAllMetrics(sampleFinancials);
      
      // Verify all metrics are present and reasonable
      expect(metrics.allInCost).toBeCloseTo(183000, 2);
      expect(metrics.arv).toBeCloseTo(510000, 0);
      expect(metrics.initialCapitalRequired).toBeCloseTo(63000, 2);
      expect(metrics.netOperatingIncome).toBeCloseTo(35700, 2);
      expect(metrics.annualDebtService).toBeCloseTo(9102, 2);
      expect(metrics.annualCashFlow).toBeCloseTo(26598, 2);
      
      expect(metrics.capRate).toBeCloseTo(0.07, 3);
      expect(metrics.cashOnCashReturn).toBeCloseTo(0.422, 3);
      expect(metrics.equityMultiple).toBeCloseTo(2.13, 2);
      expect(metrics.dscr).toBeCloseTo(3.92, 2);
      
      expect(metrics.currentEquity).toBeCloseTo(390000, 2);
      expect(metrics.loanToValue).toBeCloseTo(0.235, 3);
      expect(metrics.breakEvenOccupancy).toBeCloseTo(0.502, 3);
      expect(metrics.operatingExpenseRatio).toBeCloseTo(0.335, 3);
      
      expect(metrics.totalReturn).toBeCloseTo(0.422, 3);
      expect(metrics.annualizedReturn).toBeCloseTo(0.422, 3);
    });

    it('should handle edge cases gracefully', () => {
      // Zero rental income scenario
      const zeroIncomeFinancials = { ...sampleFinancials, grossRentalIncome: 0 };
      const zeroMetrics = calculateAllMetrics(zeroIncomeFinancials);
      
      expect(zeroMetrics.netOperatingIncome).toBeLessThan(0);
      expect(zeroMetrics.capRate).toBeLessThan(0);
      expect(zeroMetrics.cashOnCashReturn).toBeLessThan(0);
      expect(zeroMetrics.breakEvenOccupancy).toBeGreaterThan(1);
      
      // Very high expenses scenario
      const highExpenseFinancials = { ...sampleFinancials, operatingExpenses: 60000 };
      const highExpenseMetrics = calculateAllMetrics(highExpenseFinancials);
      
      expect(highExpenseMetrics.netOperatingIncome).toBeLessThan(sampleFinancials.grossRentalIncome * 0.5);
      expect(highExpenseMetrics.operatingExpenseRatio).toBeGreaterThan(1);
      
      // No loan scenario
      const noLoanFinancials = { ...sampleFinancials, loanAmount: 0 };
      const noLoanMetrics = calculateAllMetrics(noLoanFinancials);
      
      expect(noLoanMetrics.annualDebtService).toBe(0);
      expect(noLoanMetrics.dscr).toBe(Infinity);
      expect(noLoanMetrics.loanToValue).toBe(0);
    });
  });

  describe('Sensitivity Analysis', () => {
    it('should calculate rent sensitivity correctly', () => {
      const analysis = calculateSensitivityAnalysis(sampleFinancials);
      
      // Base case should match standard calculation
      const baseMetrics = calculateAllMetrics(sampleFinancials);
      expect(analysis.baseCase.netOperatingIncome).toBeCloseTo(baseMetrics.netOperatingIncome, 2);
      
      // Rent increases should improve metrics
      expect(analysis.rentSensitivity.plus10.netOperatingIncome).toBeGreaterThan(baseMetrics.netOperatingIncome);
      expect(analysis.rentSensitivity.plus10.cashOnCashReturn).toBeGreaterThan(baseMetrics.cashOnCashReturn);
      
      // Rent decreases should worsen metrics
      expect(analysis.rentSensitivity.minus10.netOperatingIncome).toBeLessThan(baseMetrics.netOperatingIncome);
      expect(analysis.rentSensitivity.minus10.cashOnCashReturn).toBeLessThan(baseMetrics.cashOnCashReturn);
    });

    it('should calculate cap rate sensitivity correctly', () => {
      const analysis = calculateSensitivityAnalysis(sampleFinancials);
      
      // Higher cap rates should reduce ARV
      expect(analysis.capRateSensitivity.plus1.arv).toBeLessThan(analysis.baseCase.arv);
      
      // Lower cap rates should increase ARV
      expect(analysis.capRateSensitivity.minus1.arv).toBeGreaterThan(analysis.baseCase.arv);
    });

    it('should calculate interest rate sensitivity correctly', () => {
      const analysis = calculateSensitivityAnalysis(sampleFinancials);
      
      // Higher interest rates should reduce cash flow
      expect(analysis.interestRateSensitivity.plus1.annualCashFlow).toBeLessThan(analysis.baseCase.annualCashFlow);
      
      // Lower interest rates should increase cash flow
      expect(analysis.interestRateSensitivity.minus1.annualCashFlow).toBeGreaterThan(analysis.baseCase.annualCashFlow);
    });
  });

  describe('Exit Scenario Analysis', () => {
    it('should calculate exit scenarios accurately', () => {
      const exitScenarios = calculateExitScenarios(sampleFinancials, 5, 0.03, 0.06);
      
      // Hold scenario
      expect(exitScenarios.hold.holdPeriodYears).toBe(5);
      expect(exitScenarios.hold.projectedNOI).toBeGreaterThan(sampleFinancials.grossRentalIncome * 0.5);
      
      // Refinance scenario
      expect(exitScenarios.refinance.netSaleProceeds).toBeGreaterThan(0);
      expect(exitScenarios.refinance.equityMultiple).toBeGreaterThan(1);
      
      // Sale scenario
      expect(exitScenarios.sale.projectedSalePrice).toBeGreaterThan(sampleFinancials.purchasePrice);
      expect(exitScenarios.sale.totalReturn).toBeGreaterThan(0);
    });

    it('should handle different appreciation rates', () => {
      const lowAppreciation = calculateExitScenarios(sampleFinancials, 5, 0.01, 0.06);
      const highAppreciation = calculateExitScenarios(sampleFinancials, 5, 0.05, 0.06);
      
      // Higher appreciation should result in better returns
      expect(highAppreciation.sale.projectedSalePrice).toBeGreaterThan(lowAppreciation.sale.projectedSalePrice);
      expect(highAppreciation.sale.equityMultiple).toBeGreaterThan(lowAppreciation.sale.equityMultiple);
    });
  });

  describe('Mathematical Consistency', () => {
    it('should maintain mathematical relationships between metrics', () => {
      const metrics = calculateAllMetrics(sampleFinancials);
      
      // NOI = Effective Gross Income - Operating Expenses
      const effectiveGrossIncome = (sampleFinancials.grossRentalIncome * (1 - sampleFinancials.vacancyRate)) + sampleFinancials.otherIncome;
      expect(metrics.netOperatingIncome).toBeCloseTo(effectiveGrossIncome - sampleFinancials.operatingExpenses, 2);
      
      // Cash Flow = NOI - Debt Service
      expect(metrics.annualCashFlow).toBeCloseTo(metrics.netOperatingIncome - metrics.annualDebtService, 2);
      
      // Cap Rate = NOI / ARV
      expect(metrics.capRate).toBeCloseTo(metrics.netOperatingIncome / metrics.arv, 4);
      
      // Cash-on-Cash = Annual Cash Flow / Initial Capital
      expect(metrics.cashOnCashReturn).toBeCloseTo(metrics.annualCashFlow / metrics.initialCapitalRequired, 4);
      
      // DSCR = NOI / Annual Debt Service
      expect(metrics.dscr).toBeCloseTo(metrics.netOperatingIncome / metrics.annualDebtService, 4);
      
      // LTV = Loan Amount / ARV
      expect(metrics.loanToValue).toBeCloseTo(sampleFinancials.loanAmount / metrics.arv, 4);
    });

    it('should handle percentage vs dollar amounts correctly', () => {
      // Test with percentage-based expenses
      const percentageExpenseFinancials = {
        ...sampleFinancials,
        operatingExpenses: 0.35 // 35% of effective gross income
      };
      
      const metrics = calculateAllMetrics(percentageExpenseFinancials);
      const effectiveGrossIncome = (sampleFinancials.grossRentalIncome * (1 - sampleFinancials.vacancyRate)) + sampleFinancials.otherIncome;
      const expectedExpenses = effectiveGrossIncome * 0.35;
      
      expect(metrics.operatingExpenseRatio).toBeCloseTo(0.35, 3);
      expect(metrics.netOperatingIncome).toBeCloseTo(effectiveGrossIncome - expectedExpenses, 2);
    });

    it('should validate all calculated values are finite numbers', () => {
      const metrics = calculateAllMetrics(sampleFinancials);
      
      Object.entries(metrics).forEach(([key, value]) => {
        expect(typeof value).toBe('number');
        expect(isFinite(value)).toBe(true);
        expect(isNaN(value)).toBe(false);
      });
    });

    it('should maintain precision across multiple calculations', () => {
      // Perform the same calculation multiple times to ensure consistency
      const iterations = 10;
      const results = [];
      
      for (let i = 0; i < iterations; i++) {
        const metrics = calculateAllMetrics(sampleFinancials);
        results.push(metrics);
      }
      
      // All results should be identical
      for (let i = 1; i < iterations; i++) {
        Object.keys(results[0]).forEach(key => {
          expect(results[i][key]).toBeCloseTo(results[0][key], 10);
        });
      }
    });
  });
});

describe('Boundary and Edge Case Testing', () => {
  it('should handle minimum viable inputs', () => {
    const minimalFinancials: PropertyFinancials = {
      purchasePrice: 1000,
      rehabCosts: 0,
      closingCosts: 0,
      holdingCosts: 0,
      grossRentalIncome: 120,
      vacancyRate: 0,
      otherIncome: 0,
      operatingExpenses: 50,
      loanAmount: 0,
      interestRate: 0,
      loanTermYears: 30,
      paymentType: 'principal_and_interest',
      marketCapRate: 0.1
    };
    
    const metrics = calculateAllMetrics(minimalFinancials);
    
    expect(metrics.allInCost).toBe(1000);
    expect(metrics.netOperatingIncome).toBe(70);
    expect(metrics.annualDebtService).toBe(0);
    expect(metrics.capRate).toBeCloseTo(0.07, 3); // 70 / 1000
  });

  it('should handle maximum reasonable inputs', () => {
    const maximalFinancials: PropertyFinancials = {
      purchasePrice: 10000000,
      rehabCosts: 2000000,
      closingCosts: 500000,
      holdingCosts: 100000,
      grossRentalIncome: 1200000,
      vacancyRate: 0.1,
      otherIncome: 50000,
      operatingExpenses: 400000,
      loanAmount: 8000000,
      interestRate: 0.08,
      loanTermYears: 30,
      paymentType: 'principal_and_interest',
      marketCapRate: 0.05
    };
    
    const metrics = calculateAllMetrics(maximalFinancials);
    
    expect(metrics.allInCost).toBe(12600000);
    expect(metrics.netOperatingIncome).toBeCloseTo(730000, 0);
    expect(metrics.capRate).toBeCloseTo(0.05, 3);
    expect(metrics.annualDebtService).toBeGreaterThan(500000);
  });

  it('should handle zero and negative scenarios', () => {
    const negativeScenario: PropertyFinancials = {
      purchasePrice: 150000,
      rehabCosts: 50000,
      closingCosts: 5000,
      holdingCosts: 3000,
      grossRentalIncome: 12000, // Very low income
      vacancyRate: 0.2,
      otherIncome: 0,
      operatingExpenses: 15000,
      loanAmount: 160000,
      interestRate: 0.1,
      loanTermYears: 30,
      paymentType: 'principal_and_interest',
      marketCapRate: 0.08
    };
    
    const metrics = calculateAllMetrics(negativeScenario);
    
    expect(metrics.netOperatingIncome).toBeLessThan(0);
    expect(metrics.annualCashFlow).toBeLessThan(0);
    expect(metrics.cashOnCashReturn).toBeLessThan(0);
    expect(metrics.capRate).toBeLessThan(0);
    expect(metrics.dscr).toBeLessThan(1);
    expect(metrics.breakEvenOccupancy).toBeGreaterThan(1);
  });
});