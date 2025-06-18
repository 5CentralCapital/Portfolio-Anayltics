import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Building, 
  Calculator, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Plus,
  Pencil,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DealKPIPanel } from '@/components/DealKPIPanel';
import { DealOverview } from '@/components/DealOverview';
import { RehabSection } from '@/components/RehabSection';
import { UnitsSection } from '@/components/UnitsSection';
import { ExpensesSection } from '@/components/ExpensesSection';
import { LoansSection } from '@/components/LoansSection';
import { useWebSocket } from '@/hooks/useWebSocket';
import { apiRequest } from '@/lib/queryClient';

interface DealData {
  deal: any;
  kpis: any;
  rehabItems: any[];
  units: any[];
  expenses: any[];
  closingCosts: any[];
  holdingCosts: any[];
  loans: any[];
  otherIncome: any[];
  comps: any[];
}

export function DealAnalysis() {
  const { id: dealId } = useParams();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('overview');

  // Fetch deal data
  const { data: dealData, isLoading, error } = useQuery<DealData>({
    queryKey: ['/api/deals', dealId],
    enabled: !!dealId,
  });

  // WebSocket connection for real-time KPI updates
  const { lastMessage, sendMessage } = useWebSocket('/ws');

  useEffect(() => {
    if (dealId && sendMessage) {
      sendMessage(JSON.stringify({
        type: 'subscribe_deal',
        dealId: parseInt(dealId)
      }));
    }
  }, [dealId, sendMessage]);

  // Handle real-time KPI updates
  useEffect(() => {
    if (lastMessage?.data) {
      try {
        const message = JSON.parse(lastMessage.data);
        if (message.type === 'kpi_update' && message.dealId === parseInt(dealId!)) {
          // Update the cached data with new KPIs
          queryClient.setQueryData(['/api/deals', dealId], (oldData: DealData | undefined) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              kpis: message.kpis
            };
          });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    }
  }, [lastMessage, dealId, queryClient]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !dealData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to load deal</h3>
          <p className="text-muted-foreground">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  const { deal, kpis } = dealData;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{deal.name}</h1>
          <p className="text-lg text-muted-foreground">
            {deal.address}, {deal.city}, {deal.state}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={
            deal.status === 'active' ? 'default' :
            deal.status === 'underwriting' ? 'secondary' :
            deal.status === 'closed' ? 'outline' : 'destructive'
          }>
            {deal.status}
          </Badge>
          <Button variant="outline" size="sm">
            <Pencil className="h-4 w-4 mr-2" />
            Edit Deal
          </Button>
        </div>
      </div>

      {/* KPI Alerts */}
      {(kpis.dscrWarning || kpis.occupancyRisk || kpis.isSpeculative) && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <h3 className="font-semibold text-destructive">Risk Alerts</h3>
            </div>
            <div className="space-y-1">
              {kpis.dscrWarning && (
                <p className="text-sm">⚠️ DSCR below 1.15 ({(kpis.dscr || 0).toFixed(2)}x) - High risk</p>
              )}
              {kpis.occupancyRisk && (
                <p className="text-sm">⚠️ Break-even occupancy above 90% ({(kpis.breakEvenOccupancy * 100).toFixed(1)}%)</p>
              )}
              {kpis.isSpeculative && (
                <p className="text-sm">⚠️ Exit cap rate lower than entry - Speculative investment</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* Main Content */}
        <div className="col-span-8">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="rehab">Rehab</TabsTrigger>
              <TabsTrigger value="units">Units</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
              <TabsTrigger value="debt">Debt</TabsTrigger>
              <TabsTrigger value="exit">Exit</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <DealOverview deal={deal} kpis={kpis} />
            </TabsContent>

            <TabsContent value="rehab" className="space-y-6">
              <RehabSection 
                dealId={parseInt(dealId!)} 
                rehabItems={dealData.rehabItems} 
                totalBudget={kpis.totalRehab}
              />
            </TabsContent>

            <TabsContent value="units" className="space-y-6">
              <UnitsSection 
                dealId={parseInt(dealId!)} 
                units={dealData.units}
                grossRentalIncome={kpis.grossRentalIncome}
              />
            </TabsContent>

            <TabsContent value="expenses" className="space-y-6">
              <ExpensesSection 
                dealId={parseInt(dealId!)} 
                expenses={dealData.expenses}
                closingCosts={dealData.closingCosts}
                holdingCosts={dealData.holdingCosts}
                otherIncome={dealData.otherIncome}
              />
            </TabsContent>

            <TabsContent value="debt" className="space-y-6">
              <LoansSection 
                dealId={parseInt(dealId!)} 
                loans={dealData.loans}
                kpis={kpis}
              />
            </TabsContent>

            <TabsContent value="exit" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Exit Strategy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Projected Hold Period</label>
                      <p className="text-2xl font-bold">
                        {Math.round((deal.projectedRefiMonth || 24) / 12)} years
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Exit Cap Rate</label>
                      <p className="text-2xl font-bold">
                        {((deal.exitCapRate || deal.marketCapRate) * 100).toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Projected ARV</label>
                      <p className="text-2xl font-bold">
                        ${(kpis.arv || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Total Profit</label>
                      <p className={cn(
                        "text-2xl font-bold",
                        (kpis.totalProfit || 0) > 0 ? "text-green-600" : "text-red-600"
                      )}>
                        ${(kpis.totalProfit || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* KPI Panel - Sticky */}
        <div className="col-span-4">
          <div className="sticky top-6">
            <DealKPIPanel kpis={kpis} deal={deal} />
          </div>
        </div>
      </div>
    </div>
  );
}