import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, DollarSign, Info, Target } from 'lucide-react';

const InvestmentCalculator: React.FC = () => {
  const [investmentAmount, setInvestmentAmount] = useState<string>('100000');
  const [investmentDuration, setInvestmentDuration] = useState<string>('5');
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  // Updated to 30% annual return
  const averageAnnualizedReturn = 30;

  // Calculate returns
  const calculateReturns = () => {
    const principal = parseFloat(investmentAmount) || 0;
    const years = parseFloat(investmentDuration) || 0;
    const annualRate = averageAnnualizedReturn / 100;

    if (principal <= 0 || years <= 0) {
      return {
        finalValue: 0,
        totalReturns: 0,
        annualizedGain: 0,
        multiplier: 0
      };
    }

    // Compound growth calculation: A = P(1 + r)^t
    const finalValue = principal * Math.pow(1 + annualRate, years);
    const totalReturns = finalValue - principal;
    const annualizedGain = totalReturns / years;
    const multiplier = finalValue / principal;

    return {
      finalValue,
      totalReturns,
      annualizedGain,
      multiplier
    };
  };

  const results = calculateReturns();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number, decimals: number = 1) => {
    return num.toFixed(decimals);
  };

  const handleInvestmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setInvestmentAmount(value);
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setInvestmentDuration(value);
  };

  const Tooltip: React.FC<{ content: string; children: React.ReactNode; id: string }> = ({ content, children, id }) => (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShowTooltip(id)}
        onMouseLeave={() => setShowTooltip(null)}
        className="cursor-help"
      >
        {children}
      </div>
      {showTooltip === id && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap z-10 shadow-lg">
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center justify-center">
          <Calculator className="h-6 w-6 mr-2 text-primary" />
          Investment Return Calculator
        </h3>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Calculate potential returns based on our target {averageAnnualizedReturn}% annual return strategy. 
          This calculator demonstrates the power of compound growth in real estate investments.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <div>
            <label htmlFor="investment-amount" className="block text-sm font-medium text-gray-700 mb-2">
              Initial Investment Amount
              <Tooltip content="Enter your initial investment amount in USD" id="investment-tooltip">
                <Info className="h-4 w-4 ml-1 inline text-gray-400" />
              </Tooltip>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">$</span>
              <input
                type="text"
                id="investment-amount"
                value={investmentAmount ? parseInt(investmentAmount).toLocaleString() : ''}
                onChange={handleInvestmentChange}
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors text-lg font-semibold"
                placeholder="100,000"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {[50000, 100000, 250000, 500000].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setInvestmentAmount(amount.toString())}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-primary hover:text-white rounded-lg transition-colors"
                >
                  ${(amount / 1000)}K
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="investment-duration" className="block text-sm font-medium text-gray-700 mb-2">
              Investment Duration (Years)
              <Tooltip content="Typical hold period for our investments is 3-7 years" id="duration-tooltip">
                <Info className="h-4 w-4 ml-1 inline text-gray-400" />
              </Tooltip>
            </label>
            <input
              type="text"
              id="investment-duration"
              value={investmentDuration}
              onChange={handleDurationChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors text-lg font-semibold"
              placeholder="5"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {[2, 3, 5, 7, 10].map((years) => (
                <button
                  key={years}
                  onClick={() => setInvestmentDuration(years.toString())}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-primary hover:text-white rounded-lg transition-colors"
                >
                  {years} {years === 1 ? 'year' : 'years'}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
              <Target className="h-4 w-4 mr-1" />
              Calculation Methodology
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Based on {averageAnnualizedReturn}% target annual return strategy</li>
              <li>• Uses compound growth formula: A = P(1 + r)^t</li>
              <li>• Assumes consistent annual performance compounding</li>
              <li>• Conservative estimate based on market opportunities</li>
              <li>• Past performance does not guarantee future results</li>
            </ul>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-primary to-primary-dark rounded-xl p-6 text-white">
            <h4 className="text-lg font-semibold mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Projected Results
            </h4>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-blue-400">
                <span className="text-blue-100">Initial Investment:</span>
                <span className="text-xl font-bold">{formatCurrency(parseFloat(investmentAmount) || 0)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-blue-400">
                <span className="text-blue-100">Investment Duration:</span>
                <span className="text-xl font-bold">{investmentDuration} years</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-blue-400">
                <span className="text-blue-100">Projected Final Value:</span>
                <span className="text-2xl font-bold text-yellow-300">{formatCurrency(results.finalValue)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-blue-400">
                <span className="text-blue-100">Total Returns:</span>
                <span className="text-xl font-bold text-green-300">{formatCurrency(results.totalReturns)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2">
                <span className="text-blue-100">Return Multiple:</span>
                <span className="text-xl font-bold text-yellow-300">{formatNumber(results.multiplier)}x</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-green-700 mb-1">Average Annual Gain</p>
              <p className="text-lg font-bold text-green-800">{formatCurrency(results.annualizedGain)}</p>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
              <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-purple-700 mb-1">Target Annual Return</p>
              <p className="text-lg font-bold text-purple-800">{averageAnnualizedReturn}%</p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h5 className="font-semibold text-amber-900 mb-2">Important Disclaimers</h5>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>• Calculations are for illustrative purposes only</li>
              <li>• Based on target return strategy, not guaranteed results</li>
              <li>• Actual returns may vary significantly from projections</li>
              <li>• Real estate investments carry inherent risks</li>
              <li>• Consult with financial advisors before investing</li>
              <li>• Market conditions and property performance may affect returns</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentCalculator;