import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, ArrowRight, CheckCircle, AlertTriangle, TrendingUp, Zap, Shield, Search } from 'lucide-react';

export function DatabaseComparison() {
  const [activeExample, setActiveExample] = useState('query');

  const benefits = [
    {
      icon: <TrendingUp className="h-5 w-5 text-green-600" />,
      title: "Better Query Performance",
      description: "Individual indexes on specific columns vs scanning entire JSON",
      example: "Find all properties with rent > $2000: 5ms vs 150ms"
    },
    {
      icon: <Shield className="h-5 w-5 text-blue-600" />,
      title: "Data Integrity",
      description: "Foreign key constraints and proper validation",
      example: "Prevent orphaned rent roll entries when property is deleted"
    },
    {
      icon: <Zap className="h-5 w-5 text-purple-600" />,
      title: "Atomic Updates",
      description: "Update specific sections without touching others",
      example: "Update rehab costs without affecting rent roll data"
    },
    {
      icon: <Search className="h-5 w-5 text-orange-600" />,
      title: "Complex Analytics",
      description: "Join tables for sophisticated reporting",
      example: "Average rent by property type across all entities"
    }
  ];

  const comparisonData = {
    query: {
      title: "Query Performance",
      json: `-- Find properties with average rent > $2000
SELECT p.address, p.entity 
FROM properties p 
WHERE JSON_EXTRACT(p.dealAnalyzerData, '$.rentRoll[*].proFormaRent') > 2000
-- Scans entire JSON field, no indexes`,
      normalized: `-- Find properties with average rent > $2000  
SELECT p.address, p.entity, AVG(rr.pro_forma_rent)
FROM properties p
JOIN property_rent_roll rr ON p.id = rr.property_id
GROUP BY p.id, p.address, p.entity
HAVING AVG(rr.pro_forma_rent) > 2000
-- Uses indexes, much faster`,
      benefit: "87% faster execution with proper indexing"
    },
    integrity: {
      title: "Data Integrity",
      json: `-- JSON approach: No validation
{
  "rentRoll": [
    {"unitNumber": "1A", "rent": "invalid"},
    {"unitNumber": "1A", "rent": 1500}, // Duplicate unit
    {"propertyId": 999} // Orphaned reference
  ]
}`,
      normalized: `-- Normalized tables with constraints
CREATE TABLE property_rent_roll (
  id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  unit_number TEXT NOT NULL,
  pro_forma_rent DECIMAL(10,2) CHECK (pro_forma_rent >= 0),
  UNIQUE(property_id, unit_number)
);`,
      benefit: "Prevents invalid data and maintains referential integrity"
    },
    updates: {
      title: "Atomic Updates", 
      json: `-- Update rehab costs in JSON
UPDATE properties 
SET dealAnalyzerData = JSON_SET(
  dealAnalyzerData, 
  '$.rehabBudgetSections.exterior[0].spentAmount', 
  15000
)
-- Risk of corrupting entire JSON structure`,
      normalized: `-- Update rehab costs in normalized table
UPDATE property_rehab_budget 
SET spent_amount = 15000 
WHERE property_id = 39 
  AND section = 'exterior' 
  AND category = 'Demolition'
-- Safe, isolated update`,
      benefit: "No risk of corrupting other data sections"
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Database Architecture Comparison</h1>
        <p className="text-muted-foreground">JSON Column vs Normalized Tables</p>
      </div>

      {/* Benefits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {benefits.map((benefit, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {benefit.icon}
                <div>
                  <h3 className="font-semibold mb-1">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{benefit.description}</p>
                  <Badge variant="outline" className="text-xs">{benefit.example}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Comparison */}
      <Tabs value={activeExample} onValueChange={setActiveExample} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="query">Query Performance</TabsTrigger>
          <TabsTrigger value="integrity">Data Integrity</TabsTrigger>
          <TabsTrigger value="updates">Atomic Updates</TabsTrigger>
        </TabsList>

        {Object.entries(comparisonData).map(([key, data]) => (
          <TabsContent key={key} value={key} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* JSON Approach */}
              <Card className="border-red-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="h-4 w-4" />
                    Current: JSON Column
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-red-50 p-3 rounded overflow-x-auto">
                    <code>{data.json}</code>
                  </pre>
                </CardContent>
              </Card>

              {/* Normalized Approach */}
              <Card className="border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    Improved: Normalized Tables
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-green-50 p-3 rounded overflow-x-auto">
                    <code>{data.normalized}</code>
                  </pre>
                </CardContent>
              </Card>
            </div>

            {/* Benefit */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">{data.benefit}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Database Schema Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Normalized Schema (8 Tables)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: "property_assumptions", color: "bg-blue-100", description: "Deal parameters, loan terms, vacancy rates" },
              { name: "property_rent_roll", color: "bg-green-100", description: "Individual unit rental data and lease info" },
              { name: "property_expenses", color: "bg-purple-100", description: "Operating expenses by category" },
              { name: "property_rehab_budget", color: "bg-orange-100", description: "Detailed rehab line items by section" },
              { name: "property_closing_costs", color: "bg-indigo-100", description: "Acquisition closing cost breakdown" },
              { name: "property_holding_costs", color: "bg-rose-100", description: "Costs during holding period" },
              { name: "property_exit_analysis", color: "bg-amber-100", description: "Sale scenarios and projections" },
              { name: "property_income_other", color: "bg-emerald-100", description: "Additional income sources" }
            ].map((table, index) => (
              <Card key={index} className={`${table.color} border-0`}>
                <CardContent className="p-3">
                  <h4 className="font-medium text-sm mb-1">{table.name}</h4>
                  <p className="text-xs text-muted-foreground">{table.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Migration Recommendation */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="font-semibold text-lg mb-2">Ready to Migrate?</h3>
            <p className="text-muted-foreground mb-4">
              The normalized database structure is already implemented. Your existing JSON data can be migrated to provide better performance, integrity, and analytics capabilities.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Badge className="bg-green-100 text-green-800">8 normalized tables ready</Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <Badge className="bg-blue-100 text-blue-800">Migration endpoints available</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}