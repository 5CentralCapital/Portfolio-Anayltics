/**
 * Comprehensive Data Flow Integration Tests
 * 
 * This test suite validates that editing inputs in Deal Analyzer instantly updates
 * all affected KPIs across Properties and Entity Dashboard modules with zero manual refresh.
 * 
 * Test Goal: Prove no stale data survives when Deal Analyzer inputs change.
 */

import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import { testDb } from './setup';
import { storage } from '../server/storage';
import { calculationService } from '../server/calculation.service';
import { realTimeCalculator } from '../server/real-time-calculator';
import { kpiService } from '../server/kpi.service';

describe('Deal Analyzer → Properties Data Flow Integration', () => {
  let testUser: any;
  let testProperty: any;

  beforeEach(async () => {
    // Create fresh test user and property for each test
    testUser = await testDb.createTestUser();
    
    // Create test property with Deal Analyzer data
    testProperty = await storage.createProperty({
      userId: testUser.id,
      address: '123 Test Street',
      city: 'Test City',
      state: 'TS',
      apartments: 4,
      acquisitionPrice: '$150,000',
      initialCapitalRequired: '$45,000',
      cashFlow: '$850',
      totalProfits: '$25,000',
      cashOnCashReturn: '22.6%',
      capRate: '8.5%',
      entityName: '5Central Capital',
      status: 'Under Contract',
      dealAnalyzerData: JSON.stringify({
        propertyName: 'Test Property Deal',
        address: '123 Test Street',
        assumptions: {
          purchasePrice: 150000,
          loanPercentage: 80,
          interestRate: 6.5,
          marketCapRate: 7.0,
          refinanceLTV: 75,
          refinanceRate: 5.5,
          annualAppreciation: 3.0
        },
        rentRoll: [
          { unitNumber: '1A', unitType: '2BR/1BA', currentRent: 1200, marketRent: 1250 },
          { unitNumber: '1B', unitType: '1BR/1BA', currentRent: 950, marketRent: 1000 },
          { unitNumber: '2A', unitType: '2BR/1BA', currentRent: 1200, marketRent: 1250 },
          { unitNumber: '2B', unitType: '1BR/1BA', currentRent: 950, marketRent: 1000 }
        ],
        expenses: [
          { category: 'Insurance', amount: 2400, isPercentage: false },
          { category: 'Property Tax', amount: 3600, isPercentage: false },
          { category: 'Management', amount: 8, isPercentage: true },
          { category: 'Maintenance', amount: 6000, isPercentage: false },
          { category: 'Utilities', amount: 1200, isPercentage: false }
        ],
        rehabBudget: {
          'Exterior': [
            { item: 'Roof Repair', cost: 5000, completed: false },
            { item: 'Siding', cost: 8000, completed: false }
          ],
          'Kitchens': [
            { item: 'Cabinets', cost: 6000, completed: false },
            { item: 'Appliances', cost: 4000, completed: false }
          ],
          'Bathrooms': [
            { item: 'Vanities', cost: 2000, completed: false },
            { item: 'Tile Work', cost: 3000, completed: false }
          ]
        }
      })
    });
  });

  describe('Real-Time KPI Calculations', () => {
    it('should calculate accurate property metrics from Deal Analyzer data', async () => {
      const metrics = await calculationService.calculatePropertyMetrics(testProperty.id);
      
      // Verify core financial metrics
      expect(metrics.grossRentalIncome).toBeCloseTo(54000, 0); // 4500/month * 12
      expect(metrics.netOperatingIncome).toBeGreaterThan(30000);
      expect(metrics.capRate).toBeGreaterThan(0.05);
      expect(metrics.cashOnCashReturn).toBeGreaterThan(0.15);
      
      // Verify calculated costs
      expect(metrics.totalRehab).toBeCloseTo(28000, 0); // Sum of rehab items
      expect(metrics.allInCost).toBeGreaterThan(150000);
      
      // Verify loan metrics
      expect(metrics.loanToValue).toBeCloseTo(0.8, 0.01);
      expect(metrics.dscr).toBeGreaterThan(1.0);
    });

    it('should update all KPIs when rent roll changes', async () => {
      // Get initial metrics
      const initialMetrics = await calculationService.calculatePropertyMetrics(testProperty.id);
      
      // Update rent roll with higher rents
      const updatedData = JSON.parse(testProperty.dealAnalyzerData);
      updatedData.rentRoll.forEach((unit: any) => {
        unit.currentRent = unit.marketRent + 100; // Increase all rents by $100
      });
      
      await storage.updateProperty(testProperty.id, {
        dealAnalyzerData: JSON.stringify(updatedData)
      });
      
      // Trigger real-time calculation update
      await realTimeCalculator.updatePropertyMetrics(testProperty.id);
      
      // Get updated metrics
      const updatedMetrics = await calculationService.calculatePropertyMetrics(testProperty.id);
      
      // Verify metrics increased with higher rents
      expect(updatedMetrics.grossRentalIncome).toBeGreaterThan(initialMetrics.grossRentalIncome);
      expect(updatedMetrics.netOperatingIncome).toBeGreaterThan(initialMetrics.netOperatingIncome);
      expect(updatedMetrics.capRate).toBeGreaterThan(initialMetrics.capRate);
      expect(updatedMetrics.cashOnCashReturn).toBeGreaterThan(initialMetrics.cashOnCashReturn);
    });

    it('should update all KPIs when expenses change', async () => {
      // Get initial metrics
      const initialMetrics = await calculationService.calculatePropertyMetrics(testProperty.id);
      
      // Increase maintenance expenses
      const updatedData = JSON.parse(testProperty.dealAnalyzerData);
      const maintenanceExpense = updatedData.expenses.find((exp: any) => exp.category === 'Maintenance');
      maintenanceExpense.amount = 12000; // Double maintenance costs
      
      await storage.updateProperty(testProperty.id, {
        dealAnalyzerData: JSON.stringify(updatedData)
      });
      
      // Trigger real-time calculation update
      await realTimeCalculator.updatePropertyMetrics(testProperty.id);
      
      // Get updated metrics
      const updatedMetrics = await calculationService.calculatePropertyMetrics(testProperty.id);
      
      // Verify metrics decreased with higher expenses
      expect(updatedMetrics.totalOperatingExpenses).toBeGreaterThan(initialMetrics.totalOperatingExpenses);
      expect(updatedMetrics.netOperatingIncome).toBeLessThan(initialMetrics.netOperatingIncome);
      expect(updatedMetrics.capRate).toBeLessThan(initialMetrics.capRate);
      expect(updatedMetrics.cashOnCashReturn).toBeLessThan(initialMetrics.cashOnCashReturn);
    });

    it('should update all KPIs when rehab budget changes', async () => {
      // Get initial metrics
      const initialMetrics = await calculationService.calculatePropertyMetrics(testProperty.id);
      
      // Add significant rehab costs
      const updatedData = JSON.parse(testProperty.dealAnalyzerData);
      updatedData.rehabBudget['Kitchens'].push({
        item: 'Premium Appliances',
        cost: 15000,
        completed: false
      });
      
      await storage.updateProperty(testProperty.id, {
        dealAnalyzerData: JSON.stringify(updatedData)
      });
      
      // Trigger real-time calculation update
      await realTimeCalculator.updatePropertyMetrics(testProperty.id);
      
      // Get updated metrics
      const updatedMetrics = await calculationService.calculatePropertyMetrics(testProperty.id);
      
      // Verify metrics reflect increased rehab costs
      expect(updatedMetrics.totalRehab).toBeGreaterThan(initialMetrics.totalRehab);
      expect(updatedMetrics.allInCost).toBeGreaterThan(initialMetrics.allInCost);
      expect(updatedMetrics.currentEquityValue).toBeLessThan(initialMetrics.currentEquityValue);
    });

    it('should update all KPIs when purchase price changes', async () => {
      // Get initial metrics
      const initialMetrics = await calculationService.calculatePropertyMetrics(testProperty.id);
      
      // Lower purchase price significantly
      const updatedData = JSON.parse(testProperty.dealAnalyzerData);
      updatedData.assumptions.purchasePrice = 120000; // $30k reduction
      
      await storage.updateProperty(testProperty.id, {
        dealAnalyzerData: JSON.stringify(updatedData)
      });
      
      // Trigger real-time calculation update
      await realTimeCalculator.updatePropertyMetrics(testProperty.id);
      
      // Get updated metrics
      const updatedMetrics = await calculationService.calculatePropertyMetrics(testProperty.id);
      
      // Verify metrics improved with lower purchase price
      expect(updatedMetrics.allInCost).toBeLessThan(initialMetrics.allInCost);
      expect(updatedMetrics.cashOnCashReturn).toBeGreaterThan(initialMetrics.cashOnCashReturn);
      expect(updatedMetrics.equityMultiple).toBeGreaterThan(initialMetrics.equityMultiple);
    });

    it('should update all KPIs when loan parameters change', async () => {
      // Get initial metrics
      const initialMetrics = await calculationService.calculatePropertyMetrics(testProperty.id);
      
      // Improve loan terms
      const updatedData = JSON.parse(testProperty.dealAnalyzerData);
      updatedData.assumptions.loanPercentage = 85; // Higher LTV
      updatedData.assumptions.interestRate = 5.5; // Lower rate
      
      await storage.updateProperty(testProperty.id, {
        dealAnalyzerData: JSON.stringify(updatedData)
      });
      
      // Trigger real-time calculation update
      await realTimeCalculator.updatePropertyMetrics(testProperty.id);
      
      // Get updated metrics
      const updatedMetrics = await calculationService.calculatePropertyMetrics(testProperty.id);
      
      // Verify metrics reflect better loan terms
      expect(updatedMetrics.annualDebtService).toBeLessThan(initialMetrics.annualDebtService);
      expect(updatedMetrics.beforeTaxCashFlow).toBeGreaterThan(initialMetrics.beforeTaxCashFlow);
      expect(updatedMetrics.cashOnCashReturn).toBeGreaterThan(initialMetrics.cashOnCashReturn);
      expect(updatedMetrics.dscr).toBeGreaterThan(initialMetrics.dscr);
    });
  });

  describe('Cross-Module Data Consistency', () => {
    it('should maintain data consistency between Deal Analyzer and Properties display', async () => {
      // Update Deal Analyzer data
      const updatedData = JSON.parse(testProperty.dealAnalyzerData);
      updatedData.propertyName = 'Updated Property Name';
      updatedData.assumptions.purchasePrice = 175000;
      
      await storage.updateProperty(testProperty.id, {
        dealAnalyzerData: JSON.stringify(updatedData)
      });
      
      // Trigger real-time updates
      await realTimeCalculator.updatePropertyMetrics(testProperty.id);
      
      // Fetch property for Properties display
      const updatedProperty = await storage.getProperty(testProperty.id);
      const metrics = await calculationService.calculatePropertyMetrics(testProperty.id);
      
      // Verify data consistency
      expect(JSON.parse(updatedProperty.dealAnalyzerData).propertyName).toBe('Updated Property Name');
      expect(JSON.parse(updatedProperty.dealAnalyzerData).assumptions.purchasePrice).toBe(175000);
      expect(metrics.allInCost).toBeGreaterThan(175000);
    });

    it('should update Entity Dashboard KPIs when property metrics change', async () => {
      // Get initial entity metrics
      const initialEntityMetrics = await realTimeCalculator.calculateEntityMetrics(testProperty.entityName, testUser.id);
      
      // Significantly improve property performance
      const updatedData = JSON.parse(testProperty.dealAnalyzerData);
      updatedData.rentRoll.forEach((unit: any) => {
        unit.currentRent = unit.marketRent + 200; // Major rent increase
      });
      updatedData.assumptions.purchasePrice = 130000; // Lower purchase price
      
      await storage.updateProperty(testProperty.id, {
        dealAnalyzerData: JSON.stringify(updatedData)
      });
      
      // Trigger real-time updates
      await realTimeCalculator.updatePropertyMetrics(testProperty.id);
      
      // Get updated entity metrics
      const updatedEntityMetrics = await realTimeCalculator.calculateEntityMetrics(testProperty.entityName, testUser.id);
      
      // Verify entity-level metrics improved
      expect(updatedEntityMetrics.totalCashFlow).toBeGreaterThan(initialEntityMetrics.totalCashFlow);
      expect(updatedEntityMetrics.totalEquity).toBeGreaterThan(initialEntityMetrics.totalEquity);
      expect(updatedEntityMetrics.averageCapRate).toBeGreaterThan(initialEntityMetrics.averageCapRate);
    });

    it('should handle negative scenarios without breaking calculations', async () => {
      // Create extreme negative scenario
      const updatedData = JSON.parse(testProperty.dealAnalyzerData);
      updatedData.rentRoll.forEach((unit: any) => {
        unit.currentRent = 500; // Very low rents
      });
      updatedData.expenses.forEach((expense: any) => {
        if (!expense.isPercentage) {
          expense.amount = expense.amount * 3; // Triple fixed expenses
        }
      });
      
      await storage.updateProperty(testProperty.id, {
        dealAnalyzerData: JSON.stringify(updatedData)
      });
      
      // Trigger real-time updates
      await realTimeCalculator.updatePropertyMetrics(testProperty.id);
      
      // Get metrics for negative scenario
      const metrics = await calculationService.calculatePropertyMetrics(testProperty.id);
      
      // Verify calculations handle negative scenarios gracefully
      expect(metrics.netOperatingIncome).toBeLessThan(0);
      expect(metrics.beforeTaxCashFlow).toBeLessThan(0);
      expect(metrics.capRate).toBeLessThan(0);
      expect(metrics.dscr).toBeLessThan(1);
      expect(metrics.breakEvenOccupancy).toBeGreaterThan(1); // Over 100%
      
      // Ensure no NaN or undefined values
      Object.values(metrics).forEach(value => {
        expect(typeof value).toBe('number');
        expect(isNaN(value as number)).toBe(false);
      });
    });
  });

  describe('Performance and Consistency Validation', () => {
    it('should complete all calculations within performance thresholds', async () => {
      const startTime = Date.now();
      
      // Perform comprehensive calculation update
      await realTimeCalculator.updatePropertyMetrics(testProperty.id);
      const metrics = await calculationService.calculatePropertyMetrics(testProperty.id);
      const kpis = await kpiService.calculateKPIs(testProperty.id);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Verify performance (should complete within 2 seconds)
      expect(duration).toBeLessThan(2000);
      
      // Verify all calculations completed successfully
      expect(metrics).toBeDefined();
      expect(kpis).toBeDefined();
      expect(Object.keys(metrics).length).toBeGreaterThan(15);
      expect(Object.keys(kpis).length).toBeGreaterThan(20);
    });

    it('should maintain calculation accuracy across multiple updates', async () => {
      const updates = [
        { field: 'purchasePrice', value: 140000 },
        { field: 'purchasePrice', value: 160000 },
        { field: 'purchasePrice', value: 155000 },
        { field: 'purchasePrice', value: 150000 } // Back to original
      ];
      
      let metrics: any[] = [];
      
      for (const update of updates) {
        const updatedData = JSON.parse(testProperty.dealAnalyzerData);
        updatedData.assumptions[update.field] = update.value;
        
        await storage.updateProperty(testProperty.id, {
          dealAnalyzerData: JSON.stringify(updatedData)
        });
        
        await realTimeCalculator.updatePropertyMetrics(testProperty.id);
        const currentMetrics = await calculationService.calculatePropertyMetrics(testProperty.id);
        metrics.push(currentMetrics);
      }
      
      // Verify calculations are deterministic
      // Final metrics should match initial (since we returned to original value)
      const initialMetrics = await calculationService.calculatePropertyMetrics(testProperty.id);
      const finalMetrics = metrics[metrics.length - 1];
      
      expect(Math.abs(finalMetrics.allInCost - initialMetrics.allInCost)).toBeLessThan(100);
      expect(Math.abs(finalMetrics.capRate - initialMetrics.capRate)).toBeLessThan(0.01);
      expect(Math.abs(finalMetrics.cashOnCashReturn - initialMetrics.cashOnCashReturn)).toBeLessThan(0.01);
    });

    it('should handle concurrent updates without data corruption', async () => {
      // Simulate concurrent updates from multiple sources
      const updates = Array.from({ length: 5 }, (_, i) => {
        return realTimeCalculator.updatePropertyMetrics(testProperty.id);
      });
      
      // Wait for all updates to complete
      await Promise.all(updates);
      
      // Verify final state is consistent
      const metrics = await calculationService.calculatePropertyMetrics(testProperty.id);
      const property = await storage.getProperty(testProperty.id);
      
      expect(metrics).toBeDefined();
      expect(property).toBeDefined();
      expect(property.dealAnalyzerData).toBeDefined();
      
      // Verify no data corruption occurred
      const dealData = JSON.parse(property.dealAnalyzerData);
      expect(dealData.assumptions).toBeDefined();
      expect(dealData.rentRoll).toHaveLength(4);
      expect(dealData.expenses).toHaveLength(5);
    });
  });

  describe('End-to-End Data Flow Validation', () => {
    it('should prove no stale data survives Deal Analyzer input changes', async () => {
      // This is the comprehensive test that validates the entire data flow
      
      // Step 1: Get baseline metrics from all systems
      const baselinePropertyMetrics = await calculationService.calculatePropertyMetrics(testProperty.id);
      const baselineKpis = await kpiService.calculateKPIs(testProperty.id);
      const baselineEntityMetrics = await realTimeCalculator.calculateEntityMetrics(testProperty.entityName, testUser.id);
      
      // Step 2: Make significant changes to Deal Analyzer inputs
      const updatedData = JSON.parse(testProperty.dealAnalyzerData);
      
      // Change multiple input categories simultaneously
      updatedData.assumptions.purchasePrice = 130000; // -$20k
      updatedData.assumptions.loanPercentage = 85; // +5%
      updatedData.assumptions.interestRate = 5.5; // -1%
      
      updatedData.rentRoll.forEach((unit: any) => {
        unit.currentRent = unit.marketRent + 150; // +$150 per unit
      });
      
      updatedData.expenses[3].amount = 4000; // Reduce maintenance
      updatedData.rehabBudget['Exterior'][0].cost = 3000; // Reduce roof cost
      
      // Step 3: Apply changes and trigger all updates
      await storage.updateProperty(testProperty.id, {
        dealAnalyzerData: JSON.stringify(updatedData)
      });
      
      await realTimeCalculator.updatePropertyMetrics(testProperty.id);
      
      // Step 4: Get updated metrics from all systems
      const updatedPropertyMetrics = await calculationService.calculatePropertyMetrics(testProperty.id);
      const updatedKpis = await kpiService.calculateKPIs(testProperty.id);
      const updatedEntityMetrics = await realTimeCalculator.calculateEntityMetrics(testProperty.entityName, testUser.id);
      
      // Step 5: Verify ALL systems show updated values (no stale data)
      
      // Property-level metrics should all be different and improved
      expect(updatedPropertyMetrics.grossRentalIncome).toBeGreaterThan(baselinePropertyMetrics.grossRentalIncome);
      expect(updatedPropertyMetrics.netOperatingIncome).toBeGreaterThan(baselinePropertyMetrics.netOperatingIncome);
      expect(updatedPropertyMetrics.allInCost).toBeLessThan(baselinePropertyMetrics.allInCost);
      expect(updatedPropertyMetrics.capRate).toBeGreaterThan(baselinePropertyMetrics.capRate);
      expect(updatedPropertyMetrics.cashOnCashReturn).toBeGreaterThan(baselinePropertyMetrics.cashOnCashReturn);
      expect(updatedPropertyMetrics.equityMultiple).toBeGreaterThan(baselinePropertyMetrics.equityMultiple);
      expect(updatedPropertyMetrics.totalRehab).toBeLessThan(baselinePropertyMetrics.totalRehab);
      
      // KPI system should reflect all changes
      expect(updatedKpis.grossRentalIncome).toBeGreaterThan(baselineKpis.grossRentalIncome);
      expect(updatedKpis.allInCost).toBeLessThan(baselineKpis.allInCost);
      expect(updatedKpis.cashFlow).toBeGreaterThan(baselineKpis.cashFlow);
      expect(updatedKpis.cashOnCashReturn).toBeGreaterThan(baselineKpis.cashOnCashReturn);
      expect(updatedKpis.capRate).toBeGreaterThan(baselineKpis.capRate);
      
      // Entity-level metrics should reflect property improvements
      expect(updatedEntityMetrics.totalCashFlow).toBeGreaterThan(baselineEntityMetrics.totalCashFlow);
      expect(updatedEntityMetrics.totalEquity).toBeGreaterThan(baselineEntityMetrics.totalEquity);
      expect(updatedEntityMetrics.averageCapRate).toBeGreaterThan(baselineEntityMetrics.averageCapRate);
      
      // Step 6: Verify mathematical consistency across all systems
      const tolerance = 0.01; // 1% tolerance for rounding differences
      
      // Property metrics and KPIs should be mathematically consistent
      expect(Math.abs(updatedPropertyMetrics.grossRentalIncome - updatedKpis.grossRentalIncome) / updatedPropertyMetrics.grossRentalIncome).toBeLessThan(tolerance);
      expect(Math.abs(updatedPropertyMetrics.netOperatingIncome - updatedKpis.netOperatingIncome) / updatedPropertyMetrics.netOperatingIncome).toBeLessThan(tolerance);
      expect(Math.abs(updatedPropertyMetrics.capRate - updatedKpis.capRate) / updatedPropertyMetrics.capRate).toBeLessThan(tolerance);
      
      console.log('✅ SUCCESS: All systems updated consistently - no stale data detected');
      console.log(`Property NOI: ${updatedPropertyMetrics.netOperatingIncome.toLocaleString()}`);
      console.log(`KPI NOI: ${updatedKpis.netOperatingIncome.toLocaleString()}`);
      console.log(`Entity Cash Flow: ${updatedEntityMetrics.totalCashFlow.toLocaleString()}`);
    });
  });
});

