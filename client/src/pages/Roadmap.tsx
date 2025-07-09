import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { 
  MapPin, 
  Building, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Target,
  CheckCircle,
  Clock,
  Star,
  ArrowRight
} from "lucide-react";

interface Property {
  id: number;
  name: string;
  location: string;
  type: string;
  value: string;
  status: string;
  apartments: number;
  address: string;
  city: string;
  state: string;
  acquisitionPrice: string;
  currentValue?: string;
  cashFlow?: string;
  dealAnalyzerData?: string;
}

interface Milestone {
  year: number;
  title: string;
  subtitle: string;
  description: string;
  status: 'completed' | 'in-progress' | 'planned';
  metrics: {
    aum: string;
    properties: number;
    cashFlow: string;
    irr: string;
  };
  keyMilestones: string[];
  properties: Array<{
    name: string;
    location: string;
    type: string;
    value: string;
    status: string;
  }>;
  financials: {
    revenue: string;
    noi: string;
    debt: string;
    equity: string;
  };
  team: Array<{
    name: string;
    role: string;
    joinDate: string;
  }>;
}

export default function Roadmap() {
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  
  // Fetch real portfolio data
  const { data: activeProperties, isLoading: propertiesLoading } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
  });
  
  const { data: portfolioAnalytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/portfolio/analytics'],
  });

  // Calculate real KPIs from data
  const calculateRealKPIs = () => {
    // Fallback to default values if data isn't loaded yet
    if (!activeProperties || !Array.isArray(activeProperties) || !portfolioAnalytics) {
      return { aum: "$3.67M", properties: 3, cashFlow: "$23.9K/mo", irr: "18.5%" };
    }
    
    const totalAUM = (portfolioAnalytics as any).totalAUM || 3670000;
    const propertyCount = activeProperties.length;
    const monthlyCashFlow = (portfolioAnalytics as any).netCashFlow || 23950;
    const irr = (portfolioAnalytics as any).portfolioROI || 18.5;
    
    return {
      aum: `$${(totalAUM / 1000000).toFixed(2)}M`,
      properties: propertyCount,
      cashFlow: `$${(Math.abs(monthlyCashFlow) / 1000).toFixed(1)}K/mo`,
      irr: `${irr.toFixed(1)}%`
    };
  };

  // Transform real properties for milestone display
  const transformRealProperties = (properties: Property[] | undefined) => {
    if (!properties || !Array.isArray(properties)) return [];
    
    return properties.map(prop => ({
      name: prop.address || 'Unknown Property',
      location: `${prop.city || 'Unknown'}, ${prop.state || 'Unknown'}`,
      type: `${prop.apartments || 0} Units`,
      value: prop.acquisitionPrice ? `$${(parseFloat(prop.acquisitionPrice) / 1000000).toFixed(2)}M` : "$0",
      status: prop.status || 'active'
    }));
  };

  const realKPIs = calculateRealKPIs();
  const realProperties = transformRealProperties(activeProperties);

  // Create dynamic milestones with real data for current year
  const createMilestones = (): Milestone[] => [
    {
      year: 2025,
      title: "Current Portfolio",
      subtitle: "Foundation established with stabilized properties",
      description: "Current portfolio status with real performance data from active properties and comprehensive financial metrics.",
      status: 'completed' as const,
      metrics: realKPIs,
      keyMilestones: [
        "Established Connecticut market presence",
        "Diversified geographically with Florida expansion", 
        "Built property management systems",
        "Achieved positive cash flow across portfolio"
      ],
      properties: realProperties,
      financials: {
        revenue: "$28.7K/mo",
        noi: "$23.9K/mo",
        debt: "$2.1M", 
        equity: "$1.57M"
      },
      team: [
        { name: "Founding Team", role: "Managing Partners", joinDate: "2023-2025" },
        { name: "Asset Management", role: "Property Operations", joinDate: "2024" }
      ]
    },
    {
      year: 2030,
      title: "Scale & Expansion",
      subtitle: "Regional presence with diversified portfolio",
      description: "Expanded portfolio across Northeast and Southeast markets with institutional-grade management platform.",
      status: 'in-progress' as const,
      metrics: {
        aum: "$25.0M",
        properties: 15,
        cashFlow: "$125K/mo",
        irr: "22.3%"
      },
      keyMilestones: [
        "Expand to 15+ properties across 5 markets",
        "Launch institutional investment platform",
        "Establish property management subsidiary",
        "Build comprehensive analytics dashboard"
      ],
      properties: [
        { name: "Connecticut Portfolio", location: "Hartford Region", type: "Mixed Portfolio", value: "$8.5M", status: "active" },
        { name: "Florida Expansion", location: "Tampa Bay", type: "Multifamily", value: "$12.2M", status: "active" },
        { name: "Southeast Markets", location: "Atlanta/Charlotte", type: "Value-Add", value: "$4.3M", status: "acquisition" }
      ],
      financials: {
        revenue: "$175K/mo",
        noi: "$125K/mo",
        debt: "$16.25M",
        equity: "$8.75M"
      },
      team: [
        { name: "Regional Managers", role: "Market Leadership", joinDate: "2026-2028" },
        { name: "Acquisition Team", role: "Deal Sourcing", joinDate: "2027" },
        { name: "Asset Management", role: "Portfolio Operations", joinDate: "2026" }
      ]
    },
    {
      year: 2040,
      title: "National Platform",
      subtitle: "Institutional-scale real estate investment platform",
      description: "Mature real estate investment platform with national presence and institutional capital partnerships.",
      status: 'planned' as const,
      metrics: {
        aum: "$150M",
        properties: 75,
        cashFlow: "$750K/mo",
        irr: "19.8%"
      },
      keyMilestones: [
        "Achieve $150M+ AUM across national markets",
        "Launch institutional fund management",
        "Establish technology-driven platform",
        "Build sustainable competitive advantage"
      ],
      properties: [
        { name: "Northeast Portfolio", location: "Multi-Market", type: "Core Holdings", value: "$65M", status: "active" },
        { name: "Southeast Portfolio", location: "Multi-Market", type: "Value-Add", value: "$45M", status: "active" },
        { name: "Emerging Markets", location: "Growth Cities", type: "Development", value: "$40M", status: "active" }
      ],
      financials: {
        revenue: "$1.2M/mo",
        noi: "$750K/mo",
        debt: "$97.5M",
        equity: "$52.5M"
      },
      team: [
        { name: "Executive Team", role: "Platform Leadership", joinDate: "2035+" },
        { name: "Regional Directors", role: "Market Management", joinDate: "2030+" },
        { name: "Investment Committee", role: "Capital Allocation", joinDate: "2032+" }
      ]
    }
  ];

  const milestones = createMilestones();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in-progress': return 'bg-blue-500';
      case 'planned': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'planned': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Show loading only if both are loading, otherwise show roadmap with available data
  if (propertiesLoading && analyticsLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading roadmap data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header with company branding */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Vision</h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Strategic roadmap for building significant AUM through disciplined real estate investments
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Timeline */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-1/2 transform -translate-x-px h-full w-px bg-gray-300"></div>

          {milestones.map((milestone, index) => (
            <div key={milestone.year} className="relative mb-16 last:mb-0">
              {/* Timeline dot with status color */}
              <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full border-4 border-white shadow-lg z-10">
                <div className={`w-full h-full rounded-full ${getStatusColor(milestone.status)}`}></div>
              </div>

              {/* Milestone card - alternating sides */}
              <div className={`w-5/12 ${index % 2 === 0 ? 'mr-auto pr-12' : 'ml-auto pl-12'}`}>
                <div 
                  className="bg-white rounded-lg border border-gray-200 p-6 cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-blue-300"
                  onClick={() => setSelectedMilestone(milestone)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">{milestone.year}</h3>
                    <Badge className={getStatusBadgeColor(milestone.status)}>
                      {milestone.status === 'completed' ? 'Achieved' : 
                       milestone.status === 'in-progress' ? 'In Progress' : 'Future'}
                    </Badge>
                  </div>
                  <h4 className="text-lg font-semibold text-blue-600 mb-2">{milestone.title}</h4>
                  <p className="text-sm text-gray-600 mb-4">{milestone.subtitle}</p>
                  
                  {/* Mini KPI preview */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-blue-50 rounded p-2">
                      <p className="text-blue-600 font-medium">AUM</p>
                      <p className="font-bold text-blue-900">{milestone.metrics.aum}</p>
                    </div>
                    <div className="bg-green-50 rounded p-2">
                      <p className="text-green-600 font-medium">Properties</p>
                      <p className="font-bold text-green-900">{milestone.metrics.properties}</p>
                    </div>
                    <div className="bg-purple-50 rounded p-2">
                      <p className="text-purple-600 font-medium">Cash Flow</p>
                      <p className="font-bold text-purple-900">{milestone.metrics.cashFlow}</p>
                    </div>
                    <div className="bg-orange-50 rounded p-2">
                      <p className="text-orange-600 font-medium">IRR</p>
                      <p className="font-bold text-orange-900">{milestone.metrics.irr}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Modal with Tabs */}
      <Dialog open={!!selectedMilestone} onOpenChange={() => setSelectedMilestone(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {selectedMilestone?.year} - {selectedMilestone?.title}
            </DialogTitle>
          </DialogHeader>

          {selectedMilestone && (
            <Tabs defaultValue="dashboard" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="properties">Properties</TabsTrigger>
                <TabsTrigger value="financials">Financials</TabsTrigger>
                <TabsTrigger value="team">Team</TabsTrigger>
              </TabsList>

              {/* Dashboard Tab - Updated Layout */}
              <TabsContent value="dashboard" className="space-y-6">
                {/* Top KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="p-4">
                    <div className="text-sm text-gray-600 mb-1">Total AUM</div>
                    <div className="text-2xl font-bold text-blue-600">{selectedMilestone.metrics.aum}</div>
                    <div className="text-xs text-gray-500">Assets Under Management</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-gray-600 mb-1">Properties</div>
                    <div className="text-2xl font-bold text-green-600">{selectedMilestone.metrics.properties}</div>
                    <div className="text-xs text-gray-500">Total Portfolio Count</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-gray-600 mb-1">Monthly Cash Flow</div>
                    <div className="text-2xl font-bold text-green-600">{selectedMilestone.metrics.cashFlow}</div>
                    <div className="text-xs text-gray-500">Net Operating Income</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-gray-600 mb-1">Target IRR</div>
                    <div className="text-2xl font-bold text-purple-600">{selectedMilestone.metrics.irr}</div>
                    <div className="text-xs text-gray-500">Internal Rate of Return</div>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Strategic Objectives */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                        <span className="text-blue-600 text-sm">🎯</span>
                      </div>
                      Strategic Objectives
                    </h3>
                    <div className="space-y-3">
                      {selectedMilestone.keyMilestones.map((milestone, idx) => (
                        <div key={idx} className="flex items-center space-x-3">
                          <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                          <span className="text-gray-700 text-sm">{milestone}</span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Portfolio Composition */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-2">
                        <span className="text-green-600 text-sm">📊</span>
                      </div>
                      Portfolio Composition
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Multifamily</span>
                        <span className="font-semibold">45%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Mixed-Use</span>
                        <span className="font-semibold">25%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Industrial</span>
                        <span className="font-semibold">20%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: '20%' }}></div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Retail</span>
                        <span className="font-semibold">10%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-orange-500 h-2 rounded-full" style={{ width: '10%' }}></div>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Bottom Section - 3 columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Geographic Focus</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-gray-700">Connecticut Primary</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-gray-700">New England Expansion</span>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Investment Strategy</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span className="text-gray-700">Value-Add Focus</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span className="text-gray-700">Core+ Stabilized</span>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Market Position</h3>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 mb-2">Achieved</div>
                      <div className="text-sm text-gray-600">Milestone Status</div>
                    </div>
                  </Card>
                </div>
              </TabsContent>

              {/* Properties Tab - Redesigned */}
              <TabsContent value="properties" className="space-y-6">
                {/* Owned Properties Section */}
                <div className="mb-6">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-green-600 font-bold">🏠</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Owned Properties</h3>
                      <p className="text-sm text-gray-600">Currently owned and operated properties in the portfolio</p>
                    </div>
                  </div>
                  
                  {selectedMilestone.year === 2025 && activeProperties && Array.isArray(activeProperties) && activeProperties.length > 0 ? (
                    <div className="space-y-4">
                      {activeProperties.filter(prop => prop.status === 'Cashflowing').map((property, idx) => {
                        // Calculate real metrics for each property
                        const dealData = property.dealAnalyzerData ? JSON.parse(property.dealAnalyzerData) : null;
                        const monthlyRent = dealData?.rentRoll?.reduce((sum: number, unit: any) => sum + (parseFloat(unit.currentRent) || 0), 0) || 0;
                        const monthlyExpenses = dealData?.expenses?.reduce((sum: number, expense: any) => sum + (parseFloat(expense.amount) || 0), 0) || 0;
                        const monthlyNOI = monthlyRent - monthlyExpenses;
                        const annualNOI = monthlyNOI * 12;
                        const arv = parseFloat(property.arv) || 0;
                        const capRate = arv > 0 ? (annualNOI / arv * 100) : 0;
                        
                        return (
                          <Card key={idx} className="p-4 border-l-4 border-l-green-500">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
                                    <span className="text-green-600 text-sm">🏠</span>
                                  </div>
                                  <h4 className="font-semibold text-gray-900">{property.address}</h4>
                                  <Badge className="bg-green-100 text-green-800">OWNED</Badge>
                                </div>
                                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                                  <span className="flex items-center">
                                    <span className="text-red-500 mr-1">📍</span>
                                    {property.city}, {property.state}
                                  </span>
                                  <span className="flex items-center">
                                    <span className="text-blue-500 mr-1">🏢</span>
                                    {property.apartments} Units
                                  </span>
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <div className="text-gray-600">Monthly NOI</div>
                                    <div className="font-bold">${monthlyNOI.toLocaleString()}/mo</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-600">Cap Rate</div>
                                    <div className="font-bold text-purple-600">{capRate.toFixed(1)}%</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-600">Acquisition</div>
                                    <div className="font-bold">{property.acquisitionDate ? new Date(property.acquisitionDate).getFullYear() : 'N/A'}</div>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-green-600">
                                  ${arv > 0 ? (arv / 1000000).toFixed(2) + 'M' : 'N/A'}
                                </div>
                                <Badge className="bg-green-100 text-green-800">Stabilized</Badge>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <Card className="p-6 text-center text-gray-500">
                      <p>No owned properties for this milestone</p>
                    </Card>
                  )}
                </div>

                {/* Projected Properties Section */}
                <div className="mb-6">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-600 font-bold">🎯</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Projected Properties</h3>
                      <p className="text-sm text-gray-600">Future acquisition targets and development pipeline</p>
                    </div>
                  </div>
                  
                  <Card className="p-6 text-center text-gray-500">
                    <p>No projected properties for this milestone</p>
                  </Card>
                </div>

                {/* Portfolio Summary */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="text-blue-600 mr-2">📊</span>
                    Portfolio Summary
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="text-3xl font-bold text-green-600">
                        {activeProperties && Array.isArray(activeProperties) ? activeProperties.filter(p => p.status === 'Cashflowing').length : 0}
                      </div>
                      <div className="text-sm text-gray-600">Owned Properties</div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600">
                        {activeProperties && Array.isArray(activeProperties) ? activeProperties.filter(p => p.status === 'Under Contract' || p.status === 'Rehabbing').length : 0}
                      </div>
                      <div className="text-sm text-gray-600">Pipeline Properties</div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="text-3xl font-bold text-purple-600">
                        {activeProperties && Array.isArray(activeProperties) ? activeProperties.filter(p => p.status !== 'Sold').length : 0}
                      </div>
                      <div className="text-sm text-gray-600">Total Portfolio</div>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <div className="text-3xl font-bold text-orange-600">
                        {activeProperties && Array.isArray(activeProperties) ? 
                          `$${(activeProperties.filter(p => p.status !== 'Sold').reduce((sum, p) => sum + (parseFloat(p.arv) || 0), 0) / 1000000).toFixed(1)}M` : 
                          '$0M'
                        }
                      </div>
                      <div className="text-sm text-gray-600">Total AUM</div>
                    </div>
                  </div>
                </Card>

                {/* Acquisition Strategy & Market Focus */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Acquisition Strategy</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-gray-700">Stabilized assets for immediate cash flow</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-gray-700">Value-add opportunities for growth</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span className="text-gray-700">Development projects for premium returns</span>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Market Focus</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-gray-700">Primary: Connecticut & New England</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-gray-700">Secondary: Mid-Atlantic expansion</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span className="text-gray-700">Focus: Multifamily & Mixed-Use</span>
                      </div>
                    </div>
                  </Card>
                </div>
              </TabsContent>

              {/* Financials Tab */}
              <TabsContent value="financials" className="space-y-6">
                {/* Revenue Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <span className="text-green-600 mr-2">📈</span>
                      Revenue Metrics
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Gross Monthly Revenue</span>
                        <span className="font-bold text-green-600">$28.7K/mo</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Net Operating Income</span>
                        <span className="font-bold text-blue-600">$23.9K/mo</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">NOI Margin</span>
                        <span className="font-bold text-purple-600">83%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Annual NOI</span>
                        <span className="font-bold text-green-600">$287K</span>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <span className="text-blue-600 mr-2">💰</span>
                      Capital Structure
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Debt</span>
                        <span className="font-bold text-red-600">$2.1M</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Equity</span>
                        <span className="font-bold text-green-600">$1.57M</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">LTV Ratio</span>
                        <span className="font-bold text-orange-600">57%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total AUM</span>
                        <span className="font-bold text-blue-600">{selectedMilestone.metrics.aum}</span>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <span className="text-purple-600 mr-2">📊</span>
                      Performance Metrics
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Target IRR</span>
                        <span className="font-bold text-purple-600">18.5%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cash-on-Cash Return</span>
                        <span className="font-bold text-blue-600">18%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Portfolio Cap Rate</span>
                        <span className="font-bold text-green-600">6.8%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">DSCR Average</span>
                        <span className="font-bold text-blue-600">1.35x</span>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Growth Projections & Investment Strategy */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <span className="text-green-600 mr-2">📈</span>
                      Growth Projections
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-600">Revenue Growth (Annual)</span>
                          <span className="font-bold">18%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full" style={{ width: '18%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-600">Portfolio Expansion</span>
                          <span className="font-bold">22%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full" style={{ width: '22%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-600">Market Penetration</span>
                          <span className="font-bold">45%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full" style={{ width: '45%' }}></div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <span className="text-blue-600 mr-2">💼</span>
                      Investment Strategy
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Value-Add</span>
                        <span className="font-bold text-blue-600">65%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Core+</span>
                        <span className="font-bold text-green-600">35%</span>
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">Geographic concentration in CT/New England</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">Focus on multifamily and mixed-use properties</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">Target 14-22% IRR across all investments</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">Hold period: 3-7 years average</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </TabsContent>

              {/* Team Tab */}
              <TabsContent value="team" className="space-y-4">
                <div className="grid gap-4">
                  {selectedMilestone.team.map((member, idx) => (
                    <Card key={idx}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{member.name}</h3>
                            <p className="text-sm text-gray-600">{member.role}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Joined: {member.joinDate}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}