import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Calculator, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle
} from 'lucide-react';

export default function DealDemo() {
  const [dealData, setDealData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeal = async () => {
      try {
        const response = await fetch('/api/deals/1');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setDealData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load deal');
      } finally {
        setLoading(false);
      }
    };

    fetchDeal();
  }, []);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !dealData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to load deal</h3>
          <p className="text-gray-600">{error || 'Please try refreshing the page'}</p>
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
          <p className="text-lg text-gray-600">
            {deal.address}, {deal.city}, {deal.state}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            deal.status === 'active' ? 'bg-green-100 text-green-800' :
            deal.status === 'underwriting' ? 'bg-blue-100 text-blue-800' :
            deal.status === 'closed' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'
          }`}>
            {deal.status}
          </span>
        </div>
      </div>

      {/* Success Banner */}
      <div className="border border-green-300 bg-green-50 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <h3 className="font-semibold text-green-800">Deal Analysis System Active</h3>
        </div>
        <p className="text-sm text-green-700 mt-1">
          Real-time KPI calculations with comprehensive financial modeling
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Main Content */}
        <div className="col-span-8">
          {/* Property Details */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Property Details
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-600">Address</label>
                <p className="font-semibold">{deal.address}</p>
                <p className="text-sm text-gray-600">{deal.city}, {deal.state} {deal.zipCode}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Units</label>
                <p className="text-2xl font-bold">{deal.units}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Purchase Price</label>
                <p className="text-2xl font-bold">{formatCurrency(Number(deal.purchasePrice))}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Price Per Unit</label>
                <p className="text-2xl font-bold">
                  {formatCurrency(Number(deal.purchasePrice) / deal.units)}
                </p>
              </div>
            </div>
          </div>

          {/* Investment Summary */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Investment Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-600">Market Cap Rate</label>
                <p className="text-xl font-bold">
                  {(Number(deal.marketCapRate) * 100).toFixed(2)}%
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Exit Cap Rate</label>
                <p className="text-xl font-bold">
                  {((Number(deal.exitCapRate) || Number(deal.marketCapRate)) * 100).toFixed(2)}%
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Hold Period</label>
                <p className="text-xl font-bold">
                  {Math.round((deal.projectedRefiMonth || 24) / 12)} years
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">All-In Cost</label>
                <p className="text-xl font-bold">
                  {formatCurrency(kpis.allInCost)}
                </p>
              </div>
            </div>
          </div>

          {/* Rehab Budget */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Rehab Budget Breakdown</h2>
            <div className="space-y-3">
              {dealData.rehabItems.map((item: any, index: number) => (
                <div key={item.id || index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{item.category}</p>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(Number(item.totalCost))}</p>
                    <p className="text-xs text-gray-500 capitalize">{item.bidStatus}</p>
                  </div>
                </div>
              ))}
              <div className="border-t pt-3 flex justify-between items-center font-bold">
                <span>Total Rehab Budget</span>
                <span>{formatCurrency(kpis.totalRehab)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Panel */}
        <div className="col-span-4">
          <div className="sticky top-6 space-y-4">
            {/* Key Metrics */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Calculator className="h-5 w-5 mr-2" />
                Key Metrics
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">ARV</label>
                    <p className="text-lg font-semibold">{formatCurrency(kpis.arv)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">All-In Cost</label>
                    <p className="text-lg font-semibold">{formatCurrency(kpis.allInCost)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Cash Flow</label>
                    <p className={`text-lg font-semibold ${
                      (kpis.cashFlow || 0) > 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      {formatCurrency(kpis.cashFlow)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Cash-on-Cash</label>
                    <p className={`text-lg font-semibold ${
                      (kpis.cashOnCashReturn || 0) > 0.12 ? "text-green-600" : 
                      (kpis.cashOnCashReturn || 0) > 0.08 ? "text-yellow-600" : "text-red-600"
                    }`}>
                      {formatPercent(kpis.cashOnCashReturn)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Returns */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Returns Analysis
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">IRR (5-year)</span>
                  <span className={`font-semibold ${
                    (kpis.irr || 0) > 0.15 ? "text-green-600" : 
                    (kpis.irr || 0) > 0.10 ? "text-yellow-600" : "text-red-600"
                  }`}>
                    {formatPercent(kpis.irr)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Equity Multiple</span>
                  <span className="font-semibold">{(kpis.equityMultiple || 0).toFixed(2)}x</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Cap Rate</span>
                  <span className="font-semibold">{formatPercent(kpis.capRate)}</span>
                </div>
              </div>
            </div>

            {/* Risk Metrics */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Risk Assessment</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">DSCR</span>
                  <div className="flex items-center space-x-2">
                    <span className={`font-semibold ${
                      (kpis.dscr || 0) >= 1.25 ? "text-green-600" : 
                      (kpis.dscr || 0) >= 1.15 ? "text-yellow-600" : "text-red-600"
                    }`}>
                      {(kpis.dscr || 0).toFixed(2)}x
                    </span>
                    {(kpis.dscr || 0) >= 1.25 ? (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Low Risk</span>
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Break-even Occ.</span>
                  <span className={`font-semibold ${
                    (kpis.breakEvenOccupancy || 0) <= 0.80 ? "text-green-600" : 
                    (kpis.breakEvenOccupancy || 0) <= 0.90 ? "text-yellow-600" : "text-red-600"
                  }`}>
                    {formatPercent(kpis.breakEvenOccupancy)}
                  </span>
                </div>
              </div>
            </div>

            {/* Refinance Projection */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Refinance Projection
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">New Loan Amount</span>
                  <span className="font-semibold">
                    {formatCurrency(kpis.newLoanAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Cash Out</span>
                  <span className={`font-semibold ${
                    (kpis.cashOut || 0) > 0 ? "text-green-600" : "text-gray-600"
                  }`}>
                    {formatCurrency(kpis.cashOut)}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t pt-3">
                  <span className="text-sm font-medium">Total Profit</span>
                  <span className={`text-lg font-bold ${
                    (kpis.totalProfit || 0) > 0 ? "text-green-600" : "text-red-600"
                  }`}>
                    {formatCurrency(kpis.totalProfit)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}