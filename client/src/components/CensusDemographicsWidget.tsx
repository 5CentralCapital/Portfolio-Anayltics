import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, DollarSign, Home, GraduationCap, Briefcase, MapPin, Target, AlertCircle } from 'lucide-react';

interface DemographicData {
  population: number;
  medianHouseholdIncome: number;
  medianAge: number;
  unemploymentRate: number;
  medianHomeValue: number;
  medianRent: number;
  povertyRate: number;
  collegeEducationRate: number;
  homeownershipRate: number;
  location: string;
  lastUpdated: string;
}

interface InvestmentAnalysis {
  investmentGrade: 'A' | 'B' | 'C' | 'D';
  score: number;
  factors: Array<{
    factor: string;
    score: number;
    weight: number;
    description: string;
  }>;
  recommendations: string[];
}

interface CensusDemographicsWidgetProps {
  address?: string;
  city?: string;
  state?: string;
}

const CensusDemographicsWidget: React.FC<CensusDemographicsWidgetProps> = ({ 
  address, 
  city, 
  state 
}) => {
  const [demographicData, setDemographicData] = useState<DemographicData | null>(null);
  const [investmentAnalysis, setInvestmentAnalysis] = useState<InvestmentAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'demographics' | 'analysis'>('demographics');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-600 bg-green-50 border-green-200';
      case 'B': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'C': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'D': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const fetchDemographicData = async () => {
    if (!state) {
      setError('State is required for demographic analysis');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Parse state from address if not provided directly
      let targetState = state;
      if (!targetState && address) {
        const addressParts = address.split(',');
        const stateZip = addressParts[addressParts.length - 1]?.trim();
        targetState = stateZip?.split(' ')[0] || '';
      }

      if (!targetState) {
        throw new Error('Unable to determine state for analysis');
      }

      console.log(`Fetching demographic data for: ${city || 'Unknown City'}, ${targetState}`);

      // Fetch demographic data
      const response = await fetch(`/api/census/demographics?state=${encodeURIComponent(targetState)}${city ? `&city=${encodeURIComponent(city)}` : ''}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch demographic data: ${response.statusText}`);
      }

      const data = await response.json();
      setDemographicData(data);

      // Fetch investment analysis
      const analysisResponse = await fetch(`/api/census/investment-analysis?state=${encodeURIComponent(targetState)}${city ? `&city=${encodeURIComponent(city)}` : ''}`);
      
      if (analysisResponse.ok) {
        const analysisData = await analysisResponse.json();
        setInvestmentAnalysis(analysisData);
      }

    } catch (err) {
      console.error('Error fetching demographic data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load demographic data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (state || (address && address.includes(','))) {
      fetchDemographicData();
    }
  }, [state, city, address]);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading demographic data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-center py-8 text-red-600">
          <AlertCircle className="h-6 w-6 mr-2" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!demographicData) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-center py-8 text-gray-500">
          <MapPin className="h-6 w-6 mr-2" />
          <span>Enter a property address to view demographic analysis</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Users className="h-5 w-5 mr-2 text-blue-600" />
          Market Demographics & Analysis
        </h3>
        <div className="text-sm text-gray-500">
          {demographicData.location}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('demographics')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'demographics'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Demographics
        </button>
        <button
          onClick={() => setActiveTab('analysis')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'analysis'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Investment Analysis
        </button>
      </div>

      {activeTab === 'demographics' && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Population */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-900">
                  {formatNumber(demographicData.population)}
                </div>
                <div className="text-sm text-blue-600">Population</div>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          {/* Median Income */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-900">
                  {formatCurrency(demographicData.medianHouseholdIncome)}
                </div>
                <div className="text-sm text-green-600">Median Income</div>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>

          {/* Median Home Value */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-900">
                  {formatCurrency(demographicData.medianHomeValue)}
                </div>
                <div className="text-sm text-purple-600">Median Home Value</div>
              </div>
              <Home className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          {/* Median Rent */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-orange-900">
                  {formatCurrency(demographicData.medianRent)}
                </div>
                <div className="text-sm text-orange-600">Median Rent</div>
              </div>
              <Home className="h-8 w-8 text-orange-600" />
            </div>
          </div>

          {/* Unemployment Rate */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-indigo-900">
                  {demographicData.unemploymentRate.toFixed(1)}%
                </div>
                <div className="text-sm text-indigo-600">Unemployment</div>
              </div>
              <Briefcase className="h-8 w-8 text-indigo-600" />
            </div>
          </div>

          {/* College Education */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-emerald-900">
                  {demographicData.collegeEducationRate.toFixed(1)}%
                </div>
                <div className="text-sm text-emerald-600">College Educated</div>
              </div>
              <GraduationCap className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analysis' && investmentAnalysis && (
        <div className="space-y-6">
          {/* Investment Grade */}
          <div className="text-center">
            <div className={`inline-flex items-center px-6 py-3 rounded-lg border-2 ${getGradeColor(investmentAnalysis.investmentGrade)}`}>
              <Target className="h-6 w-6 mr-2" />
              <div>
                <div className="text-2xl font-bold">Grade {investmentAnalysis.investmentGrade}</div>
                <div className="text-sm">Investment Score: {investmentAnalysis.score}/100</div>
              </div>
            </div>
          </div>

          {/* Investment Factors */}
          <div className="space-y-3">
            <h4 className="text-lg font-semibold text-gray-900">Investment Factors</h4>
            {investmentAnalysis.factors.map((factor, index) => (
              <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-gray-900">{factor.factor}</div>
                  <div className="text-sm font-semibold text-gray-700">
                    {Math.round(factor.score * 100)}/100
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${factor.score * 100}%` }}
                  ></div>
                </div>
                <div className="text-sm text-gray-600">{factor.description}</div>
              </div>
            ))}
          </div>

          {/* Recommendations */}
          <div className="space-y-3">
            <h4 className="text-lg font-semibold text-gray-900">Investment Recommendations</h4>
            <div className="space-y-2">
              {investmentAnalysis.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">{recommendation}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analysis' && !investmentAnalysis && (
        <div className="text-center py-8 text-gray-500">
          <Target className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <div>Investment analysis not available</div>
          <div className="text-sm">Demographic data is insufficient for analysis</div>
        </div>
      )}
    </div>
  );
};

export default CensusDemographicsWidget;