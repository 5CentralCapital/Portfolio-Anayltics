import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  DollarSign, 
  TrendingUp, 
  Calculator, 
  AlertTriangle,
  Target,
  Percent
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPIPanelProps {
  kpis: any;
  deal: any;
}

export function DealKPIPanel({ kpis, deal }: KPIPanelProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const formatPercent = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    }).format(value || 0);
  };

  return (
    <div className="space-y-4">
      {/* Key Metrics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <Calculator className="h-5 w-5 mr-2" />
            Key Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">ARV</label>
              <p className="text-lg font-semibold">{formatCurrency(kpis.arv)}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">All-In Cost</label>
              <p className="text-lg font-semibold">{formatCurrency(kpis.allInCost)}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Cash Flow</label>
              <p className={cn(
                "text-lg font-semibold",
                (kpis.cashFlow || 0) > 0 ? "text-green-600" : "text-red-600"
              )}>
                {formatCurrency(kpis.cashFlow)}
              </p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Cash-on-Cash</label>
              <p className={cn(
                "text-lg font-semibold",
                (kpis.cashOnCashReturn || 0) > 0.12 ? "text-green-600" : 
                (kpis.cashOnCashReturn || 0) > 0.08 ? "text-yellow-600" : "text-red-600"
              )}>
                {formatPercent(kpis.cashOnCashReturn)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Returns */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <TrendingUp className="h-5 w-5 mr-2" />
            Returns
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">IRR</span>
              <span className={cn(
                "font-semibold",
                (kpis.irr || 0) > 0.15 ? "text-green-600" : 
                (kpis.irr || 0) > 0.10 ? "text-yellow-600" : "text-red-600"
              )}>
                {formatPercent(kpis.irr)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Equity Multiple</span>
              <span className="font-semibold">{(kpis.equityMultiple || 0).toFixed(2)}x</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Cap Rate</span>
              <span className="font-semibold">{formatPercent(kpis.capRate)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Metrics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <Target className="h-5 w-5 mr-2" />
            Risk Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">DSCR</span>
              <div className="flex items-center space-x-2">
                <span className={cn(
                  "font-semibold",
                  (kpis.dscr || 0) >= 1.25 ? "text-green-600" : 
                  (kpis.dscr || 0) >= 1.15 ? "text-yellow-600" : "text-red-600"
                )}>
                  {(kpis.dscr || 0).toFixed(2)}x
                </span>
                {(kpis.dscr || 0) < 1.15 && (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Break-even Occ.</span>
              <div className="flex items-center space-x-2">
                <span className={cn(
                  "font-semibold",
                  (kpis.breakEvenOccupancy || 0) <= 0.80 ? "text-green-600" : 
                  (kpis.breakEvenOccupancy || 0) <= 0.90 ? "text-yellow-600" : "text-red-600"
                )}>
                  {formatPercent(kpis.breakEvenOccupancy)}
                </span>
                {(kpis.breakEvenOccupancy || 0) > 0.90 && (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">LTC</span>
              <span className="font-semibold">{formatPercent(kpis.ltc)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">LTV</span>
              <span className="font-semibold">{formatPercent(kpis.ltv)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Refinance Scenario */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <DollarSign className="h-5 w-5 mr-2" />
            Refinance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">New Loan</span>
              <span className="font-semibold">{formatCurrency(kpis.newLoanAmount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Cash Out</span>
              <span className={cn(
                "font-semibold",
                (kpis.cashOut || 0) > 0 ? "text-green-600" : "text-gray-600"
              )}>
                {formatCurrency(kpis.cashOut)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Profit</span>
              <span className={cn(
                "text-lg font-bold",
                (kpis.totalProfit || 0) > 0 ? "text-green-600" : "text-red-600"
              )}>
                {formatCurrency(kpis.totalProfit)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Income & Expenses */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <Percent className="h-5 w-5 mr-2" />
            Income & Expenses
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Gross Rental Income</span>
              <span className="font-semibold">{formatCurrency(kpis.grossRentalIncome)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Effective Gross Income</span>
              <span className="font-semibold">{formatCurrency(kpis.effectiveGrossIncome)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Operating Expenses</span>
              <span className="font-semibold">{formatCurrency(kpis.totalOperatingExpenses)}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">NOI</span>
              <span className="text-lg font-bold text-green-600">
                {formatCurrency(kpis.netOperatingIncome)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Debt Service</span>
              <span className="font-semibold">{formatCurrency(kpis.annualDebtService)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deal Costs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Deal Costs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Purchase Price</span>
            <span>{formatCurrency(Number(deal.purchasePrice))}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Total Rehab</span>
            <span>{formatCurrency(kpis.totalRehab)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Closing Costs</span>
            <span>{formatCurrency(kpis.totalClosingCosts)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Holding Costs</span>
            <span>{formatCurrency(kpis.totalHoldingCosts)}</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="font-medium">All-In Cost</span>
            <span className="font-bold">{formatCurrency(kpis.allInCost)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}