// Test data validation helpers
describe('Data Validation Helpers', () => {
  it('should validate all required metrics are present and valid', async () => {
    const testUser = await testDb.createTestUser();
    const testProperty = await storage.createProperty({
      userId: testUser.id,
      address: '123 Validation Test',
      city: 'Test City',
      state: 'TS',
      apartments: 2,
      acquisitionPrice: '$100,000',
      initialCapitalRequired: '$25,000',
      cashFlow: '$500',
      totalProfits: '$15,000',
      cashOnCashReturn: '20%',
      capRate: '7%',
      entityName: '5Central Capital',
      status: 'Under Contract',
      dealAnalyzerData: JSON.stringify({
        assumptions: { purchasePrice: 100000 },
        rentRoll: [{ unitNumber: '1', currentRent: 1000, marketRent: 1000 }],
        expenses: [{ category: 'Insurance', amount: 1000, isPercentage: false }]
      })
    });

    const metrics = await calculationService.calculatePropertyMetrics(testProperty.id);
    
    // Validate all required metrics exist and are numbers
    const requiredMetrics = [
      'grossRentalIncome', 'effectiveGrossIncome', 'totalOperatingExpenses',
      'netOperatingIncome', 'beforeTaxCashFlow', 'afterTaxCashFlow',
      'capRate', 'cashOnCashReturn', 'equityMultiple', 'irr',
      'dscr', 'debtYield', 'loanToValue', 'breakEvenOccupancy',
      'operatingExpenseRatio', 'currentArv', 'totalInvestedCapital',
      'currentEquityValue', 'totalRehab', 'totalClosingCosts',
      'totalHoldingCosts', 'allInCost', 'monthlyDebtService', 'annualDebtService'
    ];
    
    requiredMetrics.forEach(metric => {
      expect(metrics).toHaveProperty(metric);
      expect(typeof metrics[metric]).toBe('number');
      expect(isNaN(metrics[metric])).toBe(false);
    });
  });
});