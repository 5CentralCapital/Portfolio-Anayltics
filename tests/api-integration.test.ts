/**
 * API Integration Tests
 * 
 * This test suite validates that the API endpoints correctly handle
 * real-time data updates and maintain consistency across all modules.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { testDb } from './setup';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../server/routes';

// Create test app
const createTestApp = async () => {
  const app = express();
  app.use(express.json());
  return await registerRoutes(app);
};

describe('API Integration Tests', () => {
  let app: any;
  let testUser: any;
  let testProperty: any;

  beforeEach(async () => {
    app = await createTestApp();
    testUser = await testDb.createTestUser();
    
    // Create test property via API
    const propertyData = {
      userId: testUser.id,
      address: '456 API Test Street',
      city: 'API City',
      state: 'AC',
      apartments: 3,
      acquisitionPrice: '$180,000',
      initialCapitalRequired: '$54,000',
      cashFlow: '$950',
      totalProfits: '$30,000',
      cashOnCashReturn: '17.6%',
      capRate: '7.8%',
      entityName: '5Central Capital',
      status: 'Under Contract',
      dealAnalyzerData: JSON.stringify({
        propertyName: 'API Test Property',
        address: '456 API Test Street',
        assumptions: {
          purchasePrice: 180000,
          loanPercentage: 75,
          interestRate: 6.0,
          marketCapRate: 7.5,
          refinanceLTV: 70,
          refinanceRate: 5.0,
          annualAppreciation: 2.5
        },
        rentRoll: [
          { unitNumber: '1', unitType: '2BR/1BA', currentRent: 1300, marketRent: 1350 },
          { unitNumber: '2', unitType: '2BR/1BA', currentRent: 1300, marketRent: 1350 },
          { unitNumber: '3', unitType: '1BR/1BA', currentRent: 1100, marketRent: 1150 }
        ],
        expenses: [
          { category: 'Insurance', amount: 2800, isPercentage: false },
          { category: 'Property Tax', amount: 4200, isPercentage: false },
          { category: 'Management', amount: 10, isPercentage: true },
          { category: 'Maintenance', amount: 7000, isPercentage: false }
        ]
      })
    };

    const response = await request(app)
      .post('/api/properties')
      .send(propertyData);
    
    testProperty = response.body;
  });

  describe('Property CRUD Operations', () => {
    it('should create property with Deal Analyzer data', async () => {
      expect(testProperty).toBeDefined();
      expect(testProperty.address).toBe('456 API Test Street');
      expect(testProperty.dealAnalyzerData).toBeDefined();
      
      const dealData = JSON.parse(testProperty.dealAnalyzerData);
      expect(dealData.assumptions.purchasePrice).toBe(180000);
      expect(dealData.rentRoll).toHaveLength(3);
    });

    it('should retrieve property with calculated metrics', async () => {
      const response = await request(app)
        .get(`/api/properties/${testProperty.id}`);
      
      expect(response.status).toBe(200);
      expect(response.body.address).toBe('456 API Test Street');
      expect(response.body.dealAnalyzerData).toBeDefined();
    });

    it('should update property and trigger real-time calculations', async () => {
      const dealData = JSON.parse(testProperty.dealAnalyzerData);
      dealData.assumptions.purchasePrice = 170000; // Reduce price
      dealData.rentRoll[0].currentRent = 1400; // Increase rent
      
      const updateResponse = await request(app)
        .put(`/api/properties/${testProperty.id}`)
        .send({
          dealAnalyzerData: JSON.stringify(dealData)
        });
      
      expect(updateResponse.status).toBe(200);
      
      // Verify calculations were updated
      const metricsResponse = await request(app)
        .get(`/api/properties/${testProperty.id}/metrics`);
      
      expect(metricsResponse.status).toBe(200);
      expect(metricsResponse.body.allInCost).toBeLessThan(180000);
    });
  });

  describe('Real-Time Calculation Endpoints', () => {
    it('should calculate property metrics accurately', async () => {
      const response = await request(app)
        .get(`/api/properties/${testProperty.id}/metrics`);
      
      expect(response.status).toBe(200);
      const metrics = response.body;
      
      // Verify all required metrics are present
      expect(metrics).toHaveProperty('grossRentalIncome');
      expect(metrics).toHaveProperty('netOperatingIncome');
      expect(metrics).toHaveProperty('capRate');
      expect(metrics).toHaveProperty('cashOnCashReturn');
      expect(metrics).toHaveProperty('equityMultiple');
      expect(metrics).toHaveProperty('dscr');
      expect(metrics).toHaveProperty('allInCost');
      expect(metrics).toHaveProperty('currentArv');
      
      // Verify metrics are reasonable
      expect(metrics.grossRentalIncome).toBeGreaterThan(40000);
      expect(metrics.netOperatingIncome).toBeGreaterThan(20000);
      expect(metrics.capRate).toBeGreaterThan(0.05);
    });

    it('should trigger real-time update when property data changes', async () => {
      // Get initial metrics
      const initialResponse = await request(app)
        .get(`/api/properties/${testProperty.id}/metrics`);
      const initialMetrics = initialResponse.body;
      
      // Update property data
      const dealData = JSON.parse(testProperty.dealAnalyzerData);
      dealData.rentRoll.forEach((unit: any) => {
        unit.currentRent += 200; // Significant rent increase
      });
      
      await request(app)
        .put(`/api/properties/${testProperty.id}`)
        .send({
          dealAnalyzerData: JSON.stringify(dealData)
        });
      
      // Trigger real-time update
      const updateResponse = await request(app)
        .post(`/api/properties/${testProperty.id}/update-metrics`);
      
      expect(updateResponse.status).toBe(200);
      
      // Get updated metrics
      const updatedResponse = await request(app)
        .get(`/api/properties/${testProperty.id}/metrics`);
      const updatedMetrics = updatedResponse.body;
      
      // Verify metrics improved with higher rents
      expect(updatedMetrics.grossRentalIncome).toBeGreaterThan(initialMetrics.grossRentalIncome);
      expect(updatedMetrics.netOperatingIncome).toBeGreaterThan(initialMetrics.netOperatingIncome);
      expect(updatedMetrics.capRate).toBeGreaterThan(initialMetrics.capRate);
    });

    it('should calculate KPIs consistently with property metrics', async () => {
      const metricsResponse = await request(app)
        .get(`/api/properties/${testProperty.id}/metrics`);
      
      const kpisResponse = await request(app)
        .get(`/api/properties/${testProperty.id}/kpis`);
      
      expect(metricsResponse.status).toBe(200);
      expect(kpisResponse.status).toBe(200);
      
      const metrics = metricsResponse.body;
      const kpis = kpisResponse.body;
      
      // Verify consistency between systems
      const tolerance = 0.02; // 2% tolerance
      expect(Math.abs(metrics.grossRentalIncome - kpis.grossRentalIncome) / metrics.grossRentalIncome).toBeLessThan(tolerance);
      expect(Math.abs(metrics.netOperatingIncome - kpis.netOperatingIncome) / metrics.netOperatingIncome).toBeLessThan(tolerance);
      expect(Math.abs(metrics.capRate - kpis.capRate) / metrics.capRate).toBeLessThan(tolerance);
    });
  });

  describe('Entity-Level API Integration', () => {
    it('should calculate entity metrics from property data', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser.id}/entities/5Central Capital/metrics`);
      
      expect(response.status).toBe(200);
      const entityMetrics = response.body;
      
      expect(entityMetrics).toHaveProperty('totalProperties');
      expect(entityMetrics).toHaveProperty('totalCashFlow');
      expect(entityMetrics).toHaveProperty('totalEquity');
      expect(entityMetrics).toHaveProperty('avgCapRate');
      
      expect(entityMetrics.totalProperties).toBeGreaterThan(0);
      expect(entityMetrics.totalCashFlow).toBeGreaterThan(0);
    });

    it('should update entity metrics when property changes', async () => {
      // Get initial entity metrics
      const initialResponse = await request(app)
        .get(`/api/users/${testUser.id}/entities/5Central Capital/metrics`);
      const initialEntityMetrics = initialResponse.body;
      
      // Significantly improve property performance
      const dealData = JSON.parse(testProperty.dealAnalyzerData);
      dealData.assumptions.purchasePrice = 150000; // Lower price
      dealData.rentRoll.forEach((unit: any) => {
        unit.currentRent += 300; // Major rent increase
      });
      
      await request(app)
        .put(`/api/properties/${testProperty.id}`)
        .send({
          dealAnalyzerData: JSON.stringify(dealData)
        });
      
      // Trigger updates
      await request(app)
        .post(`/api/properties/${testProperty.id}/update-metrics`);
      
      // Get updated entity metrics
      const updatedResponse = await request(app)
        .get(`/api/users/${testUser.id}/entities/5Central Capital/metrics`);
      const updatedEntityMetrics = updatedResponse.body;
      
      // Verify entity metrics improved
      expect(updatedEntityMetrics.totalCashFlow).toBeGreaterThan(initialEntityMetrics.totalCashFlow);
      expect(updatedEntityMetrics.avgCapRate).toBeGreaterThan(initialEntityMetrics.avgCapRate);
    });
  });

  describe('Data Consistency Validation', () => {
    it('should maintain consistency across all API endpoints', async () => {
      // Get data from multiple endpoints
      const propertyResponse = await request(app)
        .get(`/api/properties/${testProperty.id}`);
      
      const metricsResponse = await request(app)
        .get(`/api/properties/${testProperty.id}/metrics`);
      
      const kpisResponse = await request(app)
        .get(`/api/properties/${testProperty.id}/kpis`);
      
      const propertiesListResponse = await request(app)
        .get('/api/properties');
      
      // Verify all endpoints return consistent data
      expect(propertyResponse.status).toBe(200);
      expect(metricsResponse.status).toBe(200);
      expect(kpisResponse.status).toBe(200);
      expect(propertiesListResponse.status).toBe(200);
      
      const property = propertyResponse.body;
      const metrics = metricsResponse.body;
      const kpis = kpisResponse.body;
      const propertiesList = propertiesListResponse.body;
      
      // Find property in list
      const propertyInList = propertiesList.find((p: any) => p.id === testProperty.id);
      expect(propertyInList).toBeDefined();
      
      // Verify basic property data consistency
      expect(property.address).toBe(propertyInList.address);
      expect(property.status).toBe(propertyInList.status);
      expect(property.entityName).toBe(propertyInList.entityName);
    });

    it('should handle concurrent API requests without data corruption', async () => {
      const concurrentRequests = Array.from({ length: 10 }, (_, i) => {
        return request(app)
          .get(`/api/properties/${testProperty.id}/metrics`);
      });
      
      const responses = await Promise.all(concurrentRequests);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('grossRentalIncome');
        expect(response.body).toHaveProperty('netOperatingIncome');
      });
      
      // All responses should be identical
      const firstResponse = responses[0].body;
      responses.slice(1).forEach(response => {
        expect(response.body.grossRentalIncome).toBeCloseTo(firstResponse.grossRentalIncome, 2);
        expect(response.body.netOperatingIncome).toBeCloseTo(firstResponse.netOperatingIncome, 2);
        expect(response.body.capRate).toBeCloseTo(firstResponse.capRate, 4);
      });
    });

    it('should validate data persistence after updates', async () => {
      // Make multiple updates to test persistence
      const updates = [
        { purchasePrice: 175000, rent: 1400 },
        { purchasePrice: 165000, rent: 1450 },
        { purchasePrice: 170000, rent: 1425 }
      ];
      
      for (const update of updates) {
        const dealData = JSON.parse(testProperty.dealAnalyzerData);
        dealData.assumptions.purchasePrice = update.purchasePrice;
        dealData.rentRoll[0].currentRent = update.rent;
        
        await request(app)
          .put(`/api/properties/${testProperty.id}`)
          .send({
            dealAnalyzerData: JSON.stringify(dealData)
          });
        
        // Verify data was persisted
        const response = await request(app)
          .get(`/api/properties/${testProperty.id}`);
        
        const savedData = JSON.parse(response.body.dealAnalyzerData);
        expect(savedData.assumptions.purchasePrice).toBe(update.purchasePrice);
        expect(savedData.rentRoll[0].currentRent).toBe(update.rent);
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid property IDs gracefully', async () => {
      const response = await request(app)
        .get('/api/properties/99999/metrics');
      
      expect(response.status).toBe(404);
    });

    it('should handle malformed Deal Analyzer data', async () => {
      const response = await request(app)
        .put(`/api/properties/${testProperty.id}`)
        .send({
          dealAnalyzerData: 'invalid json'
        });
      
      expect(response.status).toBe(400);
    });

    it('should handle missing required fields', async () => {
      const incompleteData = {
        address: 'Incomplete Property'
        // Missing required fields
      };
      
      const response = await request(app)
        .post('/api/properties')
        .send(incompleteData);
      
      expect(response.status).toBe(400);
    });

    it('should handle extreme calculation values', async () => {
      const dealData = JSON.parse(testProperty.dealAnalyzerData);
      dealData.assumptions.purchasePrice = 1; // Extreme low value
      dealData.rentRoll[0].currentRent = 1000000; // Extreme high value
      
      const updateResponse = await request(app)
        .put(`/api/properties/${testProperty.id}`)
        .send({
          dealAnalyzerData: JSON.stringify(dealData)
        });
      
      expect(updateResponse.status).toBe(200);
      
      // Calculations should still work
      const metricsResponse = await request(app)
        .get(`/api/properties/${testProperty.id}/metrics`);
      
      expect(metricsResponse.status).toBe(200);
      expect(typeof metricsResponse.body.capRate).toBe('number');
      expect(isFinite(metricsResponse.body.capRate)).toBe(true);
    });
  });

  describe('Performance Validation', () => {
    it('should handle API requests within acceptable time limits', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get(`/api/properties/${testProperty.id}/metrics`);
      
      const duration = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle bulk operations efficiently', async () => {
      // Create multiple properties
      const properties = [];
      for (let i = 0; i < 5; i++) {
        const propertyData = {
          userId: testUser.id,
          address: `${100 + i} Bulk Test St`,
          city: 'Bulk City',
          state: 'BC',
          apartments: 2,
          acquisitionPrice: '$100,000',
          initialCapitalRequired: '$25,000',
          cashFlow: '$500',
          entityName: '5Central Capital',
          status: 'Under Contract',
          dealAnalyzerData: JSON.stringify({
            assumptions: { purchasePrice: 100000 + i * 1000 },
            rentRoll: [{ unitNumber: '1', currentRent: 1000, marketRent: 1000 }]
          })
        };
        
        const response = await request(app)
          .post('/api/properties')
          .send(propertyData);
        
        properties.push(response.body);
      }
      
      // Test bulk retrieval
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/properties');
      
      const duration = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThanOrEqual(6); // Original + 5 new
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });
});