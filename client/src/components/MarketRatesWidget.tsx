import React, { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw, AlertCircle, DollarSign } from 'lucide-react';

interface MarketRates {
  mortgageRate30Year: number;
  mortgageRate15Year: number;
  treasuryRate10Year: number;
  federalFundsRate: number;
  primeRate: number;
  lastUpdated: string;
}

interface RecommendedRates {
  acquisitionRate: number;
  refinanceRate: number;
  bridgeRate: number;
  constructionRate: number;
  lastUpdated: string;
}

export function MarketRatesWidget() {
  const [marketRates, setMarketRates] = useState<MarketRates | null>(null);
  const [recommendedRates, setRecommendedRates] = useState<RecommendedRates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = async () => {
    try {
      setLoading(true);
      setError(null);

      const [marketResponse, recommendedResponse] = await Promise.all([
        fetch('/api/market-rates'),
        fetch('/api/recommended-lending-rates')
      ]);

      if (!marketResponse.ok || !recommendedResponse.ok) {
        throw new Error('Failed to fetch rates');
      }

      const marketData = await marketResponse.json();
      const recommendedData = await recommendedResponse.json();

      setMarketRates(marketData);
      setRecommendedRates(recommendedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const formatRate = (rate: number) => `${rate.toFixed(2)}%`;
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading market rates...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-32 text-red-600">
          <AlertCircle className="h-6 w-6 mr-2" />
          <span>{error}</span>
          <button
            onClick={fetchRates}
            className="ml-4 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Current Market Rates
          </h3>
        </div>
        <button
          onClick={fetchRates}
          disabled={loading}
          className="flex items-center px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Market Rates */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">Market Benchmarks</h4>
          
          {marketRates && (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">30-Year Mortgage</span>
                <span className="font-semibold text-blue-600">
                  {formatRate(marketRates.mortgageRate30Year)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">15-Year Mortgage</span>
                <span className="font-semibold text-blue-600">
                  {formatRate(marketRates.mortgageRate15Year)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">10-Year Treasury</span>
                <span className="font-semibold text-green-600">
                  {formatRate(marketRates.treasuryRate10Year)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Fed Funds Rate</span>
                <span className="font-semibold text-purple-600">
                  {formatRate(marketRates.federalFundsRate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Prime Rate</span>
                <span className="font-semibold text-orange-600">
                  {formatRate(marketRates.primeRate)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Recommended Investment Rates */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
            <DollarSign className="h-4 w-4 mr-1 text-green-600" />
            Investment Property Rates
          </h4>
          
          {recommendedRates && (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Acquisition Financing</span>
                <span className="font-semibold text-blue-600">
                  {formatRate(recommendedRates.acquisitionRate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Refinance Rate</span>
                <span className="font-semibold text-green-600">
                  {formatRate(recommendedRates.refinanceRate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Bridge Loan</span>
                <span className="font-semibold text-orange-600">
                  {formatRate(recommendedRates.bridgeRate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Construction Loan</span>
                <span className="font-semibold text-red-600">
                  {formatRate(recommendedRates.constructionRate)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {marketRates && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Last updated: {formatDate(marketRates.lastUpdated)}
          </p>
        </div>
      )}
    </div>
  );
}