import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
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

export default function DealAnalysis() {
  const { id: dealId } = useParams();
  const [selectedTab, setSelectedTab] = useState('overview');

  // Fetch deal data
  const { data: dealData, isLoading, error } = useQuery<DealData>({
    queryKey: ['/api/deals', dealId],
    enabled: !!dealId,
  });

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

  if (isLoading) {
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
          <p className="text-gray-600">Please try refreshing the page</p>
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
          <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50">
            <Pencil className="h-4 w-4 mr-2 inline" />
            Edit Deal
          </button>
        </div>
      </div>

      {/* KPI Alerts */}
      {(kpis.dscrWarning || kpis.occupancyRisk || kpis.isSpeculative) && (
        <div className="border border-red-300 bg-red-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-red-800">Risk Alerts</h3>
          </div>
          <div className="space-y-1">
            {kpis.dscrWarning && (
              <p className="text-sm text-red-700">⚠️ DSCR below 1.15 ({(kpis.dscr || 0).toFixed(2)}x) - High risk</p>
            )}
            {kpis.occupancyRisk && (
              <p className="text-sm text-red-700">⚠️ Break-even occupancy above 90% ({(kpis.breakEvenOccupancy * 100).toFixed(1)}%)</p>
            )}
            {kpis.isSpeculative && (
              <p className="text-sm text-red-700">⚠️ Exit cap rate lower than entry - Speculative investment</p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* Main Content */}
        <div className="col-span-8">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {['overview', 'rehab', 'units', 'expenses', 'debt', 'exit'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                    selectedTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {selectedTab === 'overview' && (
            <div className="space-y-6">
              {/* Property Details */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
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
              <div className="bg-white border border-gray-200 rounded-lg p-6">
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
                    <label className="text-sm font-medium text-gray-600">Stabilization</label>
                    <p className="text-xl font-bold">
                      {deal.startToStabilizationMonths || 12} months
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'rehab' && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Rehab Budget</h2>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total Budget</p>
                  <p className="text-2xl font-bold">{formatCurrency(kpis.totalRehab)}</p>
                </div>
              </div>
              <div className="space-y-4">
                {dealData.rehabItems.map((item: any, index: number) => (
                  <div key={item.id || index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{item.category}</p>
                          <p className="text-sm text-gray-600">{item.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(Number(item.totalCost))}</p>
                          <p className="text-xs text-gray-500 capitalize">{item.bidStatus}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedTab !== 'overview' && selectedTab !== 'rehab' && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 capitalize">{selectedTab} Section</h2>
              <p className="text-gray-600">Content for {selectedTab} coming soon...</p>
            </div>
          )}
        </div>

        {/* KPI Panel - Sticky */}
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
                Returns
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">IRR</span>
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
              <h3 className="text-lg font-semibold mb-4">Risk Metrics</h3>
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
                    {(kpis.dscr || 0) < 1.15 && (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
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

            {/* Refinance */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Refinance
              </h3>
              <div className="space-y-3">
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