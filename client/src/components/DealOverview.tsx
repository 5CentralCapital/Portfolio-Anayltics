import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building, MapPin, Calendar, Users } from 'lucide-react';

interface DealOverviewProps {
  deal: any;
  kpis: any;
}

export function DealOverview({ deal, kpis }: DealOverviewProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  return (
    <div className="space-y-6">
      {/* Property Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="h-5 w-5 mr-2" />
            Property Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Address</label>
              <p className="font-semibold">{deal.address}</p>
              <p className="text-sm text-muted-foreground">{deal.city}, {deal.state} {deal.zipCode}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Units</label>
              <p className="text-2xl font-bold">{deal.units}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Purchase Price</label>
              <p className="text-2xl font-bold">{formatCurrency(Number(deal.purchasePrice))}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Price Per Unit</label>
              <p className="text-2xl font-bold">
                {formatCurrency(Number(deal.purchasePrice) / deal.units)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investment Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Investment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Market Cap Rate</label>
              <p className="text-xl font-bold">
                {(Number(deal.marketCapRate) * 100).toFixed(2)}%
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Exit Cap Rate</label>
              <p className="text-xl font-bold">
                {((Number(deal.exitCapRate) || Number(deal.marketCapRate)) * 100).toFixed(2)}%
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Hold Period</label>
              <p className="text-xl font-bold">
                {Math.round((deal.projectedRefiMonth || 24) / 12)} years
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Stabilization</label>
              <p className="text-xl font-bold">
                {deal.startToStabilizationMonths || 12} months
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operating Assumptions */}
      <Card>
        <CardHeader>
          <CardTitle>Operating Assumptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Vacancy Rate</label>
              <p className="text-xl font-bold">
                {(Number(deal.vacancyRate) * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Bad Debt Rate</label>
              <p className="text-xl font-bold">
                {(Number(deal.badDebtRate) * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Rent Growth</label>
              <p className="text-xl font-bold">
                {(Number(deal.annualRentGrowth) * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Expense Inflation</label>
              <p className="text-xl font-bold">
                {(Number(deal.annualExpenseInflation) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reserves */}
      <Card>
        <CardHeader>
          <CardTitle>Reserves</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">CapEx Reserve</label>
              <p className="text-xl font-bold">
                {formatCurrency(Number(deal.capexReservePerUnit))} / unit / year
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Operating Reserve</label>
              <p className="text-xl font-bold">
                {deal.operatingReserveMonths || 6} months
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Team
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Property Manager</label>
              <p className="font-semibold">{deal.assignedPM || 'Not assigned'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">General Contractor</label>
              <p className="font-semibold">{deal.assignedGC || 'Not assigned'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Underwriting Owner</label>
              <p className="font-semibold">{deal.underwritingOwner || 'Not assigned'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}