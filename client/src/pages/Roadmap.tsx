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
    if (!activeProperties || !portfolioAnalytics) {
      return { aum: "$3.67M", properties: 3, cashFlow: "$23.9K/mo", irr: "18.5%" };
    }
    
    const totalAUM = (portfolioAnalytics as any).totalAUM || 3670000;
    const propertyCount = activeProperties.length;
    const monthlyCashFlow = (portfolioAnalytics as any).netCashFlow || 23950;
    const irr = (portfolioAnalytics as any).portfolioROI || 18.5;
    
    return {
      aum: `$${(totalAUM / 1000000).toFixed(2)}M`,
      properties: propertyCount,
      cashFlow: `$${(monthlyCashFlow / 1000).toFixed(1)}K/mo`,
      irr: `${irr.toFixed(1)}%`
    };
  };

  // Transform real properties for milestone display
  const transformRealProperties = (properties: Property[]) => {
    if (!properties) return [];
    
    return properties.map(prop => ({
      name: prop.address,
      location: `${prop.city}, ${prop.state}`,
      type: `${prop.apartments} Units`,
      value: prop.acquisitionPrice ? `$${(parseFloat(prop.acquisitionPrice) / 1000000).toFixed(2)}M` : "$0",
      status: prop.status || 'active'
    }));
  };

  const realKPIs = calculateRealKPIs();
  const realProperties = transformRealProperties(activeProperties || []);

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

  if (propertiesLoading || analyticsLoading) {
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

              {/* Dashboard Tab - KPI Cards */}
              <TabsContent value="dashboard" className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Total AUM</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-600">{selectedMilestone.metrics.aum}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Properties</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">{selectedMilestone.metrics.properties}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Monthly Cash Flow</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-purple-600">{selectedMilestone.metrics.cashFlow}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Portfolio IRR</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-orange-600">{selectedMilestone.metrics.irr}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Key Milestones */}
                <Card>
                  <CardHeader>
                    <CardTitle>Key Milestones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedMilestone.keyMilestones.map((milestone, idx) => (
                        <div key={idx} className="flex items-center space-x-3">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span className="text-gray-700">{milestone}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Properties Tab - Clickable property list */}
              <TabsContent value="properties" className="space-y-4">
                <div className="grid gap-4">
                  {selectedMilestone.properties.map((property, idx) => (
                    <Card 
                      key={idx} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => {
                        // Open property modal for current year properties
                        if (selectedMilestone.year === 2025 && activeProperties) {
                          const realProperty = activeProperties.find(p => p.address === property.name);
                          if (realProperty) setSelectedProperty(realProperty);
                        }
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{property.name}</h3>
                            <p className="text-sm text-gray-600">{property.location}</p>
                            <p className="text-sm text-gray-500">{property.type}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-blue-600">{property.value}</p>
                            <Badge className={property.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {property.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Financials Tab */}
              <TabsContent value="financials" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Monthly Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">{selectedMilestone.financials.revenue}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Net Operating Income</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{selectedMilestone.financials.noi}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Total Debt</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">{selectedMilestone.financials.debt}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Total Equity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-600">{selectedMilestone.financials.equity}</div>
                    </CardContent>
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