import React, { useState, useEffect } from 'react';
import {
  Building,
  TrendingUp,
  Home,
  BarChart3,
  Activity,
  MapPin,
  Target,
  DollarSign,
  Calendar,
  Percent,
  Edit3,
  Save,
  X,
  Calculator,
  FileText,
  Wrench,
  CheckCircle,
  PieChart,
  Plus,
  Trash2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// Remove toast for now and focus on fixing the save functionality
import apiService from '../services/api';

// Utility functions
const formatCurrency = (amount: number | string) => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);
};

const formatPercentage = (value: number | string) => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '0.0%';
  return `${numValue.toFixed(1)}%`;
};

// Calculate property metrics using Deal Analyzer data
const calculatePropertyMetrics = (property: Property) => {
  try {
    const dealAnalyzerData = property.dealAnalyzerData ? JSON.parse(property.dealAnalyzerData) : null;
    
    if (!dealAnalyzerData) {
      return null;
    }

    // Calculate gross rental income from rent roll
    const grossRentMonthly = dealAnalyzerData.rentRoll?.reduce((sum: number, unit: any) => {
      return sum + (unit.proFormaRent || unit.currentRent || 0);
    }, 0) || 0;

    // Calculate total expenses
    const expenses = dealAnalyzerData.expenses || {};
    const totalExpenses = Object.values(expenses).reduce((sum: number, val: any) => {
      const expense = typeof val === 'object' ? val.amount || 0 : val || 0;
      return sum + expense;
    }, 0);

    // Calculate vacancy
    const assumptions = dealAnalyzerData.assumptions || {};
    const vacancyRate = assumptions.vacancyRate || 0.05;
    const vacancy = grossRentMonthly * vacancyRate;

    // Calculate NOI
    const netRevenue = grossRentMonthly - vacancy;
    const noi = netRevenue - totalExpenses;

    // Get active loan from Deal Analyzer data (needed for multiple calculations)
    const loans = dealAnalyzerData.loans || [];
    const activeLoan = loans.find((loan: any) => loan.isActive);

    console.log('Deal Analyzer data structure:', {
      hasLoans: !!dealAnalyzerData.loans,
      loansLength: loans.length,
      loans: loans,
      activeLoan: activeLoan
    });

    // Calculate debt service from Deal Analyzer loan data
    let monthlyDebtService = 0;
    
    if (activeLoan && activeLoan.amount > 0) {
      const principal = activeLoan.amount;
      let annualRate = activeLoan.interestRate;
      
      // Interest rate is already in decimal format from Deal Analyzer (e.g., 0.1075 = 10.75%)
      const monthlyRate = annualRate / 12;
      const termMonths = (activeLoan.termYears || 30) * 12;
      
      console.log('Debt service calculation details:', {
        principal,
        annualRate,
        monthlyRate,
        termMonths,
        paymentType: activeLoan.paymentType
      });
      
      if (activeLoan.paymentType === 'interest-only') {
        monthlyDebtService = principal * monthlyRate;
      } else {
        // Full amortization
        if (monthlyRate > 0 && termMonths > 0) {
          const factor = Math.pow(1 + monthlyRate, termMonths);
          monthlyDebtService = principal * (monthlyRate * factor) / (factor - 1);
        }
      }
      
      console.log('Calculated monthly debt service:', monthlyDebtService);
    } else {
      // Fallback to estimated debt service if no loan data
      const monthlyCashFlowFromProperty = parseFloat(property.cashFlow || '0');
      if (noi > 0 && monthlyCashFlowFromProperty < noi) {
        monthlyDebtService = noi - monthlyCashFlowFromProperty;
        if (monthlyDebtService < 0) monthlyDebtService = 0;
      }
    }

    // Calculate cash flow
    const monthlyCashFlow = noi - monthlyDebtService;
    const annualCashFlow = monthlyCashFlow * 12;

    // Calculate investment metrics
    const totalInvested = parseFloat(property.initialCapitalRequired || '0');
    const cashOnCashReturn = totalInvested > 0 ? (annualCashFlow / totalInvested) * 100 : 0;
    
    // Calculate total invested capital (acquisition + rehab + closing + holding costs)
    const acquisitionPrice = parseFloat(property.acquisitionPrice || '0');
    const rehabCosts = parseFloat(property.rehabCosts || '0');
    const closingCosts = dealAnalyzerData.closingCosts ? 
      Object.values(dealAnalyzerData.closingCosts).reduce((sum: number, val: any) => sum + (val || 0), 0) : 0;
    const holdingCosts = dealAnalyzerData.holdingCosts ? 
      Object.values(dealAnalyzerData.holdingCosts).reduce((sum: number, val: any) => sum + (val || 0), 0) : 0;
    
    const totalInvestedCapital = totalInvested > 0 ? totalInvested : (acquisitionPrice + rehabCosts + closingCosts + holdingCosts);
    
    // Calculate ARV and equity metrics
    const arv = parseFloat(property.arvAtTimePurchased || '0');
    const currentEquity = arv - (activeLoan?.remainingBalance || activeLoan?.amount || 0);
    const totalProfit = parseFloat(property.totalProfits || '0');
    const equityMultiple = totalInvestedCapital > 0 ? (currentEquity + totalProfit) / totalInvestedCapital : 0;

    return {
      grossRentMonthly,
      totalExpenses,
      vacancy,
      netRevenue,
      noi,
      monthlyDebtService,
      monthlyCashFlow,
      annualCashFlow,
      cashOnCashReturn,
      grossRentAnnual: grossRentMonthly * 12,
      vacancyAnnual: vacancy * 12,
      netRevenueAnnual: netRevenue * 12,
      totalInvestedCapital,
      totalProfit,
      equityMultiple,
      currentEquity
    };
  } catch (error) {
    console.error('Error calculating property metrics:', error);
    return null;
  }
};

interface Property {
  id: number;
  status: string;
  apartments: number;
  address: string;
  city: string;
  state: string;
  zipCode?: string;
  entity?: string;
  acquisitionDate?: string;
  acquisitionPrice: string;
  rehabCosts: string;
  arvAtTimePurchased?: string;
  initialCapitalRequired: string;
  cashFlow: string;
  salePrice?: string;
  salePoints?: string;
  totalProfits: string;
  yearsHeld?: string;
  cashOnCashReturn: string;
  annualizedReturn: string;
  dealAnalyzerData?: string; // JSON string containing comprehensive Deal Analyzer data
}

interface RehabLineItem {
  id: string;
  category: string;
  item: string;
  budgetAmount: number;
  spentAmount: number;
  completed: boolean;
  notes?: string;
}

const entities = [
  '5Central Capital',
  'The House Doctors',
  'Arcadia Vision Group'
];

const PropertyCard = ({ property, onStatusChange, onDoubleClick }: { property: Property; onStatusChange: (id: number, status: string) => void; onDoubleClick: (property: Property) => void }) => {
  // Use centralized calculations for accurate metrics
  const calculatedMetrics = calculatePropertyMetrics(property);
  
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 w-full cursor-pointer hover:shadow-lg transition-shadow card-hover"
         onDoubleClick={() => onDoubleClick(property)}
         title="Double-click for financial breakdown">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{property.address}</h3>
          <p className="text-gray-600 dark:text-gray-400">{property.city}, {property.state} {property.zipCode || ''}</p>
        </div>
        <div className="flex items-center gap-4">
          <select 
            value={property.status} 
            onChange={(e) => onStatusChange(property.id, e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="Under Contract">Under Contract</option>
            <option value="Rehabbing">Rehabbing</option>
            <option value="Cashflowing">Cashflowing</option>
            <option value="Sold">Sold</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
        <div>
          <p className="text-gray-600 dark:text-gray-400">Units</p>
          <p className="font-semibold text-gray-900 dark:text-white">{property.apartments}</p>
        </div>
        <div>
          <p className="text-gray-600 dark:text-gray-400">Acquisition Price</p>
          <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(property.acquisitionPrice)}</p>
        </div>
        <div>
          <p className="text-gray-600 dark:text-gray-400">Rehab Costs</p>
          <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(property.rehabCosts)}</p>
        </div>
        <div>
          <p className="text-gray-600 dark:text-gray-400">ARV</p>
          <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(property.arvAtTimePurchased || 0)}</p>
        </div>
        <div>
          <p className="text-gray-600 dark:text-gray-400">Monthly Cash Flow</p>
          {calculatedMetrics ? (
            <p className={`font-semibold ${calculatedMetrics.monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(calculatedMetrics.monthlyCashFlow)}
            </p>
          ) : (
            <p className="font-semibold text-gray-500">N/A</p>
          )}
        </div>
        <div>
          <p className="text-gray-600 dark:text-gray-400">CoC Return</p>
          {calculatedMetrics ? (
            <p className={`font-semibold ${calculatedMetrics.cashOnCashReturn >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatPercentage(calculatedMetrics.cashOnCashReturn)}
            </p>
          ) : (
            <p className="font-semibold text-gray-500">N/A</p>
          )}
        </div>
      </div>

      {property.acquisitionDate && (
        <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          <MapPin className="w-4 h-4 inline mr-1" />
          Acquired: {new Date(property.acquisitionDate).toLocaleDateString()}
        </div>
      )}
    </div>
  );
};

const SoldPropertyCard = ({ property, onStatusChange, onDoubleClick }: { property: Property; onStatusChange: (id: number, status: string) => void; onDoubleClick: (property: Property) => void }) => {
  // Use centralized calculations for accurate metrics
  const calculatedMetrics = calculatePropertyMetrics(property);
  
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 aspect-square flex flex-col cursor-pointer card-hover transition-all-smooth hover:shadow-md bg-white dark:bg-gray-800"
         onDoubleClick={() => onDoubleClick(property)}
         title="Double-click for financial breakdown">
      {/* Header with property info */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight">{property.address}</h3>
          <select 
            value={property.status} 
            onChange={(e) => onStatusChange(property.id, e.target.value)}
            className="px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all-smooth hover:border-purple-400"
          >
            <option value="Under Contract">Under Contract</option>
            <option value="Rehabbing">Rehabbing</option>
            <option value="Cashflowing">Cashflowing</option>
            <option value="Sold">Sold</option>
          </select>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{property.city}, {property.state}</p>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 mt-1">
          Sold
        </span>
      </div>

      {/* Financial metrics grid using centralized calculations */}
      <div className="flex-1 grid grid-cols-2 gap-2 text-xs">
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-2">
          <p className="text-gray-600 dark:text-gray-400 text-xs mb-0.5">Capital</p>
          {calculatedMetrics ? (
            <p className="font-bold text-gray-900 dark:text-white text-xs">{formatCurrency(calculatedMetrics.totalInvestedCapital)}</p>
          ) : (
            <p className="font-bold text-gray-900 dark:text-white text-xs">{formatCurrency(property.initialCapitalRequired)}</p>
          )}
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-md p-2">
          <p className="text-green-700 dark:text-green-400 text-xs mb-0.5">Profit</p>
          {calculatedMetrics ? (
            <p className="font-bold text-green-700 dark:text-green-400 text-xs">
              {formatCurrency(calculatedMetrics.totalProfit || parseFloat(property.totalProfits || '0'))}
            </p>
          ) : (
            <p className="font-bold text-green-700 dark:text-green-400 text-xs">{formatCurrency(property.totalProfits)}</p>
          )}
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-2">
          <p className="text-blue-700 dark:text-blue-400 text-xs mb-0.5">Multiple</p>
          {calculatedMetrics ? (
            <p className="font-bold text-blue-700 dark:text-blue-400 text-xs">{calculatedMetrics.equityMultiple.toFixed(2)}x</p>
          ) : (
            <p className="font-bold text-blue-700 dark:text-blue-400 text-xs">{(Number(property.totalProfits) / Number(property.initialCapitalRequired)).toFixed(2)}x</p>
          )}
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-md p-2">
          <p className="text-purple-700 dark:text-purple-400 text-xs mb-0.5">Sale</p>
          <p className="font-bold text-purple-700 dark:text-purple-400 text-xs">{formatCurrency(property.salePrice || '0')}</p>
        </div>
      </div>
    </div>
  );
};

// Helper functions moved to top of file

// Loan payment calculation function
const calculateLoanPayment = (amount: number, interestRate: number, termYears: number, paymentType: string) => {
  if (amount <= 0 || interestRate <= 0) return 0;
  
  const monthlyRate = interestRate / 12;
  
  if (paymentType === 'interest-only') {
    return amount * monthlyRate;
  } else {
    // Full amortization
    const numPayments = termYears * 12;
    if (numPayments <= 0) return 0;
    
    return amount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
  }
};

export default function AssetManagement() {
  const queryClient = useQueryClient();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [rehabLineItems, setRehabLineItems] = useState<Record<number, RehabLineItem[]>>({});
  const [showRehabModal, setShowRehabModal] = useState<Property | null>(null);
  const [showPropertyDetailModal, setShowPropertyDetailModal] = useState<Property | null>(null);
  const [propertyDetailTab, setPropertyDetailTab] = useState('overview');
  const [editingModalProperty, setEditingModalProperty] = useState<Property | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Centralized loan data management for modal consistency
  const getModalLoanData = () => {
    if (!showPropertyDetailModal) return [];
    
    // Use property's stored data or create default data structure
    const propertyData = editingModalProperty?.dealAnalyzerData ? JSON.parse(editingModalProperty.dealAnalyzerData) : null;
    let loans = propertyData?.loans || [];
    
    // If no loans exist, create default acquisition loan using property data
    if (loans.length === 0) {
      const loanPercentage = propertyData?.assumptions?.loanPercentage || 0.8;
      const interestRate = propertyData?.assumptions?.interestRate || 0.065;
      const termYears = propertyData?.assumptions?.loanTermYears || 30;
      const loanAmount = parseFloat(showPropertyDetailModal.acquisitionPrice) * loanPercentage;
      const paymentType = termYears <= 3 ? 'interest-only' : 'amortizing';
      
      const defaultLoan = {
        id: 1,
        name: 'Acquisition Loan',
        amount: loanAmount,
        loanAmount: loanAmount,
        interestRate: interestRate,
        termYears: termYears,
        monthlyPayment: calculateLoanPayment(loanAmount, interestRate, termYears, paymentType),
        isActive: true,
        loanType: 'acquisition',
        paymentType: paymentType,
        startDate: showPropertyDetailModal.acquisitionDate || new Date().toISOString().split('T')[0],
        remainingBalance: loanAmount
      };
      loans = [defaultLoan];
    }
    
    return loans;
  };

  const getActiveLoan = () => {
    const loans = getModalLoanData();
    return loans.find((loan: any) => loan.isActive) || loans[0] || null;
  };

  // Universal calculation function that works for any property
  const calculatePropertyMetrics = (property: Property) => {
    if (!property.dealAnalyzerData) return null;
    
    const propertyData = JSON.parse(property.dealAnalyzerData);
    const rentRoll = propertyData.rentRoll || [];
    const assumptions = propertyData.assumptions || {};
    const expenses = propertyData.expenses || {};
    const unitTypes = propertyData.unitTypes || [];
    
    // Revenue calculations
    const grossRentMonthly = rentRoll.reduce((sum: number, unit: any) => {
      const unitType = unitTypes.find((ut: any) => ut.id === unit.unitTypeId);
      return sum + (unitType ? unitType.marketRent : unit.proFormaRent);
    }, 0);
    
    const vacancyRate = assumptions.vacancyRate || 0.05;
    const vacancy = grossRentMonthly * vacancyRate;
    const netRevenue = grossRentMonthly - vacancy;
    
    // Expense calculations (monthly)
    const propertyTax = (expenses.propertyTax || 15000) / 12;
    const insurance = (expenses.insurance || 14500) / 12;
    const maintenance = (expenses.maintenance || 8000) / 12;
    const waterSewerTrash = (expenses.waterSewerTrash || 6000) / 12;
    const capitalReserves = (expenses.capitalReserves || 2000) / 12;
    const utilities = (expenses.utilities || 6000) / 12;
    const other = (expenses.other || 0) / 12;
    const managementFee = netRevenue * 0.08;
    
    const totalExpenses = propertyTax + insurance + maintenance + waterSewerTrash + capitalReserves + utilities + other + managementFee;
    const noi = netRevenue - totalExpenses;
    
    // Debt service calculation using available loan data
    const activeLoan = propertyData.loans?.find((loan: any) => loan.isActive) || null;
    let monthlyDebtService = 0;
    
    if (activeLoan) {
      const loanAmount = activeLoan.loanAmount || activeLoan.amount || 0;
      const interestRate = activeLoan.interestRate || 0.08;
      const termYears = activeLoan.termYears || 30;
      const paymentType = activeLoan.paymentType || 'full-amortization';
      
      if (paymentType === 'interest-only') {
        monthlyDebtService = (loanAmount * interestRate) / 12;
      } else {
        const monthlyRate = interestRate / 12;
        const numPayments = termYears * 12;
        if (monthlyRate > 0) {
          monthlyDebtService = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
        }
      }
    } else {
      // Fallback to basic calculation if no loan data
      const acquisitionPrice = parseFloat(property.acquisitionPrice) || 0;
      const rehabCosts = parseFloat(property.rehabCosts) || 0;
      const loanPercentage = assumptions.loanPercentage || 0.8;
      const interestRate = assumptions.interestRate || 0.08;
      const termYears = assumptions.loanTermYears || 30;
      
      const loanAmount = (acquisitionPrice + rehabCosts) * loanPercentage;
      if (loanAmount > 0) {
        const monthlyRate = interestRate / 12;
        const numPayments = termYears * 12;
        if (monthlyRate > 0) {
          monthlyDebtService = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
        }
      }
    }
    
    // Cash flow calculation
    const monthlyCashFlow = noi - monthlyDebtService;
    const annualCashFlow = monthlyCashFlow * 12;
    
    // Investment calculations for COC
    const acquisitionPrice = parseFloat(property.acquisitionPrice) || 0;
    const totalRehab = parseFloat(property.rehabCosts) || 0;
    
    const closingCosts = propertyData.closingCosts ?
      Object.values(propertyData.closingCosts).reduce((sum: number, cost: any) => sum + (Number(cost) || 0), 0) : 0;
    
    const holdingCosts = propertyData.holdingCosts ?
      Object.values(propertyData.holdingCosts).reduce((sum: number, cost: any) => sum + (Number(cost) || 0), 0) : 0;
    
    const loanPercentage = assumptions.loanPercentage || 0.8;
    const downPayment = (acquisitionPrice + totalRehab) * (1 - loanPercentage);
    const totalCashInvested = downPayment + closingCosts + holdingCosts;
    
    // Cash-on-Cash Return calculation
    const cashOnCashReturn = totalCashInvested > 0 ? (annualCashFlow / totalCashInvested) * 100 : 0;
    
    return {
      grossRentMonthly,
      grossRentAnnual: grossRentMonthly * 12,
      vacancy,
      vacancyAnnual: vacancy * 12,
      netRevenue,
      netRevenueAnnual: netRevenue * 12,
      totalExpenses,
      totalExpensesAnnual: totalExpenses * 12,
      noi,
      noiAnnual: noi * 12,
      monthlyDebtService,
      annualDebtService: monthlyDebtService * 12,
      monthlyCashFlow,
      annualCashFlow,
      totalCashInvested,
      cashOnCashReturn,
      acquisitionPrice,
      totalRehab,
      closingCosts,
      holdingCosts,
      downPayment
    };
  };

  // Initialize default rehab line items for a property
  const initializeRehabItems = (property: Property): RehabLineItem[] => {
    const totalBudget = parseFloat(property.rehabCosts) || 100000;
    return [
      // Exterior
      { id: '1', category: 'Exterior', item: 'Roof Repair/Replacement', budgetAmount: totalBudget * 0.15, spentAmount: 0, completed: false },
      { id: '2', category: 'Exterior', item: 'Siding & Paint', budgetAmount: totalBudget * 0.12, spentAmount: 0, completed: false },
      { id: '3', category: 'Exterior', item: 'Windows & Doors', budgetAmount: totalBudget * 0.10, spentAmount: 0, completed: false },
      
      // Kitchens
      { id: '4', category: 'Kitchens', item: 'Cabinets & Countertops', budgetAmount: totalBudget * 0.15, spentAmount: 0, completed: false },
      { id: '5', category: 'Kitchens', item: 'Appliances', budgetAmount: totalBudget * 0.08, spentAmount: 0, completed: false },
      { id: '6', category: 'Kitchens', item: 'Plumbing & Electrical', budgetAmount: totalBudget * 0.06, spentAmount: 0, completed: false },
      
      // Bathrooms
      { id: '7', category: 'Bathrooms', item: 'Fixtures & Vanities', budgetAmount: totalBudget * 0.08, spentAmount: 0, completed: false },
      { id: '8', category: 'Bathrooms', item: 'Tile & Flooring', budgetAmount: totalBudget * 0.06, spentAmount: 0, completed: false },
      
      // General Interior
      { id: '9', category: 'General Interior', item: 'Flooring', budgetAmount: totalBudget * 0.10, spentAmount: 0, completed: false },
      { id: '10', category: 'General Interior', item: 'Paint & Finishes', budgetAmount: totalBudget * 0.05, spentAmount: 0, completed: false },
      { id: '11', category: 'General Interior', item: 'HVAC', budgetAmount: totalBudget * 0.05, spentAmount: 0, completed: false }
    ];
  };

  // Data fetching hooks
  const { data: propertiesResponse, isLoading, error } = useQuery({
    queryKey: ['/api/properties'],
    queryFn: () => apiService.getProperties()
  });

  // Ensure properties is always an array
  const properties = (() => {
    if (!propertiesResponse) return [];
    if (Array.isArray(propertiesResponse)) return propertiesResponse;
    if (propertiesResponse.data && Array.isArray(propertiesResponse.data)) return propertiesResponse.data;
    return [];
  })();

  const updatePropertyMutation = useMutation({
    mutationFn: async (data: { id: number; property: Partial<Property> }) => {
      return await apiService.updateProperty(data.id, data.property);
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      
      // Update modal state with the updated property data
      const updatedProperty = response?.data || response;
      if (showPropertyDetailModal && updatedProperty && updatedProperty.id === showPropertyDetailModal.id) {
        setShowPropertyDetailModal(updatedProperty as Property);
        setEditingModalProperty(updatedProperty as Property);
      }
      
      setIsEditing(false);
      console.log('Property updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update property:', error);
      alert('Failed to save changes. Please try again.');
    }
  });

  const handleStatusChange = (id: number, status: string) => {
    const property = properties.find(p => p.id === id);
    if (property) {
      updatePropertyMutation.mutate({ 
        id: id, 
        property: { ...property, status } 
      });
    }
  };





  const handlePropertyDoubleClick = (property: Property) => {
    // For rehabbing properties, initialize rehab items from imported data if available
    if (property.status === 'Rehabbing' && !rehabLineItems[property.id]) {
      // Check for imported rehab line items from localStorage
      const existingRehabData = localStorage.getItem('rehabLineItems');
      if (existingRehabData) {
        const rehabData = JSON.parse(existingRehabData);
        if (rehabData[property.id]) {
          setRehabLineItems(prev => ({
            ...prev,
            [property.id]: rehabData[property.id]
          }));
        } else {
          setRehabLineItems(prev => ({
            ...prev,
            [property.id]: initializeRehabItems(property)
          }));
        }
      } else {
        setRehabLineItems(prev => ({
          ...prev,
          [property.id]: initializeRehabItems(property)
        }));
      }
    }
    
    // Show comprehensive property detail modal with all Deal Analyzer tabs
    setShowPropertyDetailModal(property);
    setEditingModalProperty({ ...property });
    setPropertyDetailTab('overview');
  };

  const savePropertyChanges = () => {
    if (editingModalProperty) {
      console.log('Saving property changes:', editingModalProperty);
      const propertyData = {
        dealAnalyzerData: editingModalProperty.dealAnalyzerData,
        acquisitionPrice: editingModalProperty.acquisitionPrice,
        rehabCosts: editingModalProperty.rehabCosts,
        cashFlow: editingModalProperty.cashFlow,
        cashOnCashReturn: editingModalProperty.cashOnCashReturn,
        entity: editingModalProperty.entity,
        status: editingModalProperty.status
      };
      console.log('Property data to save:', propertyData);
      
      updatePropertyMutation.mutate({
        id: editingModalProperty.id,
        property: propertyData
      });
    } else {
      console.log('No editing property found');
    }
  };

  const handlePropertyFieldChange = (field: string, value: any) => {
    if (editingModalProperty) {
      console.log('Updating field:', field, 'with value:', value);
      const updatedProperty = {
        ...editingModalProperty,
        [field]: value
      };
      console.log('Updated property:', updatedProperty);
      setEditingModalProperty(updatedProperty);
    }
  };

  const closePropertyModal = () => {
    setSelectedProperty(null);
  };

  const closeDetailModal = () => {
    setShowPropertyDetailModal(null);
    setEditingModalProperty(null);
    setIsEditing(false);
  };

  // Add the missing getPropertyCalculations function
  const getPropertyCalculations = () => {
    if (!showPropertyDetailModal || !editingModalProperty) return null;
    return calculatePropertyMetrics(editingModalProperty);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Error Loading Properties</h2>
          <p className="text-gray-600 dark:text-gray-400">Please try refreshing the page</p>
          <p className="text-sm text-red-500 mt-2">{error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    );
  }

  // Add defensive check for empty properties
  if (!properties || properties.length === 0) {
    return (
      <div className="space-y-6">
        {/* KPI Bar with zero values */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-500 via-purple-500 to-purple-600 rounded-lg shadow-lg border border-blue-200 p-6">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center">
              <Calculator className="h-6 w-6 mr-3" />
              <span className="text-lg font-semibold">Portfolio Performance</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mt-4">
            <div className="text-center border-r border-white/20 last:border-r-0 pr-6 last:pr-0">
              <div className="text-2xl font-bold text-white">0</div>
              <div className="text-sm text-white/80">Total Units</div>
            </div>
            <div className="text-center border-r border-white/20 last:border-r-0 pr-6 last:pr-0">
              <div className="text-2xl font-bold text-white">$0</div>
              <div className="text-sm text-white/80">Total AUM</div>
            </div>
            <div className="text-center border-r border-white/20 last:border-r-0 pr-6 last:pr-0">
              <div className="text-2xl font-bold text-white">$0</div>
              <div className="text-sm text-white/80">Price/Unit</div>
            </div>
            <div className="text-center border-r border-white/20 last:border-r-0 pr-6 last:pr-0">
              <div className="text-2xl font-bold text-white">$0</div>
              <div className="text-sm text-white/80">Total Equity</div>
            </div>
            <div className="text-center border-r border-white/20 last:border-r-0 pr-6 last:pr-0">
              <div className="text-2xl font-bold text-white">$0</div>
              <div className="text-sm text-white/80">Monthly Cash Flow</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">0.0%</div>
              <div className="text-sm text-white/80">Avg CoC Return</div>
            </div>
          </div>
        </div>

        <div className="text-center py-12">
          <Building className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-xl font-medium text-gray-900 dark:text-white">No Properties Found</h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Your property portfolio will appear here once properties are added</p>
        </div>
      </div>
    );
  }

  // Calculate metrics with safe operations
  const metrics = {
    totalUnits: Array.isArray(properties) ? properties.reduce((sum: number, prop: Property) => sum + (prop.apartments || 0), 0) : 0,
    totalAUM: Array.isArray(properties) ? properties.reduce((sum: number, prop: Property) => {
      const acquisition = parseFloat((prop.acquisitionPrice || '0').toString().replace(/[^0-9.-]/g, ''));
      const rehab = parseFloat((prop.rehabCosts || '0').toString().replace(/[^0-9.-]/g, ''));
      return sum + (isNaN(acquisition) ? 0 : acquisition) + (isNaN(rehab) ? 0 : rehab);
    }, 0) : 0,
    totalEquity: Array.isArray(properties) ? properties.reduce((sum: number, prop: Property) => {
      const profits = parseFloat((prop.totalProfits || '0').toString().replace(/[^0-9.-]/g, ''));
      return sum + (isNaN(profits) ? 0 : profits);
    }, 0) : 0,
    totalCashFlow: Array.isArray(properties) ? properties
      .filter((prop: Property) => prop.status === 'Cashflowing')
      .reduce((sum: number, prop: Property) => {
        const cashFlow = parseFloat((prop.cashFlow || '0').toString().replace(/[^0-9.-]/g, ''));
        return sum + (isNaN(cashFlow) ? 0 : cashFlow);
      }, 0) : 0,
    avgCoCReturn: Array.isArray(properties) && properties.length > 0 
      ? properties.reduce((sum: number, prop: Property) => {
          const cocReturn = parseFloat((prop.cashOnCashReturn || '0').toString().replace(/[^0-9.-]/g, ''));
          return sum + (isNaN(cocReturn) ? 0 : cocReturn);
        }, 0) / properties.length 
      : 0,
    pricePerUnit: (() => {
      if (!Array.isArray(properties) || properties.length === 0) return 0;
      const totalValue = properties.reduce((sum: number, prop: Property) => {
        const acquisition = parseFloat((prop.acquisitionPrice || '0').toString().replace(/[^0-9.-]/g, ''));
        const rehab = parseFloat((prop.rehabCosts || '0').toString().replace(/[^0-9.-]/g, ''));
        return sum + (isNaN(acquisition) ? 0 : acquisition) + (isNaN(rehab) ? 0 : rehab);
      }, 0);
      const totalUnits = properties.reduce((sum: number, prop: Property) => sum + (prop.apartments || 0), 0);
      return totalUnits > 0 ? totalValue / totalUnits : 0;
    })()
  };

  return (
    <div className="space-y-6">
      {/* KPI Bar with Continuous Gradient Design */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 via-purple-500 to-purple-600 rounded-lg shadow-lg border border-blue-200 p-6 fade-in hover-glow transition-all-smooth">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center">
            <Calculator className="h-6 w-6 mr-3 icon-bounce" />
            <span className="text-lg font-semibold">Portfolio Performance</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mt-4 stagger-children">
          <div className="text-center border-r border-white/20 last:border-r-0 pr-6 last:pr-0 hover-scale transition-transform-smooth cursor-pointer">
            <div className="text-2xl font-bold text-white">{metrics.totalUnits}</div>
            <div className="text-sm text-white/80">Total Units</div>
          </div>
          <div className="text-center border-r border-white/20 last:border-r-0 pr-6 last:pr-0 hover-scale transition-transform-smooth cursor-pointer">
            <div className="text-2xl font-bold text-white">{formatCurrency(metrics.totalAUM)}</div>
            <div className="text-sm text-white/80">Total AUM</div>
          </div>
          <div className="text-center border-r border-white/20 last:border-r-0 pr-6 last:pr-0 hover-scale transition-transform-smooth cursor-pointer">
            <div className="text-2xl font-bold text-white">{formatCurrency(metrics.pricePerUnit)}</div>
            <div className="text-sm text-white/80">Price/Unit</div>
          </div>
          <div className="text-center border-r border-white/20 last:border-r-0 pr-6 last:pr-0">
            <div className="text-2xl font-bold text-white">{formatCurrency(metrics.totalEquity)}</div>
            <div className="text-sm text-white/80">Total Equity</div>
          </div>
          <div className="text-center border-r border-white/20 last:border-r-0 pr-6 last:pr-0">
            <div className="text-2xl font-bold text-white">{formatCurrency(metrics.totalCashFlow)}</div>
            <div className="text-sm text-white/80">Monthly Cash Flow</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{formatPercentage(metrics.avgCoCReturn)}</div>
            <div className="text-sm text-white/80">Avg CoC Return</div>
          </div>
        </div>
      </div>



      {/* Property Portfolio Sections */}
      <div className="space-y-6">
        {/* Under Contract - Compact Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 fade-in card-hover">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4">
            <FileText className="h-5 w-5 mr-2 text-orange-500 icon-bounce" />
            Under Contract ({properties.filter((p: Property) => p.status === 'Under Contract').length})
          </h2>
          
          {properties.filter((p: Property) => p.status === 'Under Contract').length > 0 ? (
            <div className="space-y-3 stagger-children">
              {properties.filter((p: Property) => p.status === 'Under Contract').map((property: Property) => (
                <div key={property.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover-scale transition-all-smooth card-hover cursor-pointer"
                     onDoubleClick={() => handlePropertyDoubleClick(property)}
                     title="Double-click for financial breakdown">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{property.address}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{property.city}, {property.state}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Purchase Price</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(property.acquisitionPrice)}</p>
                      </div>
                      <select 
                        value={property.status} 
                        onChange={(e) => handleStatusChange(property.id, e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm transition-all-smooth hover:border-blue-400 hover-scale"
                      >
                        <option value="Under Contract">Under Contract</option>
                        <option value="Rehabbing">Rehabbing</option>
                        <option value="Cashflowing">Cashflowing</option>
                        <option value="Sold">Sold</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="mx-auto h-8 w-8 text-gray-400" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">No properties under contract</p>
            </div>
          )}
        </div>

        {/* Rehabbing - Side by Side with Progress Tracking */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 fade-in card-hover">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-6">
            <Wrench className="h-5 w-5 mr-2 text-blue-500 icon-bounce" />
            Rehabbing ({properties.filter((p: Property) => p.status === 'Rehabbing').length})
          </h2>
          
          {properties.filter((p: Property) => p.status === 'Rehabbing').length > 0 ? (
            <div className="space-y-6 stagger-children">
              {properties.filter((p: Property) => p.status === 'Rehabbing').map((property: Property) => {
                // Get rehab progress from Deal Analyzer data if available
                const dealAnalyzerData = property.dealAnalyzerData ? JSON.parse(property.dealAnalyzerData) : null;
                let rehabBudget = parseFloat(property.rehabCosts) || 0;
                let rehabSpent = 0;
                let rehabProgress = 0;
                
                if (dealAnalyzerData?.rehabBudgetSections) {
                  const allItems = Object.values(dealAnalyzerData.rehabBudgetSections).flat();
                  rehabBudget = allItems.reduce((sum: number, item: any) => sum + (item.totalCost || (item.perUnitCost * item.quantity)), 0);
                  rehabSpent = allItems.reduce((sum: number, item: any) => sum + (item.spentAmount || 0), 0);
                  rehabProgress = rehabBudget > 0 ? (rehabSpent / rehabBudget) * 100 : 0;
                }
                
                return (
                  <div key={property.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover-scale transition-all-smooth card-hover cursor-pointer"
                       onDoubleClick={() => handlePropertyDoubleClick(property)}
                       title="Double-click for financial breakdown">
                    <div className="grid md:grid-cols-2 gap-8">
                      {/* Left Side - Property Details */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{property.address}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{property.city}, {property.state}</p>
                            <div className="mt-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                {property.entity}
                              </span>
                            </div>
                          </div>
                          <select 
                            value={property.status} 
                            onChange={(e) => handleStatusChange(property.id, e.target.value)}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          >
                            <option value="Under Contract">Under Contract</option>
                            <option value="Rehabbing">Rehabbing</option>
                            <option value="Cashflowing">Cashflowing</option>
                            <option value="Sold">Sold</option>
                          </select>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Units</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{property.apartments}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Purchase Price</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(property.acquisitionPrice)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">ARV</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(property.arvAtTimePurchased || 0)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Initial Capital</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(property.initialCapitalRequired)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Right Side - Progress Tracking */}
                      <div className="space-y-6">
                        {/* Rehab Progress */}
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white">Rehab Progress</h4>
                            <span className="text-lg font-semibold text-gray-600 dark:text-gray-400">{rehabProgress.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(rehabProgress, 100)}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-2">
                            <span>Started</span>
                            <span>In Progress</span>
                            <span>Complete</span>
                          </div>
                        </div>

                        {/* Budget Tracking */}
                        <div>
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white">Budget Tracking</h4>
                            <button
                              onClick={() => setShowRehabModal(property)}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                            >
                              View Details
                            </button>
                          </div>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Budget</span>
                              <span className="text-lg font-bold text-blue-900 dark:text-blue-100">{formatCurrency(rehabBudget)}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                              <span className="text-sm font-medium text-red-900 dark:text-red-100">Spent to Date</span>
                              <span className="text-lg font-bold text-red-900 dark:text-red-100">{formatCurrency(rehabSpent)}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                              <span className="text-sm font-medium text-green-900 dark:text-green-100">Remaining</span>
                              <span className="text-lg font-bold text-green-900 dark:text-green-100">{formatCurrency(rehabBudget - rehabSpent)}</span>
                            </div>
                            
                            {/* Budget Progress Bar */}
                            <div className="mt-4">
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                <div 
                                  className={`h-3 rounded-full transition-all duration-300 ${
                                    rehabProgress > 90 ? 'bg-red-500' : rehabProgress > 75 ? 'bg-yellow-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min(rehabProgress, 100)}%` }}
                                ></div>
                              </div>
                              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                                <span>$0</span>
                                <span>{formatCurrency(rehabBudget)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Status Indicator */}
                        <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Active Renovation</span>
                          </div>
                          <span className="text-sm text-blue-600 dark:text-blue-300 font-medium">On Track</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Wrench className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No Properties in Rehab</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Properties undergoing renovation will appear here</p>
            </div>
          )}
        </div>

        {/* Cashflowing Properties */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 fade-in card-hover">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-6">
            <DollarSign className="h-5 w-5 mr-2 text-green-500 icon-bounce" />
            Cashflowing ({properties.filter((p: Property) => p.status === 'Cashflowing').length})
          </h2>
          
          {properties.filter((p: Property) => p.status === 'Cashflowing').length > 0 ? (
            <div className="grid gap-4 stagger-children">
              {properties.filter((p: Property) => p.status === 'Cashflowing').map((property: Property) => (
                <PropertyCard key={property.id} property={property} onStatusChange={handleStatusChange} onDoubleClick={handlePropertyDoubleClick} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No Cashflowing Properties</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Rental properties generating income will appear here</p>
            </div>
          )}
        </div>

        {/* Sold Properties */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 fade-in card-hover">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-6">
            <CheckCircle className="h-5 w-5 mr-2 text-purple-500 icon-bounce" />
            Sold ({properties.filter((p: Property) => p.status === 'Sold').length})
          </h2>
          
          {properties.filter((p: Property) => p.status === 'Sold').length > 0 ? (
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-3 stagger-children">
              {properties.filter((p: Property) => p.status === 'Sold').map((property: Property) => (
                <SoldPropertyCard key={property.id} property={property} onStatusChange={handleStatusChange} onDoubleClick={handlePropertyDoubleClick} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No Sold Properties</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Completed property sales will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Property Financial Breakdown Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Property Financial Analysis - {selectedProperty.address}
              </h2>
              <button
                onClick={closePropertyModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Financial Breakdown */}
              <div className="space-y-6">
                {/* Revenue Section */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-4 flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Revenue
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-blue-700 dark:text-blue-300">Gross Rent (Annual)</span>
                      <span className="font-semibold text-blue-900 dark:text-blue-200">
                        {formatCurrency(Number(selectedProperty.cashFlow) * 12)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700 dark:text-blue-300">Vacancy Loss (5.0%)</span>
                      <span className="font-semibold text-red-600">
                        -{formatCurrency(Number(selectedProperty.cashFlow) * 12 * 0.05)}
                      </span>
                    </div>
                    <div className="border-t border-blue-300 dark:border-blue-700 pt-2">
                      <div className="flex justify-between">
                        <span className="font-semibold text-blue-900 dark:text-blue-200">Net Revenue</span>
                        <span className="font-bold text-blue-900 dark:text-blue-200">
                          {formatCurrency(Number(selectedProperty.cashFlow) * 12 * 0.95)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expenses Section */}
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                  <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-4 flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Expenses
                  </h3>
                  <div className="space-y-3">
                    {(() => {
                      const grossRent = Number(selectedProperty.cashFlow) * 12;
                      const propertyTax = grossRent * 0.12;
                      const insurance = grossRent * 0.06;
                      const maintenance = grossRent * 0.08;
                      const waterSewerTrash = grossRent * 0.04;
                      const capitalReserves = grossRent * 0.032;
                      const utilities = grossRent * 0.024;
                      const other = grossRent * 0.016;
                      const managementFee = grossRent * 0.08;
                      const totalExpenses = propertyTax + insurance + maintenance + waterSewerTrash + capitalReserves + utilities + other + managementFee;

                      return (
                        <>
                          <div className="flex justify-between">
                            <span className="text-red-700 dark:text-red-300">Property Tax</span>
                            <span className="font-semibold text-red-900 dark:text-red-200">{formatCurrency(propertyTax)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-red-700 dark:text-red-300">Insurance</span>
                            <span className="font-semibold text-red-900 dark:text-red-200">{formatCurrency(insurance)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-red-700 dark:text-red-300">Maintenance</span>
                            <span className="font-semibold text-red-900 dark:text-red-200">{formatCurrency(maintenance)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-red-700 dark:text-red-300">Water/Sewer/Trash</span>
                            <span className="font-semibold text-red-900 dark:text-red-200">{formatCurrency(waterSewerTrash)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-red-700 dark:text-red-300">Capital Reserves</span>
                            <span className="font-semibold text-red-900 dark:text-red-200">{formatCurrency(capitalReserves)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-red-700 dark:text-red-300">Utilities</span>
                            <span className="font-semibold text-red-900 dark:text-red-200">{formatCurrency(utilities)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-red-700 dark:text-red-300">Other</span>
                            <span className="font-semibold text-red-900 dark:text-red-200">{formatCurrency(other)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-red-700 dark:text-red-300">Management Fee (8%)</span>
                            <span className="font-semibold text-red-900 dark:text-red-200">{formatCurrency(managementFee)}</span>
                          </div>
                          <div className="border-t border-red-300 dark:border-red-700 pt-2">
                            <div className="flex justify-between">
                              <span className="font-semibold text-red-900 dark:text-red-200">Total Expenses</span>
                              <span className="font-bold text-red-900 dark:text-red-200">{formatCurrency(totalExpenses)}</span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Net Operating Income */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <h3 className="text-lg font-semibold text-green-900 dark:text-green-300 mb-4 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Net Operating Income
                  </h3>
                  <div className="space-y-3">
                    {(() => {
                      const grossRent = Number(selectedProperty.cashFlow) * 12;
                      const netRevenue = grossRent * 0.95;
                      const totalExpenses = grossRent * 0.448; 
                      const noi = netRevenue - totalExpenses;
                      const monthlyDebtService = grossRent * 0.055;
                      const netCashFlow = (noi - (monthlyDebtService * 12)) / 12;

                      return (
                        <>
                          <div className="flex justify-between">
                            <span className="font-semibold text-green-900 dark:text-green-200">Net Operating Income (NOI)</span>
                            <span className="font-bold text-green-900 dark:text-green-200">{formatCurrency(noi)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-green-700 dark:text-green-300">Monthly Debt Service</span>
                            <span className="font-semibold text-red-600">-{formatCurrency(monthlyDebtService)}</span>
                          </div>
                          <div className="border-t border-green-300 dark:border-green-700 pt-2">
                            <div className="flex justify-between">
                              <span className="font-semibold text-green-900 dark:text-green-200">Net Cash Flow (Monthly)</span>
                              <span className={`font-bold ${netCashFlow > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(netCashFlow)}
                              </span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Investment Summary & Analysis */}
              <div className="space-y-6">
                {/* Investment Summary */}
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                  <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-300 mb-4 flex items-center">
                    <PieChart className="h-5 w-5 mr-2" />
                    Investment Summary
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-purple-700 dark:text-purple-300">Total Cash Invested</span>
                      <span className="font-semibold text-purple-900 dark:text-purple-200">
                        {formatCurrency(selectedProperty.initialCapitalRequired)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-700 dark:text-purple-300">Annual Cash Flow</span>
                      <span className={`font-semibold ${Number(selectedProperty.cashFlow) * 12 > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(Number(selectedProperty.cashFlow) * 12)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-700 dark:text-purple-300">Cash-Out at Refi</span>
                      <span className="font-semibold text-purple-900 dark:text-purple-200">
                        {formatCurrency(Number(selectedProperty.totalProfits))}
                      </span>
                    </div>
                    <div className="border-t border-purple-300 dark:border-purple-700 pt-2">
                      <div className="flex justify-between">
                        <span className="font-semibold text-purple-900 dark:text-purple-200">Total Return</span>
                        <span className={`font-bold ${Number(selectedProperty.totalProfits) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(Number(selectedProperty.totalProfits))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Loan Analysis */}
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                  <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-300 mb-4 flex items-center">
                    <Calculator className="h-5 w-5 mr-2" />
                    Loan Analysis
                  </h3>
                  <div className="space-y-3">
                    {(() => {
                      const acquisitionPrice = Number(selectedProperty.acquisitionPrice);
                      const ltcLoan = acquisitionPrice * 0.8;
                      const arvLoan = Number(selectedProperty.arvAtTimePurchased) * 0.65;
                      const monthlyDebtService = acquisitionPrice * 0.055 / 12;
                      const interestRate = 8.75;

                      return (
                        <>
                          <div className="flex justify-between">
                            <span className="text-orange-700 dark:text-orange-300">Initial Loan (LTC)</span>
                            <span className="font-semibold text-orange-900 dark:text-orange-200">{formatCurrency(ltcLoan)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-orange-700 dark:text-orange-300">Max Loan Amount (65% ARV)</span>
                            <span className="font-semibold text-orange-900 dark:text-orange-200">{formatCurrency(arvLoan)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-orange-700 dark:text-orange-300">Interest Rate</span>
                            <span className="font-semibold text-orange-900 dark:text-orange-200">{interestRate}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-orange-700 dark:text-orange-300">Monthly Payment</span>
                            <span className="font-semibold text-orange-900 dark:text-orange-200">{formatCurrency(monthlyDebtService)}</span>
                          </div>
                          <div className="border-t border-orange-300 dark:border-orange-700 pt-2">
                            <div className="flex justify-between">
                              <span className="font-semibold text-orange-900 dark:text-orange-200">Cash-Out Potential</span>
                              <span className="font-bold text-green-600">{formatCurrency(Math.max(0, arvLoan - ltcLoan))}</span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Property Details */}
                <div className="bg-gray-50 dark:bg-gray-700/20 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-300 mb-4 flex items-center">
                    <Building className="h-5 w-5 mr-2" />
                    Property Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-700 dark:text-gray-300">Units</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-200">{selectedProperty.apartments}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700 dark:text-gray-300">Entity</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-200">{selectedProperty.entity || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700 dark:text-gray-300">Status</span>
                      <span className={`font-semibold px-2 py-1 rounded-full text-xs ${
                        selectedProperty.status === 'Cashflowing' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : selectedProperty.status === 'Rehabbing'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : selectedProperty.status === 'Under Contract'
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                          : selectedProperty.status === 'Sold'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {selectedProperty.status}
                      </span>
                    </div>
                    {selectedProperty.acquisitionDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Acquisition Date</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-200">
                          {new Date(selectedProperty.acquisitionDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-700 dark:text-gray-300">Cash-on-Cash Return</span>
                      <span className="font-semibold text-blue-600">{formatPercentage(selectedProperty.cashOnCashReturn)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Comprehensive Rehab Budget Modal - Same as Deal Analyzer */}
      {showRehabModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-7xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Rehab Budget - {showRehabModal.address}
              </h2>
              <button
                onClick={() => setShowRehabModal(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {(() => {
              const dealAnalyzerData = showRehabModal.dealAnalyzerData ? JSON.parse(showRehabModal.dealAnalyzerData) : null;
              
              if (!dealAnalyzerData?.rehabBudgetSections) {
                return (
                  <div className="text-center py-8">
                    <p className="text-gray-600 dark:text-gray-400">No rehab budget data available. Import from Deal Analyzer or add manually.</p>
                  </div>
                );
              }

              const allItems = Object.values(dealAnalyzerData.rehabBudgetSections).flat();
              const totalBudget = allItems.reduce((sum: number, item: any) => sum + (item.totalCost || (item.perUnitCost * item.quantity)), 0);
              const totalSpent = allItems.reduce((sum: number, item: any) => sum + (item.spentAmount || 0), 0);
              const completedItems = allItems.filter((item: any) => item.completed).length;
              const completionPercentage = allItems.length > 0 ? (completedItems / allItems.length) * 100 : 0;
              const spentPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
              const remaining = totalBudget - totalSpent;
              const buffer = totalBudget * 0.1;

              const getCategoryProgress = (category: string) => {
                const section = dealAnalyzerData.rehabBudgetSections[category];
                if (!section || section.length === 0) return 0;
                const completedItems = section.filter((item: any) => item.completed || false).length;
                return Math.round((completedItems / section.length) * 100);
              };

              return (
                <div className="space-y-6">
                  {/* Two Column Layout */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Left Column - Budget Table */}
                    <div className="bg-white border border-gray-200 rounded-lg">
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b bg-gray-50">
                              <th className="text-left py-2 px-3 font-medium text-sm border-r">Category</th>
                              <th className="text-right py-2 px-3 font-medium text-sm border-r">Per unit</th>
                              <th className="text-right py-2 px-3 font-medium text-sm border-r">Units</th>
                              <th className="text-right py-2 px-3 font-medium text-sm">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* Exterior Section */}
                            <tr className="bg-blue-50">
                              <td className="py-2 px-3 font-semibold text-blue-700" colSpan={4}>
                                Exterior
                              </td>
                            </tr>
                            {dealAnalyzerData.rehabBudgetSections.exterior?.map((item: any, index: number) => (
                              <tr key={index} className="border-b">
                                <td className="py-2 px-3 border-r">{item.category}</td>
                                <td className="py-2 px-3 text-right border-r">${parseInt(item.perUnitCost || 0).toLocaleString()}</td>
                                <td className="py-2 px-3 text-right border-r">{item.quantity}</td>
                                <td className="py-2 px-3 text-right">${(item.totalCost || (item.perUnitCost * item.quantity)).toLocaleString()}</td>
                              </tr>
                            ))}
                            <tr className="bg-blue-100 font-semibold">
                              <td className="py-2 px-3" colSpan={3}>Total</td>
                              <td className="py-2 px-3 text-right">
                                ${dealAnalyzerData.rehabBudgetSections.exterior?.reduce((sum: number, item: any) => 
                                  sum + (item.totalCost || (item.perUnitCost * item.quantity)), 0).toLocaleString()}
                              </td>
                            </tr>

                            {/* Kitchens Section */}
                            <tr className="bg-green-50">
                              <td className="py-2 px-3 font-semibold text-green-700" colSpan={4}>
                                Kitchens
                              </td>
                            </tr>
                            {dealAnalyzerData.rehabBudgetSections.kitchens?.map((item: any, index: number) => (
                              <tr key={index} className="border-b">
                                <td className="py-2 px-3 border-r">{item.category}</td>
                                <td className="py-2 px-3 text-right border-r">${parseInt(item.perUnitCost || 0).toLocaleString()}</td>
                                <td className="py-2 px-3 text-right border-r">{item.quantity}</td>
                                <td className="py-2 px-3 text-right">${(item.totalCost || (item.perUnitCost * item.quantity)).toLocaleString()}</td>
                              </tr>
                            ))}
                            <tr className="bg-green-100 font-semibold">
                              <td className="py-2 px-3" colSpan={3}>Total</td>
                              <td className="py-2 px-3 text-right">
                                ${dealAnalyzerData.rehabBudgetSections.kitchens?.reduce((sum: number, item: any) => 
                                  sum + (item.totalCost || (item.perUnitCost * item.quantity)), 0).toLocaleString()}
                              </td>
                            </tr>

                            {/* Bathrooms Section */}
                            <tr className="bg-purple-50">
                              <td className="py-2 px-3 font-semibold text-purple-700" colSpan={4}>
                                Bathrooms
                              </td>
                            </tr>
                            {dealAnalyzerData.rehabBudgetSections.bathrooms?.map((item: any, index: number) => (
                              <tr key={index} className="border-b">
                                <td className="py-2 px-3 border-r">{item.category}</td>
                                <td className="py-2 px-3 text-right border-r">${parseInt(item.perUnitCost || 0).toLocaleString()}</td>
                                <td className="py-2 px-3 text-right border-r">{item.quantity}</td>
                                <td className="py-2 px-3 text-right">${(item.totalCost || (item.perUnitCost * item.quantity)).toLocaleString()}</td>
                              </tr>
                            ))}
                            <tr className="bg-purple-100 font-semibold">
                              <td className="py-2 px-3" colSpan={3}>Total</td>
                              <td className="py-2 px-3 text-right">
                                ${dealAnalyzerData.rehabBudgetSections.bathrooms?.reduce((sum: number, item: any) => 
                                  sum + (item.totalCost || (item.perUnitCost * item.quantity)), 0).toLocaleString()}
                              </td>
                            </tr>

                            {/* General Interior Section */}
                            <tr className="bg-orange-50">
                              <td className="py-2 px-3 font-semibold text-orange-700" colSpan={4}>
                                General Interior Rough
                              </td>
                            </tr>
                            {dealAnalyzerData.rehabBudgetSections.generalInterior?.map((item: any, index: number) => (
                              <tr key={index} className="border-b">
                                <td className="py-2 px-3 border-r">{item.category}</td>
                                <td className="py-2 px-3 text-right border-r">${parseInt(item.perUnitCost || 0).toLocaleString()}</td>
                                <td className="py-2 px-3 text-right border-r">{item.quantity}</td>
                                <td className="py-2 px-3 text-right">${(item.totalCost || (item.perUnitCost * item.quantity)).toLocaleString()}</td>
                              </tr>
                            ))}
                            <tr className="bg-orange-100 font-semibold">
                              <td className="py-2 px-3" colSpan={3}>Total</td>
                              <td className="py-2 px-3 text-right">
                                ${dealAnalyzerData.rehabBudgetSections.generalInterior?.reduce((sum: number, item: any) => 
                                  sum + (item.totalCost || (item.perUnitCost * item.quantity)), 0).toLocaleString()}
                              </td>
                            </tr>

                            {/* Finishings Section */}
                            <tr className="bg-indigo-50">
                              <td className="py-2 px-3 font-semibold text-indigo-700" colSpan={4}>
                                Finishings
                              </td>
                            </tr>
                            {dealAnalyzerData.rehabBudgetSections.finishings?.map((item: any, index: number) => (
                              <tr key={index} className="border-b">
                                <td className="py-2 px-3 border-r">{item.category}</td>
                                <td className="py-2 px-3 text-right border-r">${parseInt(item.perUnitCost || 0).toLocaleString()}</td>
                                <td className="py-2 px-3 text-right border-r">{item.quantity}</td>
                                <td className="py-2 px-3 text-right">${(item.totalCost || (item.perUnitCost * item.quantity)).toLocaleString()}</td>
                              </tr>
                            ))}
                            <tr className="bg-indigo-100 font-semibold">
                              <td className="py-2 px-3" colSpan={3}>Total</td>
                              <td className="py-2 px-3 text-right">
                                ${dealAnalyzerData.rehabBudgetSections.finishings?.reduce((sum: number, item: any) => 
                                  sum + (item.totalCost || (item.perUnitCost * item.quantity)), 0).toLocaleString()}
                              </td>
                            </tr>

                            {/* Final Summary */}
                            <tr className="border-t-2 border-gray-300 bg-gray-100 font-bold">
                              <td className="py-3 px-3" colSpan={3}>Total Project Cost</td>
                              <td className="py-3 px-3 text-right">${totalBudget.toLocaleString()}</td>
                            </tr>
                            <tr className="bg-yellow-100 font-semibold">
                              <td className="py-2 px-3" colSpan={3}>10% Buffer</td>
                              <td className="py-2 px-3 text-right">${buffer.toLocaleString()}</td>
                            </tr>
                            <tr className="bg-gray-200 font-bold text-lg">
                              <td className="py-3 px-3" colSpan={3}>Total with Buffer</td>
                              <td className="py-3 px-3 text-right">${(totalBudget + buffer).toLocaleString()}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Right Column - Timeline & Progress */}
                    <div className="space-y-6">
                      {/* Progress Summary */}
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Project Overview</h3>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Budget</p>
                            <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(totalBudget)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Spent</p>
                            <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(totalSpent)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Remaining</p>
                            <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(remaining)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Completion</p>
                            <p className="font-bold text-gray-900 dark:text-white">{completionPercentage.toFixed(1)}%</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Overall Progress</span>
                              <span>{completionPercentage.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${completionPercentage}%` }}
                              ></div>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Budget Spent</span>
                              <span>{spentPercentage.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  spentPercentage > 100 ? 'bg-red-600' : 
                                  spentPercentage > 85 ? 'bg-yellow-500' : 'bg-green-600'
                                }`}
                                style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Category Progress */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Progress</h3>
                        <div className="space-y-3">
                          {['exterior', 'kitchens', 'bathrooms', 'generalInterior', 'finishings'].map(category => {
                            const progress = getCategoryProgress(category);
                            const categoryNames: Record<string, string> = {
                              exterior: 'Exterior',
                              kitchens: 'Kitchens', 
                              bathrooms: 'Bathrooms',
                              generalInterior: 'General Interior',
                              finishings: 'Finishings'
                            };
                            
                            return (
                              <div key={category}>
                                <div className="flex justify-between text-sm mb-1">
                                  <span>{categoryNames[category]}</span>
                                  <span>{progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                  ></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Timeline/Workflow */}
                      {dealAnalyzerData.workflowSteps && (
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Timeline & Workflow</h3>
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {dealAnalyzerData.workflowSteps.map((step: any, index: number) => {
                              const statusIcons: Record<string, string> = {
                                'completed': '✓',
                                'in-progress': '⟳', 
                                'pending': '○',
                                'on-hold': '⏸'
                              };
                              
                              const statusColors: Record<string, string> = {
                                'completed': 'text-green-600',
                                'in-progress': 'text-blue-600',
                                'pending': 'text-gray-400',
                                'on-hold': 'text-orange-500'
                              };

                              return (
                                <div key={step.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                                  <div className={`font-bold text-lg ${statusColors[step.status]}`}>
                                    {statusIcons[step.status]}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                      <h4 className="font-medium text-gray-900">{step.name}</h4>
                                      <span className="text-xs text-gray-500 capitalize">{step.status.replace('-', ' ')}</span>
                                    </div>
                                    {step.budgetCategory && step.budgetItem && (
                                      <p className="text-xs text-blue-600">
                                        Linked to: {step.budgetCategory} → {step.budgetItem}
                                      </p>
                                    )}
                                    {step.notes && (
                                      <p className="text-sm text-gray-600 mt-1">{step.notes}</p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Modal Footer */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowRehabModal(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Property Detail Modal with Deal Analyzer Tabs */}
      {showPropertyDetailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-7xl w-full mx-4 max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Property Analysis - {showPropertyDetailModal.address}
              </h2>
              <div className="flex items-center space-x-3">
                {isEditing ? (
                  <>
                    <button
                      onClick={savePropertyChanges}
                      disabled={updatePropertyMutation.isPending}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updatePropertyMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        // Reset editing property to original values
                        setEditingModalProperty({ ...showPropertyDetailModal });
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Property
                  </button>
                )}
                <button
                  onClick={closeDetailModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
              <nav className="-mb-px flex space-x-8 overflow-x-auto">
                {[
                  { id: 'overview', name: 'Overview', icon: Building },
                  { id: 'rentroll', name: 'Rent Roll', icon: DollarSign },
                  { id: 'rehab', name: 'Rehab Budget', icon: Wrench },
                  { id: 'income-expenses', name: 'Income & Expenses', icon: Calculator },
                  { id: 'financing', name: 'Financing', icon: PieChart },
                  { id: 'sensitivity', name: 'Sensitivity', icon: BarChart3 },
                  { id: 'proforma', name: '12-Month Proforma', icon: Calendar },
                  { id: 'exit', name: 'Exit Analysis', icon: TrendingUp }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setPropertyDetailTab(tab.id)}
                      className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                        propertyDetailTab === tab.id
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {tab.name}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
              {(() => {
                let dealAnalyzerData = null;
                try {
                  // Prioritize editing state for real-time updates
                  const dataSource = isEditing && editingModalProperty?.dealAnalyzerData 
                    ? editingModalProperty.dealAnalyzerData 
                    : showPropertyDetailModal.dealAnalyzerData;
                  
                  dealAnalyzerData = dataSource ? JSON.parse(dataSource) : null;
                } catch (e) {
                  console.warn('Failed to parse dealAnalyzerData:', e);
                }

                switch (propertyDetailTab) {
                  case 'overview':
                    return (
                      <div className="grid lg:grid-cols-2 gap-8">
                        {/* Property Information */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-4">Property Information</h3>
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-blue-700 dark:text-blue-300">Address</p>
                                <p className="font-medium text-blue-900 dark:text-blue-200">{showPropertyDetailModal.address}</p>
                              </div>
                              <div>
                                <p className="text-sm text-blue-700 dark:text-blue-300">Entity</p>
                                <p className="font-medium text-blue-900 dark:text-blue-200">{showPropertyDetailModal.entity}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-blue-700 dark:text-blue-300">Units</p>
                                <p className="font-medium text-blue-900 dark:text-blue-200">{showPropertyDetailModal.apartments}</p>
                              </div>
                              <div>
                                <p className="text-sm text-blue-700 dark:text-blue-300">Status</p>
                                <p className="font-medium text-blue-900 dark:text-blue-200">{showPropertyDetailModal.status}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm text-blue-700 dark:text-blue-300">Acquisition Date</p>
                              <p className="font-medium text-blue-900 dark:text-blue-200">
                                {showPropertyDetailModal.acquisitionDate 
                                  ? new Date(showPropertyDetailModal.acquisitionDate).toLocaleDateString()
                                  : 'Not specified'
                                }
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Financial Summary */}
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
                          <h3 className="text-lg font-semibold text-green-900 dark:text-green-300 mb-4">Financial Summary</h3>
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-green-700 dark:text-green-300">Acquisition Price</p>
                                <p className="font-medium text-green-900 dark:text-green-200">{formatCurrency(showPropertyDetailModal.acquisitionPrice)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-green-700 dark:text-green-300">Rehab Costs</p>
                                <p className="font-medium text-green-900 dark:text-green-200">{formatCurrency(showPropertyDetailModal.rehabCosts)}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-green-700 dark:text-green-300">ARV</p>
                                <p className="font-medium text-green-900 dark:text-green-200">{formatCurrency(showPropertyDetailModal.arvAtTimePurchased || '0')}</p>
                              </div>
                              <div>
                                <p className="text-sm text-green-700 dark:text-green-300">Initial Capital</p>
                                <p className="font-medium text-green-900 dark:text-green-200">{formatCurrency(showPropertyDetailModal.initialCapitalRequired)}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-green-700 dark:text-green-300">Annual Cash Flow</p>
                                {(() => {
                                  // Use centralized calculations for consistency
                                  const calculations = getPropertyCalculations();
                                  console.log('Overview tab - Using centralized calculations:', calculations);
                                  
                                  if (calculations) {
                                    return (
                                      <p className={`font-medium ${calculations.annualCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatCurrency(calculations.annualCashFlow)}
                                      </p>
                                    );
                                  } else {
                                    // Fallback to stored value only if centralized calculation fails
                                    const fallbackCashFlow = parseFloat(showPropertyDetailModal.cashFlow || '0');
                                    return (
                                      <p className={`font-medium ${fallbackCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatCurrency(fallbackCashFlow)}
                                      </p>
                                    );
                                  }
                                })()}
                              </div>
                              <div>
                                <p className="text-sm text-green-700 dark:text-green-300">Cash-on-Cash Return</p>
                                {(() => {
                                  // Use centralized calculations for consistency
                                  const calculations = getPropertyCalculations();
                                  console.log('Overview tab Cash-on-Cash - Using centralized calculations:', calculations);
                                  
                                  if (calculations) {
                                    return (
                                      <p className={`font-medium ${calculations.cashOnCashReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatPercentage(calculations.cashOnCashReturn)}
                                      </p>
                                    );
                                  } else {
                                    // Fallback calculation only if centralized calculation fails
                                    const initialCapital = parseFloat(showPropertyDetailModal.initialCapitalRequired || '0');
                                    const annualCashFlow = parseFloat(showPropertyDetailModal.cashFlow || '0');
                                    const fallbackCOC = initialCapital > 0 ? (annualCashFlow / initialCapital) * 100 : 0;
                                    return (
                                      <p className={`font-medium ${fallbackCOC >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatPercentage(fallbackCOC)}
                                      </p>
                                    );
                                  }
                                })()}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Deal Analyzer Assumptions (if available) */}
                        {dealAnalyzerData?.assumptions && (
                          <div className="lg:col-span-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
                            <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-300 mb-4">Deal Assumptions</h3>
                            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                              <div>
                                <p className="text-sm text-purple-700 dark:text-purple-300">Loan Percentage</p>
                                <p className="font-medium text-purple-900 dark:text-purple-200">{formatPercentage(dealAnalyzerData.assumptions.loanPercentage * 100)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-purple-700 dark:text-purple-300">Interest Rate</p>
                                <p className="font-medium text-purple-900 dark:text-purple-200">{formatPercentage(dealAnalyzerData.assumptions.interestRate * 100)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-purple-700 dark:text-purple-300">Vacancy Rate</p>
                                <p className="font-medium text-purple-900 dark:text-purple-200">{formatPercentage(dealAnalyzerData.assumptions.vacancyRate * 100)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-purple-700 dark:text-purple-300">Market Cap Rate</p>
                                <p className="font-medium text-purple-900 dark:text-purple-200">{formatPercentage(dealAnalyzerData.assumptions.marketCapRate * 100)}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );

                  case 'rentroll':
                    return (
                      <div className="space-y-6">
                        {dealAnalyzerData?.unitTypes && dealAnalyzerData?.rentRoll ? (
                          <>
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                              <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300">Unit Types</h3>
                                {isEditing && (
                                  <button
                                    onClick={() => {
                                      const dealData = editingModalProperty?.dealAnalyzerData ? JSON.parse(editingModalProperty.dealAnalyzerData) : {};
                                      if (!dealData.unitTypes) dealData.unitTypes = [];
                                      dealData.unitTypes.push({
                                        id: Date.now().toString(),
                                        name: 'New Unit Type',
                                        marketRent: 0,
                                        sqft: 0
                                      });
                                      handlePropertyFieldChange('dealAnalyzerData', JSON.stringify(dealData));
                                    }}
                                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                                  >
                                    <Plus className="h-4 w-4 inline mr-1" />
                                    Add Unit Type
                                  </button>
                                )}
                              </div>
                              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {dealAnalyzerData.unitTypes.map((unitType: any, index: number) => (
                                  <div key={index} className="bg-white dark:bg-gray-700 rounded p-4 relative">
                                    {isEditing ? (
                                      <div className="space-y-2">
                                        <div className="flex justify-between items-start">
                                          <input
                                            type="text"
                                            value={unitType.name}
                                            onChange={(e) => {
                                              const dealData = editingModalProperty?.dealAnalyzerData ? JSON.parse(editingModalProperty.dealAnalyzerData) : {};
                                              dealData.unitTypes[index].name = e.target.value;
                                              handlePropertyFieldChange('dealAnalyzerData', JSON.stringify(dealData));
                                            }}
                                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm font-medium mr-2"
                                          />
                                          <button
                                            onClick={() => {
                                              const dealData = editingModalProperty?.dealAnalyzerData ? JSON.parse(editingModalProperty.dealAnalyzerData) : {};
                                              dealData.unitTypes.splice(index, 1);
                                              // Also remove any rent roll entries that reference this unit type
                                              if (dealData.rentRoll) {
                                                dealData.rentRoll = dealData.rentRoll.filter((unit: any) => unit.unitTypeId !== unitType.id);
                                              }
                                              handlePropertyFieldChange('dealAnalyzerData', JSON.stringify(dealData));
                                            }}
                                            className="text-red-600 hover:text-red-800 p-1"
                                            title="Delete unit type"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </button>
                                        </div>
                                        <div>
                                          <label className="text-xs text-gray-600 dark:text-gray-400">Market Rent:</label>
                                          <input
                                            type="number"
                                            value={unitType.marketRent || ''}
                                            onChange={(e) => {
                                              const dealData = editingModalProperty?.dealAnalyzerData ? JSON.parse(editingModalProperty.dealAnalyzerData) : {};
                                              const newMarketRent = parseFloat(e.target.value) || 0;
                                              dealData.unitTypes[index].marketRent = newMarketRent;
                                              
                                              // Update market rent in rent roll for units of this type
                                              if (dealData.rentRoll) {
                                                dealData.rentRoll.forEach((unit: any) => {
                                                  if (unit.unitTypeId === unitType.id) {
                                                    // Update the market rent reference in rent roll if needed
                                                  }
                                                });
                                              }
                                              
                                              handlePropertyFieldChange('dealAnalyzerData', JSON.stringify(dealData));
                                            }}
                                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                            placeholder="Enter market rent"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-xs text-gray-600 dark:text-gray-400">Square Feet:</label>
                                          <input
                                            type="number"
                                            value={unitType.sqft || ''}
                                            onChange={(e) => {
                                              const dealData = editingModalProperty?.dealAnalyzerData ? JSON.parse(editingModalProperty.dealAnalyzerData) : {};
                                              dealData.unitTypes[index].sqft = parseFloat(e.target.value) || 0;
                                              handlePropertyFieldChange('dealAnalyzerData', JSON.stringify(dealData));
                                            }}
                                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                            placeholder="Enter square feet"
                                          />
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <h4 className="font-medium text-gray-900 dark:text-white">{unitType.name}</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Market Rent: {formatCurrency(unitType.marketRent || 0)}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Square Feet: {unitType.sqft || 0}</p>
                                      </>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
                              <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-green-900 dark:text-green-300">Current Rent Roll</h3>
                                {isEditing && (
                                  <button
                                    onClick={() => {
                                      const dealData = editingModalProperty?.dealAnalyzerData ? JSON.parse(editingModalProperty.dealAnalyzerData) : {};
                                      if (!dealData.rentRoll) dealData.rentRoll = [];
                                      dealData.rentRoll.push({
                                        unitNumber: `${dealData.rentRoll.length + 1}`,
                                        unitTypeId: dealData.unitTypes[0]?.id || '',
                                        proFormaRent: 0,
                                        tenantName: '',
                                        leaseFrom: '',
                                        leaseTo: ''
                                      });
                                      handlePropertyFieldChange('dealAnalyzerData', JSON.stringify(dealData));
                                    }}
                                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                  >
                                    <Plus className="h-4 w-4 inline mr-1" />
                                    Add Unit
                                  </button>
                                )}
                              </div>
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-green-200 dark:divide-green-700">
                                  <thead>
                                    <tr>
                                      <th className="px-4 py-2 text-left text-sm font-medium text-green-700 dark:text-green-300">Unit</th>
                                      <th className="px-4 py-2 text-left text-sm font-medium text-green-700 dark:text-green-300">Type</th>
                                      <th className="px-4 py-2 text-left text-sm font-medium text-green-700 dark:text-green-300">Tenant</th>
                                      <th className="px-4 py-2 text-left text-sm font-medium text-green-700 dark:text-green-300">Lease Start</th>
                                      <th className="px-4 py-2 text-left text-sm font-medium text-green-700 dark:text-green-300">Lease End</th>
                                      <th className="px-4 py-2 text-left text-sm font-medium text-green-700 dark:text-green-300">Current Rent</th>
                                      <th className="px-4 py-2 text-left text-sm font-medium text-green-700 dark:text-green-300">Market Rent</th>
                                      <th className="px-4 py-2 text-left text-sm font-medium text-green-700 dark:text-green-300">Upside</th>
                                      {isEditing && <th className="px-4 py-2 text-left text-sm font-medium text-green-700 dark:text-green-300">Actions</th>}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-green-200 dark:divide-green-700">
                                    {dealAnalyzerData.rentRoll.map((unit: any, index: number) => {
                                      // Get the latest unit type data from the editing state
                                      const currentDealData = editingModalProperty?.dealAnalyzerData ? JSON.parse(editingModalProperty.dealAnalyzerData) : dealAnalyzerData;
                                      const unitType = currentDealData.unitTypes.find((ut: any) => ut.id === unit.unitTypeId);
                                      const marketRent = unitType?.marketRent || 0;
                                      const currentRent = unit.proFormaRent || 0;
                                      const upside = marketRent - currentRent;
                                      
                                      return (
                                        <tr key={index}>
                                          <td className="px-4 py-2 text-sm text-green-900 dark:text-green-200">
                                            {isEditing ? (
                                              <input
                                                type="text"
                                                value={unit.unitNumber}
                                                onChange={(e) => {
                                                  const dealData = editingModalProperty?.dealAnalyzerData ? JSON.parse(editingModalProperty.dealAnalyzerData) : {};
                                                  dealData.rentRoll[index].unitNumber = e.target.value;
                                                  handlePropertyFieldChange('dealAnalyzerData', JSON.stringify(dealData));
                                                }}
                                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                placeholder="Unit number"
                                              />
                                            ) : (
                                              `Unit ${unit.unitNumber}`
                                            )}
                                          </td>
                                          <td className="px-4 py-2 text-sm text-green-900 dark:text-green-200">
                                            {isEditing ? (
                                              <select
                                                value={unit.unitTypeId || ''}
                                                onChange={(e) => {
                                                  const dealData = editingModalProperty?.dealAnalyzerData ? JSON.parse(editingModalProperty.dealAnalyzerData) : {};
                                                  dealData.rentRoll[index].unitTypeId = e.target.value;
                                                  handlePropertyFieldChange('dealAnalyzerData', JSON.stringify(dealData));
                                                }}
                                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                              >
                                                <option value="">Select unit type</option>
                                                {currentDealData.unitTypes.map((ut: any) => (
                                                  <option key={ut.id} value={ut.id}>{ut.name}</option>
                                                ))}
                                              </select>
                                            ) : (
                                              unitType?.name || 'Unknown'
                                            )}
                                          </td>
                                          <td className="px-4 py-2 text-sm text-green-900 dark:text-green-200">
                                            {isEditing ? (
                                              <input
                                                type="text"
                                                value={unit.tenantName || ''}
                                                onChange={(e) => {
                                                  const dealData = editingModalProperty?.dealAnalyzerData ? JSON.parse(editingModalProperty.dealAnalyzerData) : {};
                                                  dealData.rentRoll[index].tenantName = e.target.value;
                                                  handlePropertyFieldChange('dealAnalyzerData', JSON.stringify(dealData));
                                                }}
                                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                placeholder="Tenant name"
                                              />
                                            ) : (
                                              unit.tenantName || 'Vacant'
                                            )}
                                          </td>
                                          <td className="px-4 py-2 text-sm text-green-900 dark:text-green-200">
                                            {isEditing ? (
                                              <input
                                                type="date"
                                                value={unit.leaseFrom || ''}
                                                onChange={(e) => {
                                                  const dealData = editingModalProperty?.dealAnalyzerData ? JSON.parse(editingModalProperty.dealAnalyzerData) : {};
                                                  dealData.rentRoll[index].leaseFrom = e.target.value;
                                                  handlePropertyFieldChange('dealAnalyzerData', JSON.stringify(dealData));
                                                }}
                                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                              />
                                            ) : (
                                              unit.leaseFrom || '-'
                                            )}
                                          </td>
                                          <td className="px-4 py-2 text-sm text-green-900 dark:text-green-200">
                                            {isEditing ? (
                                              <input
                                                type="date"
                                                value={unit.leaseTo || ''}
                                                onChange={(e) => {
                                                  const dealData = editingModalProperty?.dealAnalyzerData ? JSON.parse(editingModalProperty.dealAnalyzerData) : {};
                                                  dealData.rentRoll[index].leaseTo = e.target.value;
                                                  handlePropertyFieldChange('dealAnalyzerData', JSON.stringify(dealData));
                                                }}
                                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                              />
                                            ) : (
                                              unit.leaseTo || '-'
                                            )}
                                          </td>
                                          <td className="px-4 py-2 text-sm text-green-900 dark:text-green-200">
                                            {isEditing ? (
                                              <input
                                                type="number"
                                                value={unit.proFormaRent || ''}
                                                onChange={(e) => {
                                                  const dealData = editingModalProperty?.dealAnalyzerData ? JSON.parse(editingModalProperty.dealAnalyzerData) : {};
                                                  dealData.rentRoll[index].proFormaRent = parseFloat(e.target.value) || 0;
                                                  handlePropertyFieldChange('dealAnalyzerData', JSON.stringify(dealData));
                                                }}
                                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                placeholder="Current rent"
                                              />
                                            ) : (
                                              formatCurrency(currentRent)
                                            )}
                                          </td>
                                          <td className="px-4 py-2 text-sm text-green-900 dark:text-green-200">
                                            {formatCurrency(marketRent)}
                                          </td>
                                          <td className={`px-4 py-2 text-sm font-medium ${upside >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {upside >= 0 ? '+' : ''}{formatCurrency(upside)}
                                          </td>
                                          {isEditing && (
                                            <td className="px-4 py-2">
                                              <button
                                                onClick={() => {
                                                  const dealData = editingModalProperty?.dealAnalyzerData ? JSON.parse(editingModalProperty.dealAnalyzerData) : {};
                                                  dealData.rentRoll.splice(index, 1);
                                                  handlePropertyFieldChange('dealAnalyzerData', JSON.stringify(dealData));
                                                }}
                                                className="text-red-600 hover:text-red-800"
                                                title="Delete unit"
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </button>
                                            </td>
                                          )}
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-12">
                            <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No Rent Roll Data</h3>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Rent roll information was not imported with this property</p>
                          </div>
                        )}
                      </div>
                    );

                  case 'rehab':
                    return (
                      <div className="space-y-6">
                        {dealAnalyzerData?.rehabBudgetSections ? (
                          <>
                            {['exterior', 'kitchens', 'bathrooms', 'generalInterior', 'finishings'].map(sectionKey => {
                              const section = dealAnalyzerData.rehabBudgetSections[sectionKey];
                              if (!section || section.length === 0) return null;
                              
                              const sectionNames: Record<string, string> = {
                                exterior: 'Exterior',
                                kitchens: 'Kitchens',
                                bathrooms: 'Bathrooms',
                                generalInterior: 'General Interior',
                                finishings: 'Finishings'
                              };
                              
                              return (
                                <div key={sectionKey} className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-6 border border-orange-200 dark:border-orange-800">
                                  <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-300">{sectionNames[sectionKey]}</h3>
                                    {isEditing && (
                                      <button
                                        onClick={() => {
                                          const dealData = editingModalProperty?.dealAnalyzerData ? JSON.parse(editingModalProperty.dealAnalyzerData) : {};
                                          if (!dealData.rehabBudgetSections) dealData.rehabBudgetSections = {};
                                          if (!dealData.rehabBudgetSections[sectionKey]) dealData.rehabBudgetSections[sectionKey] = [];
                                          dealData.rehabBudgetSections[sectionKey].push({
                                            category: 'New Item',
                                            perUnitCost: 0,
                                            quantity: 1,
                                            totalCost: 0,
                                            spentAmount: 0,
                                            completed: false
                                          });
                                          handlePropertyFieldChange('dealAnalyzerData', JSON.stringify(dealData));
                                        }}
                                        className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
                                      >
                                        <Plus className="h-4 w-4 inline mr-1" />
                                        Add Item
                                      </button>
                                    )}
                                  </div>
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-orange-200 dark:divide-orange-700">
                                      <thead>
                                        <tr>
                                          <th className="px-4 py-2 text-left text-sm font-medium text-orange-700 dark:text-orange-300">Item</th>
                                          <th className="px-4 py-2 text-left text-sm font-medium text-orange-700 dark:text-orange-300">Budget</th>
                                          <th className="px-4 py-2 text-left text-sm font-medium text-orange-700 dark:text-orange-300">Spent</th>
                                          <th className="px-4 py-2 text-left text-sm font-medium text-orange-700 dark:text-orange-300">Remaining</th>
                                          <th className="px-4 py-2 text-left text-sm font-medium text-orange-700 dark:text-orange-300">Status</th>
                                          {isEditing && <th className="px-4 py-2 text-left text-sm font-medium text-orange-700 dark:text-orange-300">Actions</th>}
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-orange-200 dark:divide-orange-700">
                                        {section.map((item: any, index: number) => {
                                          const totalBudget = item.totalCost || (item.perUnitCost * item.quantity);
                                          const spentAmount = item.spentAmount || 0;
                                          const remaining = totalBudget - spentAmount;
                                          return (
                                            <tr key={index}>
                                              <td className="px-4 py-2 text-sm text-orange-900 dark:text-orange-200">
                                                {isEditing ? (
                                                  <input
                                                    type="text"
                                                    value={item.category}
                                                    onChange={(e) => {
                                                      const dealData = editingModalProperty?.dealAnalyzerData ? JSON.parse(editingModalProperty.dealAnalyzerData) : {};
                                                      dealData.rehabBudgetSections[sectionKey][index].category = e.target.value;
                                                      handlePropertyFieldChange('dealAnalyzerData', JSON.stringify(dealData));
                                                    }}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                  />
                                                ) : (
                                                  item.category
                                                )}
                                              </td>
                                              <td className="px-4 py-2 text-sm text-orange-900 dark:text-orange-200">
                                                {isEditing ? (
                                                  <input
                                                    type="number"
                                                    value={totalBudget}
                                                    onChange={(e) => {
                                                      const dealData = editingModalProperty?.dealAnalyzerData ? JSON.parse(editingModalProperty.dealAnalyzerData) : {};
                                                      const newBudget = parseFloat(e.target.value) || 0;
                                                      dealData.rehabBudgetSections[sectionKey][index].totalCost = newBudget;
                                                      dealData.rehabBudgetSections[sectionKey][index].perUnitCost = newBudget;
                                                      dealData.rehabBudgetSections[sectionKey][index].quantity = 1;
                                                      handlePropertyFieldChange('dealAnalyzerData', JSON.stringify(dealData));
                                                    }}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                  />
                                                ) : (
                                                  formatCurrency(totalBudget)
                                                )}
                                              </td>
                                              <td className="px-4 py-2 text-sm text-orange-900 dark:text-orange-200">
                                                {isEditing ? (
                                                  <input
                                                    type="number"
                                                    value={spentAmount}
                                                    onChange={(e) => {
                                                      const dealData = editingModalProperty?.dealAnalyzerData ? JSON.parse(editingModalProperty.dealAnalyzerData) : {};
                                                      dealData.rehabBudgetSections[sectionKey][index].spentAmount = parseFloat(e.target.value) || 0;
                                                      handlePropertyFieldChange('dealAnalyzerData', JSON.stringify(dealData));
                                                    }}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                  />
                                                ) : (
                                                  formatCurrency(spentAmount)
                                                )}
                                              </td>
                                              <td className={`px-4 py-2 text-sm font-medium ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {formatCurrency(remaining)}
                                              </td>
                                              <td className="px-4 py-2">
                                                {isEditing ? (
                                                  <select
                                                    value={item.completed ? 'completed' : 'in-progress'}
                                                    onChange={(e) => {
                                                      const dealData = editingModalProperty?.dealAnalyzerData ? JSON.parse(editingModalProperty.dealAnalyzerData) : {};
                                                      dealData.rehabBudgetSections[sectionKey][index].completed = e.target.value === 'completed';
                                                      handlePropertyFieldChange('dealAnalyzerData', JSON.stringify(dealData));
                                                    }}
                                                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                                                  >
                                                    <option value="in-progress">In Progress</option>
                                                    <option value="completed">Completed</option>
                                                  </select>
                                                ) : (
                                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                    item.completed 
                                                      ? 'bg-green-100 text-green-800' 
                                                      : 'bg-yellow-100 text-yellow-800'
                                                  }`}>
                                                    {item.completed ? 'Completed' : 'In Progress'}
                                                  </span>
                                                )}
                                              </td>
                                              {isEditing && (
                                                <td className="px-4 py-2">
                                                  <button
                                                    onClick={() => {
                                                      const dealData = editingModalProperty?.dealAnalyzerData ? JSON.parse(editingModalProperty.dealAnalyzerData) : {};
                                                      dealData.rehabBudgetSections[sectionKey].splice(index, 1);
                                                      handlePropertyFieldChange('dealAnalyzerData', JSON.stringify(dealData));
                                                    }}
                                                    className="text-red-600 hover:text-red-800"
                                                  >
                                                    <Trash2 className="h-4 w-4" />
                                                  </button>
                                                </td>
                                              )}
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              );
                            })}
                            
                            {/* Enhanced Rehab Summary with Progress Tracking */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Rehab Budget Summary & Progress</h3>
                              {(() => {
                                const allItems = Object.values(dealAnalyzerData.rehabBudgetSections).flat();
                                const totalBudget = allItems.reduce((sum: number, item: any) => sum + (item.totalCost || (item.perUnitCost * item.quantity)), 0);
                                const totalSpent = allItems.reduce((sum: number, item: any) => sum + (item.spentAmount || 0), 0);
                                const completedItems = allItems.filter((item: any) => item.completed).length;
                                const completionPercentage = allItems.length > 0 ? (completedItems / allItems.length) * 100 : 0;
                                const spentPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
                                
                                return (
                                  <>
                                    <div className="grid md:grid-cols-4 gap-4 mb-6">
                                      <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Budget</p>
                                        <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(totalBudget)}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Spent</p>
                                        <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(totalSpent)}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Remaining</p>
                                        <p className={`font-medium ${(totalBudget - totalSpent) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                          {formatCurrency(totalBudget - totalSpent)}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Items Completed</p>
                                        <p className="font-medium text-gray-900 dark:text-white">{completedItems}/{allItems.length}</p>
                                      </div>
                                    </div>
                                    
                                    <div className="grid md:grid-cols-2 gap-4">
                                      <div>
                                        <div className="flex justify-between text-sm mb-1">
                                          <span className="text-gray-600 dark:text-gray-400">Project Completion</span>
                                          <span className="font-semibold text-gray-900 dark:text-white">{completionPercentage.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                                          <div className="bg-blue-600 h-3 rounded-full" style={{ width: `${completionPercentage}%` }}></div>
                                        </div>
                                      </div>
                                      <div>
                                        <div className="flex justify-between text-sm mb-1">
                                          <span className="text-gray-600 dark:text-gray-400">Budget Utilized</span>
                                          <span className="font-semibold text-gray-900 dark:text-white">{spentPercentage.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                                          <div 
                                            className={`h-3 rounded-full ${
                                              spentPercentage > 100 ? 'bg-red-600' :
                                              spentPercentage > 90 ? 'bg-yellow-600' : 'bg-green-600'
                                            }`}
                                            style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                                          ></div>
                                        </div>
                                      </div>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-12">
                            <Wrench className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No Rehab Budget Data</h3>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Detailed rehab budget was not imported with this property</p>
                          </div>
                        )}
                      </div>
                    );

                  case 'income-expenses':
                    return (
                      <div className="space-y-6">
                        {/* Financial Breakdown - Deal Analyzer Style */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Financial Breakdown</h3>
                          
                          {(() => {
                            // Use centralized calculations for consistency
                            const calculations = getPropertyCalculations();
                            console.log('Income & Expenses - Using centralized calculations:', calculations);
                            
                            if (!calculations) return null;
                            
                            // Get the original expenses data for editing purposes
                            const propertyData = editingModalProperty?.dealAnalyzerData ? JSON.parse(editingModalProperty.dealAnalyzerData) : {};
                            const expenses = propertyData?.expenses || {};
                            
                            return (
                              <div className="grid lg:grid-cols-2 gap-8">
                                {/* Revenue Section */}
                                <div className="space-y-4">
                                  <h4 className="text-lg font-semibold text-green-700 dark:text-green-300 border-b border-green-200 pb-2">Revenue</h4>
                                  
                                  <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-700 dark:text-gray-300">Gross Rent (Annual)</span>
                                      {isEditing ? (
                                        <input
                                          type="number"
                                          value={calculations.grossRentAnnual}
                                          className="w-32 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                                          readOnly
                                        />
                                      ) : (
                                        <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(calculations.grossRentAnnual)}</span>
                                      )}
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-700 dark:text-gray-300">Vacancy Loss (5.0%)</span>
                                      <span className="font-medium text-red-600">-{formatCurrency(calculations.vacancyAnnual)}</span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                      <span className="font-semibold text-gray-900 dark:text-white">Net Revenue</span>
                                      <span className="font-bold text-green-600">{formatCurrency(calculations.netRevenueAnnual)}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Expenses Section */}
                                <div className="space-y-4">
                                  <h4 className="text-lg font-semibold text-red-700 dark:text-red-300 border-b border-red-200 pb-2">Expenses</h4>
                                  
                                  <div className="space-y-3">
                                    {[
                                      { key: 'taxes', label: 'Property Tax', value: expenses.taxes || 15000 },
                                      { key: 'insurance', label: 'Insurance', value: expenses.insurance || 14500 },
                                      { key: 'maintenance', label: 'Maintenance', value: expenses.maintenance || 8000 },
                                      { key: 'waterSewerTrash', label: 'Water/Sewer/Trash', value: expenses.waterSewerTrash || 6000 },
                                      { key: 'capex', label: 'Capital Reserves', value: expenses.capex || 2000 },
                                      { key: 'utilities', label: 'Utilities', value: expenses.utilities || 6000 },
                                      { key: 'other', label: 'Other', value: expenses.other || 0 }
                                    ].map((item) => (
                                      <div key={item.key} className="flex justify-between items-center">
                                        <span className="text-gray-700 dark:text-gray-300">{item.label}</span>
                                        {isEditing ? (
                                          <input
                                            type="number"
                                            value={item.value}
                                            onChange={(e) => {
                                              const dealData = editingModalProperty?.dealAnalyzerData ? JSON.parse(editingModalProperty.dealAnalyzerData) : {};
                                              if (!dealData.expenses) dealData.expenses = {};
                                              dealData.expenses[item.key] = parseFloat(e.target.value) || 0;
                                              handlePropertyFieldChange('dealAnalyzerData', JSON.stringify(dealData));
                                            }}
                                            className="w-32 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                                          />
                                        ) : (
                                          <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(item.value)}</span>
                                        )}
                                      </div>
                                    ))}
                                    
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-700 dark:text-gray-300">Management Fee (8%)</span>
                                      <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(calculations.netRevenueAnnual * 0.08)}</span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                      <span className="font-semibold text-gray-900 dark:text-white">Total Expenses</span>
                                      <span className="font-bold text-red-600">{formatCurrency(calculations.totalExpensesAnnual)}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* NOI and Cash Flow Summary */}
                                <div className="lg:col-span-2 mt-6 pt-6 border-t border-gray-200">
                                  <div className="grid md:grid-cols-3 gap-6">
                                    <div className="text-center">
                                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Net Operating Income (NOI)</p>
                                      <p className={`text-2xl font-bold ${calculations.noiAnnual >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(calculations.noiAnnual)}</p>
                                    </div>
                                    
                                    <div className="text-center">
                                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Monthly Debt Service</p>
                                      <p className="text-2xl font-bold text-orange-600">-{formatCurrency(calculations.monthlyDebtService)}</p>
                                    </div>
                                    
                                    <div className="text-center">
                                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Net Cash Flow (Monthly)</p>
                                      <p className={`text-2xl font-bold ${calculations.monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(calculations.monthlyCashFlow)}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );

                  case 'sensitivity':
                    return (
                      <div className="space-y-6">
                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
                          <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-300 mb-4">Sensitivity Analysis</h3>
                          <div className="grid md:grid-cols-2 gap-6">
                            {/* Key Variables */}
                            <div>
                              <h4 className="font-medium text-purple-900 dark:text-purple-300 mb-3">Key Variables</h4>
                              <div className="space-y-3">
                                {[
                                  { key: 'rentIncrease', label: 'Annual Rent Increase %', value: dealAnalyzerData?.sensitivity?.rentIncrease || 3, min: 0, max: 10, step: 0.5 },
                                  { key: 'expenseIncrease', label: 'Annual Expense Increase %', value: dealAnalyzerData?.sensitivity?.expenseIncrease || 3, min: 0, max: 10, step: 0.5 },
                                  { key: 'vacancyRate', label: 'Vacancy Rate %', value: dealAnalyzerData?.sensitivity?.vacancyRate || 5, min: 0, max: 20, step: 1 },
                                  { key: 'exitCapRate', label: 'Exit Cap Rate %', value: dealAnalyzerData?.sensitivity?.exitCapRate || 6, min: 3, max: 12, step: 0.25 }
                                ].map((item) => (
                                  <div key={item.key} className="flex justify-between items-center">
                                    <span className="text-sm text-purple-700 dark:text-purple-300">{item.label}</span>
                                    {isEditing ? (
                                      <input
                                        type="number"
                                        min={item.min}
                                        max={item.max}
                                        step={item.step}
                                        value={item.value}
                                        onChange={(e) => {
                                          const dealData = editingModalProperty?.dealAnalyzerData ? JSON.parse(editingModalProperty.dealAnalyzerData) : {};
                                          if (!dealData.sensitivity) dealData.sensitivity = {};
                                          dealData.sensitivity[item.key] = parseFloat(e.target.value) || 0;
                                          handlePropertyFieldChange('dealAnalyzerData', JSON.stringify(dealData));
                                        }}
                                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                                      />
                                    ) : (
                                      <span className="font-medium text-purple-900 dark:text-purple-200">{item.value}%</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Scenario Analysis */}
                            <div>
                              <h4 className="font-medium text-purple-900 dark:text-purple-300 mb-3">Scenario Analysis</h4>
                              <div className="space-y-3">
                                {[
                                  { scenario: 'Conservative', rentIncrease: 2, expenseIncrease: 4, vacancy: 8 },
                                  { scenario: 'Base Case', rentIncrease: 3, expenseIncrease: 3, vacancy: 5 },
                                  { scenario: 'Optimistic', rentIncrease: 4, expenseIncrease: 2, vacancy: 3 }
                                ].map((scenario) => {
                                  const currentRent = dealAnalyzerData?.rentRoll?.reduce((sum: number, unit: any) => sum + unit.proFormaRent, 0) * 12 || 0;
                                  const currentExpenses = Object.values(dealAnalyzerData?.expenses || {}).reduce((sum: number, val: any) => sum + (val || 0), 0);
                                  const adjustedRent = currentRent * (1 + scenario.rentIncrease / 100);
                                  const adjustedExpenses = currentExpenses * (1 + scenario.expenseIncrease / 100);
                                  const vacancyLoss = adjustedRent * (scenario.vacancy / 100);
                                  const netIncome = adjustedRent - vacancyLoss - adjustedExpenses;
                                  
                                  return (
                                    <div key={scenario.scenario} className="bg-white dark:bg-gray-700 rounded p-3">
                                      <h5 className="font-medium text-gray-900 dark:text-white">{scenario.scenario}</h5>
                                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        <p>Rent: +{scenario.rentIncrease}% | Expenses: +{scenario.expenseIncrease}% | Vacancy: {scenario.vacancy}%</p>
                                        <p className={`font-medium ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                          Net Income: {formatCurrency(netIncome)}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );

                  case 'proforma':
                    return (
                      <div className="space-y-6">
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-6 border border-indigo-200 dark:border-indigo-800">
                          <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-300 mb-4">12-Month Pro Forma</h3>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-indigo-200 dark:divide-indigo-700">
                              <thead>
                                <tr>
                                  <th className="px-4 py-2 text-left text-sm font-medium text-indigo-700 dark:text-indigo-300">Month</th>
                                  <th className="px-4 py-2 text-left text-sm font-medium text-indigo-700 dark:text-indigo-300">Gross Income</th>
                                  <th className="px-4 py-2 text-left text-sm font-medium text-indigo-700 dark:text-indigo-300">Vacancy</th>
                                  <th className="px-4 py-2 text-left text-sm font-medium text-indigo-700 dark:text-indigo-300">Net Income</th>
                                  <th className="px-4 py-2 text-left text-sm font-medium text-indigo-700 dark:text-indigo-300">Expenses</th>
                                  <th className="px-4 py-2 text-left text-sm font-medium text-indigo-700 dark:text-indigo-300">NOI</th>
                                  <th className="px-4 py-2 text-left text-sm font-medium text-indigo-700 dark:text-indigo-300">Debt Service</th>
                                  <th className="px-4 py-2 text-left text-sm font-medium text-indigo-700 dark:text-indigo-300">Cash Flow</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-indigo-200 dark:divide-indigo-700">
                                {Array.from({ length: 12 }, (_, index) => {
                                  const month = index + 1;
                                  
                                  // Use centralized calculations for consistency
                                  const calculations = getPropertyCalculations();
                                  if (!calculations) return null;
                                  
                                  return (
                                    <tr key={month} className={month % 2 === 0 ? 'bg-indigo-25 dark:bg-indigo-900/10' : ''}>
                                      <td className="px-4 py-2 text-sm text-indigo-900 dark:text-indigo-200">Month {month}</td>
                                      <td className="px-4 py-2 text-sm text-indigo-900 dark:text-indigo-200">{formatCurrency(calculations.grossRentMonthly)}</td>
                                      <td className="px-4 py-2 text-sm text-red-600">({formatCurrency(calculations.vacancy)})</td>
                                      <td className="px-4 py-2 text-sm text-indigo-900 dark:text-indigo-200">{formatCurrency(calculations.netRevenue)}</td>
                                      <td className="px-4 py-2 text-sm text-red-600">({formatCurrency(calculations.totalExpenses)})</td>
                                      <td className="px-4 py-2 text-sm font-medium text-indigo-900 dark:text-indigo-200">{formatCurrency(calculations.noi)}</td>
                                      <td className="px-4 py-2 text-sm text-red-600">({formatCurrency(calculations.monthlyDebtService)})</td>
                                      <td className={`px-4 py-2 text-sm font-medium ${calculations.monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatCurrency(calculations.monthlyCashFlow)}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                              <tfoot className="bg-indigo-100 dark:bg-indigo-900/30">
                                <tr>
                                  <td className="px-4 py-2 text-sm font-bold text-indigo-900 dark:text-indigo-200">Annual Total</td>
                                  {(() => {
                                    // Use centralized calculations for annual totals
                                    const calculations = getPropertyCalculations();
                                    if (!calculations) return null;
                                    
                                    return (
                                      <>
                                        <td className="px-4 py-2 text-sm font-bold text-indigo-900 dark:text-indigo-200">
                                          {formatCurrency(calculations.grossRentAnnual)}
                                        </td>
                                        <td className="px-4 py-2 text-sm font-bold text-red-600">
                                          ({formatCurrency(calculations.vacancyAnnual)})
                                        </td>
                                        <td className="px-4 py-2 text-sm font-bold text-indigo-900 dark:text-indigo-200">
                                          {formatCurrency(calculations.netRevenueAnnual)}
                                        </td>
                                        <td className="px-4 py-2 text-sm font-bold text-red-600">
                                          ({formatCurrency(calculations.totalExpensesAnnual)})
                                        </td>
                                        <td className="px-4 py-2 text-sm font-bold text-indigo-900 dark:text-indigo-200">
                                          {formatCurrency(calculations.noiAnnual)}
                                        </td>
                                        <td className="px-4 py-2 text-sm font-bold text-red-600">
                                          ({formatCurrency(calculations.annualDebtService)})
                                        </td>
                                        <td className={`px-4 py-2 text-sm font-bold ${calculations.annualCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                          {formatCurrency(calculations.annualCashFlow)}
                                        </td>
                                      </>
                                    );
                                  })()}
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      </div>
                    );

                  case 'financing':
                    return (
                      <div className="space-y-6">
                        {dealAnalyzerData?.assumptions ? (
                          <>
                            {/* Loan Management Header */}
                            <div className="flex justify-between items-center">
                              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Property Financing</h2>
                              {isEditing && (
                                <button
                                  onClick={() => {
                                    const dealData = editingModalProperty?.dealAnalyzerData ? JSON.parse(editingModalProperty.dealAnalyzerData) : {};
                                    if (!dealData.loans) dealData.loans = [];
                                    
                                    const loanAmount = 0;
                                    const interestRate = 0.065;
                                    const termYears = 30;
                                    const paymentType = 'amortizing';
                                    
                                    // Calculate monthly payment for new loan
                                    const monthlyPayment = calculateLoanPayment(loanAmount, interestRate, termYears, paymentType);
                                    
                                    const newLoan = {
                                      id: Date.now(),
                                      name: `Loan ${dealData.loans.length + 1}`,
                                      amount: loanAmount,
                                      loanAmount: loanAmount, // Add this for consistency
                                      interestRate: interestRate,
                                      termYears: termYears,
                                      monthlyPayment: monthlyPayment,
                                      isActive: dealData.loans.length === 0, // First loan is active by default
                                      loanType: 'refinance',
                                      paymentType: paymentType,
                                      startDate: new Date().toISOString().split('T')[0],
                                      remainingBalance: loanAmount
                                    };
                                    
                                    dealData.loans.push(newLoan);
                                    handlePropertyFieldChange('dealAnalyzerData', JSON.stringify(dealData));
                                  }}
                                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Loan
                                </button>
                              )}
                            </div>

                            {/* Existing Loans */}
                            {(() => {
                              const loans = getModalLoanData();
                              console.log('Financing tab - Using centralized loan data:', loans);

                              return loans.map((loan: any) => (
                                <div key={loan.id} className={`bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-6 border-2 ${loan.isActive ? 'border-indigo-500' : 'border-indigo-200 dark:border-indigo-800'}`}>
                                  <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center space-x-3">
                                      <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-300">
                                        {isEditing ? (
                                          <input
                                            type="text"
                                            value={loan.name}
                                            onChange={(e) => {
                                              const dealData = editingModalProperty?.dealAnalyzerData ? JSON.parse(editingModalProperty.dealAnalyzerData) : {};
                                              if (!dealData.loans) dealData.loans = [];
                                              const loanIndex = dealData.loans.findIndex((l: any) => l.id === loan.id);
                                              if (loanIndex >= 0) {
                                                dealData.loans[loanIndex].name = e.target.value;
                                                handlePropertyFieldChange('dealAnalyzerData', JSON.stringify(dealData));
                                              }
                                            }}
                                            className="bg-transparent border-b border-indigo-300 text-indigo-900 dark:text-indigo-300 font-semibold"
                                          />
                                        ) : (
                                          loan.name
                                        )}
                                      </h3>
                                      {loan.isActive && (
                                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                          Active
                                        </span>
                                      )}
                                    </div>
                                    
                                    {isEditing && (
                                      <div className="flex items-center space-x-2">
                                        <button
                                          onClick={() => {
                                            const dealData = editingModalProperty?.dealAnalyzerData ? JSON.parse(editingModalProperty.dealAnalyzerData) : {};
                                            if (!dealData.loans) dealData.loans = [];
                                            
                                            // Set all loans to inactive, then activate this one
                                            dealData.loans.forEach((l: any) => { l.isActive = false; });
                                            const loanIndex = dealData.loans.findIndex((l: any) => l.id === loan.id);
                                            if (loanIndex >= 0) {
                                              dealData.loans[loanIndex].isActive = true;
                                            }
                                            handlePropertyFieldChange('dealAnalyzerData', JSON.stringify(dealData));
                                          }}
                                          className={`px-3 py-1 text-xs rounded ${loan.isActive ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-green-100'}`}
                                          title="Set as active loan for debt service calculations"
                                        >
                                          {loan.isActive ? 'Active' : 'Set Active'}
                                        </button>
                                        
                                        {loans.length > 1 && (
                                          <button
                                            onClick={() => {
                                              const dealData = editingModalProperty?.dealAnalyzerData ? JSON.parse(editingModalProperty.dealAnalyzerData) : {};
                                              if (!dealData.loans) dealData.loans = [];
                                              dealData.loans = dealData.loans.filter((l: any) => l.id !== loan.id);
                                              
                                              // If we deleted the active loan, make the first remaining loan active
                                              if (loan.isActive && dealData.loans.length > 0) {
                                                dealData.loans[0].isActive = true;
                                              }
                                              
                                              handlePropertyFieldChange('dealAnalyzerData', JSON.stringify(dealData));
                                            }}
                                            className="text-red-600 hover:text-red-800"
                                            title="Delete loan"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  <div className="grid md:grid-cols-3 gap-6">
                                    <div className="space-y-3">
                                      <div>
                                        <p className="text-sm text-indigo-700 dark:text-indigo-300">Loan Amount</p>
                                        {isEditing ? (
                                          <input
                                            type="number"
                                            value={loan.amount}
                                            onChange={(e) => {
                                              const dealData = editingModalProperty?.dealAnalyzerData ? JSON.parse(editingModalProperty.dealAnalyzerData) : {};
                                              if (!dealData.loans) dealData.loans = [];
                                              const loanIndex = dealData.loans.findIndex((l: any) => l.id === loan.id);
                                              if (loanIndex >= 0) {
                                                const amount = parseFloat(e.target.value) || 0;
                                                dealData.loans[loanIndex].amount = amount;
                                                dealData.loans[loanIndex].loanAmount = amount; // Keep both for consistency
                                                // Recalculate monthly payment using new function
                                                dealData.loans[loanIndex].monthlyPayment = calculateLoanPayment(
                                                  amount,
                                                  dealData.loans[loanIndex].interestRate,
                                                  dealData.loans[loanIndex].termYears,
                                                  dealData.loans[loanIndex].paymentType || 'amortizing'
                                                );
                                                handlePropertyFieldChange('dealAnalyzerData', JSON.stringify(dealData));
                                              }
                                            }}
                                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded"
                                          />
                                        ) : (
                                          <p className="font-medium text-indigo-900 dark:text-indigo-200">
                                            {formatCurrency(loan.amount)}
                                          </p>
                                        )}
                                      </div>
                                      
                                      <div>
                                        <p className="text-sm text-indigo-700 dark:text-indigo-300">Interest Rate</p>
                                        {isEditing ? (
                                          <input
                                            type="number"
                                            step="0.01"
                                            value={(loan.interestRate * 100).toFixed(2)}
                                            onChange={(e) => {
                                              const dealData = editingModalProperty?.dealAnalyzerData ? JSON.parse(editingModalProperty.dealAnalyzerData) : {};
                                              if (!dealData.loans) dealData.loans = [];
                                              const loanIndex = dealData.loans.findIndex((l: any) => l.id === loan.id);
                                              if (loanIndex >= 0) {
                                                const interestRate = (parseFloat(e.target.value) || 0) / 100;
                                                dealData.loans[loanIndex].interestRate = interestRate;
                                                // Recalculate monthly payment using new function
                                                dealData.loans[loanIndex].monthlyPayment = calculateLoanPayment(
                                                  dealData.loans[loanIndex].amount || dealData.loans[loanIndex].loanAmount,
                                                  interestRate,
                                                  dealData.loans[loanIndex].termYears,
                                                  dealData.loans[loanIndex].paymentType || 'amortizing'
                                                );
                                                handlePropertyFieldChange('dealAnalyzerData', JSON.stringify(dealData));
                                              }
                                            }}
                                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded"
                                          />
                                        ) : (
                                          <p className="font-medium text-indigo-900 dark:text-indigo-200">
                                            {formatPercentage(loan.interestRate * 100)}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    <div className="space-y-3">
                                      <div>
                                        <p className="text-sm text-indigo-700 dark:text-indigo-300">Loan Term</p>
                                        {isEditing ? (
                                          <input
                                            type="number"
                                            value={loan.termYears}
                                            onChange={(e) => {
                                              const dealData = editingModalProperty?.dealAnalyzerData ? JSON.parse(editingModalProperty.dealAnalyzerData) : {};
                                              if (!dealData.loans) dealData.loans = [];
                                              const loanIndex = dealData.loans.findIndex((l: any) => l.id === loan.id);
                                              if (loanIndex >= 0) {
                                                const termYears = parseInt(e.target.value) || 30;
                                                dealData.loans[loanIndex].termYears = termYears;
                                                // Recalculate monthly payment using new function
                                                dealData.loans[loanIndex].monthlyPayment = calculateLoanPayment(
                                                  dealData.loans[loanIndex].amount || dealData.loans[loanIndex].loanAmount,
                                                  dealData.loans[loanIndex].interestRate,
                                                  termYears,
                                                  dealData.loans[loanIndex].paymentType || 'amortizing'
                                                );
                                                handlePropertyFieldChange('dealAnalyzerData', JSON.stringify(dealData));
                                              }
                                            }}
                                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded"
                                          />
                                        ) : (
                                          <p className="font-medium text-indigo-900 dark:text-indigo-200">
                                            {loan.termYears} years
                                          </p>
                                        )}
                                      </div>
                                      
                                      <div>
                                        <p className="text-sm text-indigo-700 dark:text-indigo-300">Payment Type</p>
                                        {isEditing ? (
                                          <select
                                            value={loan.paymentType || 'amortizing'}
                                            onChange={(e) => {
                                              const dealData = editingModalProperty?.dealAnalyzerData ? JSON.parse(editingModalProperty.dealAnalyzerData) : {};
                                              if (!dealData.loans) dealData.loans = [];
                                              const loanIndex = dealData.loans.findIndex((l: any) => l.id === loan.id);
                                              if (loanIndex >= 0) {
                                                dealData.loans[loanIndex].paymentType = e.target.value;
                                                // Recalculate monthly payment with new payment type
                                                dealData.loans[loanIndex].monthlyPayment = calculateLoanPayment(
                                                  dealData.loans[loanIndex].amount || dealData.loans[loanIndex].loanAmount,
                                                  dealData.loans[loanIndex].interestRate,
                                                  dealData.loans[loanIndex].termYears,
                                                  e.target.value
                                                );
                                                handlePropertyFieldChange('dealAnalyzerData', JSON.stringify(dealData));
                                              }
                                            }}
                                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded"
                                          >
                                            <option value="amortizing">Full Amortization</option>
                                            <option value="interest-only">Interest Only</option>
                                          </select>
                                        ) : (
                                          <p className="font-medium text-indigo-900 dark:text-indigo-200 capitalize">
                                            {loan.paymentType === 'interest-only' ? 'Interest Only' : 'Full Amortization'}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    <div className="space-y-3">
                                      <div>
                                        <p className="text-sm text-indigo-700 dark:text-indigo-300">Loan Type</p>
                                        {isEditing ? (
                                          <select
                                            value={loan.loanType || 'acquisition'}
                                            onChange={(e) => {
                                              const dealData = editingModalProperty?.dealAnalyzerData ? JSON.parse(editingModalProperty.dealAnalyzerData) : {};
                                              if (!dealData.loans) dealData.loans = [];
                                              const loanIndex = dealData.loans.findIndex((l: any) => l.id === loan.id);
                                              if (loanIndex >= 0) {
                                                dealData.loans[loanIndex].loanType = e.target.value;
                                                handlePropertyFieldChange('dealAnalyzerData', JSON.stringify(dealData));
                                              }
                                            }}
                                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded"
                                          >
                                            <option value="acquisition">Acquisition</option>
                                            <option value="refinance">Refinance</option>
                                            <option value="construction">Construction</option>
                                            <option value="bridge">Bridge</option>
                                          </select>
                                        ) : (
                                          <p className="font-medium text-indigo-900 dark:text-indigo-200 capitalize">
                                            {loan.loanType}
                                          </p>
                                        )}
                                      </div>

                                      <div>
                                        <p className="text-sm text-indigo-700 dark:text-indigo-300">Monthly Payment</p>
                                        <p className="font-medium text-indigo-900 dark:text-indigo-200">
                                          {formatCurrency(loan.monthlyPayment || 0)}
                                        </p>
                                      </div>
                                      
                                      <div>
                                        <p className="text-sm text-indigo-700 dark:text-indigo-300">Start Date</p>
                                        {isEditing ? (
                                          <input
                                            type="date"
                                            value={loan.startDate}
                                            onChange={(e) => {
                                              const dealData = editingModalProperty?.dealAnalyzerData ? JSON.parse(editingModalProperty.dealAnalyzerData) : {};
                                              if (!dealData.loans) dealData.loans = [];
                                              const loanIndex = dealData.loans.findIndex((l: any) => l.id === loan.id);
                                              if (loanIndex >= 0) {
                                                dealData.loans[loanIndex].startDate = e.target.value;
                                                handlePropertyFieldChange('dealAnalyzerData', JSON.stringify(dealData));
                                              }
                                            }}
                                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded"
                                          />
                                        ) : (
                                          <p className="font-medium text-indigo-900 dark:text-indigo-200">
                                            {new Date(loan.startDate).toLocaleDateString()}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {loan.isActive && (
                                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                                      <p className="text-sm text-green-800 dark:text-green-300 font-medium">
                                        This loan is used for debt service calculations in cash flow analysis
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ));
                            })()}



                            {dealAnalyzerData.closingCosts && (
                              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6 border border-yellow-200 dark:border-yellow-800">
                                <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-300 mb-4">Closing Costs</h3>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {Object.entries(dealAnalyzerData.closingCosts).map(([key, value]: [string, any]) => (
                                    <div key={key} className="bg-white dark:bg-gray-700 rounded p-4">
                                      <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                                      <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(value)}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {dealAnalyzerData.holdingCosts && (
                              <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-6 border border-pink-200 dark:border-pink-800">
                                <h3 className="text-lg font-semibold text-pink-900 dark:text-pink-300 mb-4">Holding Costs</h3>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {Object.entries(dealAnalyzerData.holdingCosts).map(([key, value]: [string, any]) => (
                                    <div key={key} className="bg-white dark:bg-gray-700 rounded p-4">
                                      <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                                      <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(value)}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-center py-12">
                            <PieChart className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No Financing Data</h3>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Financing information was not imported with this property</p>
                          </div>
                        )}
                      </div>
                    );

                  case 'exit':
                    return (
                      <div className="space-y-6">
                        {/* Sale Assumptions */}
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-6 border border-emerald-200 dark:border-emerald-800">
                          <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-300 mb-4">Sale Assumptions</h3>
                          <div className="grid md:grid-cols-3 gap-6">
                            <div>
                              <p className="text-sm text-emerald-700 dark:text-emerald-300">Sales Cap Rate</p>
                              {isEditing ? (
                                <input
                                  type="number"
                                  step="0.1"
                                  value={dealAnalyzerData?.exitAnalysis?.saleFactor || 1.0}
                                  onChange={(e) => {
                                    const dealData = editingModalProperty?.dealAnalyzerData ? JSON.parse(editingModalProperty.dealAnalyzerData) : {};
                                    if (!dealData.exitAnalysis) dealData.exitAnalysis = {};
                                    dealData.exitAnalysis.saleFactor = parseFloat(e.target.value) || 1.0;
                                    handlePropertyFieldChange('dealAnalyzerData', JSON.stringify(dealData));
                                  }}
                                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded"
                                />
                              ) : (
                                <p className="font-medium text-emerald-900 dark:text-emerald-200">
                                  {dealAnalyzerData?.exitAnalysis?.saleFactor || 1.0}x ARV
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-sm text-emerald-700 dark:text-emerald-300">Sale Costs %</p>
                              {isEditing ? (
                                <input
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  max="15"
                                  value={(dealAnalyzerData?.exitAnalysis?.saleCostsPercent || 0.06) * 100}
                                  onChange={(e) => {
                                    const dealData = editingModalProperty?.dealAnalyzerData ? JSON.parse(editingModalProperty.dealAnalyzerData) : {};
                                    if (!dealData.exitAnalysis) dealData.exitAnalysis = {};
                                    dealData.exitAnalysis.saleCostsPercent = (parseFloat(e.target.value) || 6) / 100;
                                    handlePropertyFieldChange('dealAnalyzerData', JSON.stringify(dealData));
                                  }}
                                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded"
                                />
                              ) : (
                                <p className="font-medium text-emerald-900 dark:text-emerald-200">
                                  {formatPercentage((dealAnalyzerData?.exitAnalysis?.saleCostsPercent || 0.06) * 100)}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-sm text-emerald-700 dark:text-emerald-300">Hold Period (Years)</p>
                              {isEditing ? (
                                <input
                                  type="number"
                                  step="0.5"
                                  min="0.5"
                                  max="10"
                                  value={dealAnalyzerData?.exitAnalysis?.holdPeriodYears || 3}
                                  onChange={(e) => {
                                    const dealData = editingModalProperty?.dealAnalyzerData ? JSON.parse(editingModalProperty.dealAnalyzerData) : {};
                                    if (!dealData.exitAnalysis) dealData.exitAnalysis = {};
                                    dealData.exitAnalysis.holdPeriodYears = parseFloat(e.target.value) || 3;
                                    handlePropertyFieldChange('dealAnalyzerData', JSON.stringify(dealData));
                                  }}
                                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded"
                                />
                              ) : (
                                <p className="font-medium text-emerald-900 dark:text-emerald-200">
                                  {dealAnalyzerData?.exitAnalysis?.holdPeriodYears || 3} years
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Refinance Section */}
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-6 border border-indigo-200 dark:border-indigo-800">
                          <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-300 mb-4">Refinance Analysis</h3>
                          <div className="grid md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-medium text-indigo-900 dark:text-indigo-300 mb-3">Refinance Assumptions</h4>
                              <div className="space-y-3">
                                <div>
                                  <label className="text-sm text-indigo-700 dark:text-indigo-300">Refinance LTV %</label>
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      step="5"
                                      min="50"
                                      max="90"
                                      value={(() => {
                                        const currentData = editingModalProperty?.dealAnalyzerData ? JSON.parse(editingModalProperty.dealAnalyzerData) : dealAnalyzerData;
                                        return (currentData?.refinanceAnalysis?.ltv || 0.75) * 100;
                                      })()}
                                      onChange={(e) => {
                                        const dealData = editingModalProperty?.dealAnalyzerData ? JSON.parse(editingModalProperty.dealAnalyzerData) : {};
                                        if (!dealData.refinanceAnalysis) dealData.refinanceAnalysis = {};
                                        dealData.refinanceAnalysis.ltv = (parseFloat(e.target.value) || 75) / 100;
                                        handlePropertyFieldChange('dealAnalyzerData', JSON.stringify(dealData));
                                      }}
                                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded"
                                      placeholder="Enter LTV percentage"
                                    />
                                  ) : (
                                    <p className="font-medium text-indigo-900 dark:text-indigo-200">
                                      {formatPercentage((dealAnalyzerData?.refinanceAnalysis?.ltv || 0.75) * 100)}
                                    </p>
                                  )}
                                </div>
                                <div>
                                  <label className="text-sm text-indigo-700 dark:text-indigo-300">Refinance Rate %</label>
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      step="0.25"
                                      min="3"
                                      max="12"
                                      value={(() => {
                                        const currentData = editingModalProperty?.dealAnalyzerData ? JSON.parse(editingModalProperty.dealAnalyzerData) : dealAnalyzerData;
                                        return (currentData?.refinanceAnalysis?.interestRate || 0.065) * 100;
                                      })()}
                                      onChange={(e) => {
                                        const dealData = editingModalProperty?.dealAnalyzerData ? JSON.parse(editingModalProperty.dealAnalyzerData) : {};
                                        if (!dealData.refinanceAnalysis) dealData.refinanceAnalysis = {};
                                        dealData.refinanceAnalysis.interestRate = (parseFloat(e.target.value) || 6.5) / 100;
                                        handlePropertyFieldChange('dealAnalyzerData', JSON.stringify(dealData));
                                      }}
                                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded"
                                      placeholder="Enter interest rate"
                                    />
                                  ) : (
                                    <p className="font-medium text-indigo-900 dark:text-indigo-200">
                                      {formatPercentage((dealAnalyzerData?.refinanceAnalysis?.interestRate || 0.065) * 100)}
                                    </p>
                                  )}
                                </div>
                                <div>
                                  <label className="text-sm text-indigo-700 dark:text-indigo-300">Refinance Costs</label>
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      value={(() => {
                                        const currentData = editingModalProperty?.dealAnalyzerData ? JSON.parse(editingModalProperty.dealAnalyzerData) : dealAnalyzerData;
                                        return currentData?.refinanceAnalysis?.closingCosts || 5000;
                                      })()}
                                      onChange={(e) => {
                                        const dealData = editingModalProperty?.dealAnalyzerData ? JSON.parse(editingModalProperty.dealAnalyzerData) : {};
                                        if (!dealData.refinanceAnalysis) dealData.refinanceAnalysis = {};
                                        dealData.refinanceAnalysis.closingCosts = parseFloat(e.target.value) || 5000;
                                        handlePropertyFieldChange('dealAnalyzerData', JSON.stringify(dealData));
                                      }}
                                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded"
                                      placeholder="Enter closing costs"
                                    />
                                  ) : (
                                    <p className="font-medium text-indigo-900 dark:text-indigo-200">
                                      {formatCurrency(dealAnalyzerData?.refinanceAnalysis?.closingCosts || 5000)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium text-indigo-900 dark:text-indigo-300 mb-3">Refinance Projections</h4>
                              <div className="space-y-3">
                                {(() => {
                                  const arv = dealAnalyzerData?.calculations?.arv || parseFloat(showPropertyDetailModal.arvAtTimePurchased || '0');
                                  const ltv = dealAnalyzerData?.refinanceAnalysis?.ltv || 0.75;
                                  const rate = dealAnalyzerData?.refinanceAnalysis?.interestRate || 0.065;
                                  const closingCosts = dealAnalyzerData?.refinanceAnalysis?.closingCosts || 5000;
                                  const initialCapital = parseFloat(showPropertyDetailModal.initialCapitalRequired || '0');
                                  
                                  const newLoanAmount = arv * ltv;
                                  const cashOut = newLoanAmount - closingCosts;
                                  const capitalRecovered = Math.min(cashOut, initialCapital);
                                  const additionalCash = Math.max(0, cashOut - initialCapital);
                                  const monthlyPayment = newLoanAmount * (rate / 12 * Math.pow(1 + rate / 12, 360)) / (Math.pow(1 + rate / 12, 360) - 1);
                                  
                                  return (
                                    <>
                                      <div>
                                        <p className="text-sm text-indigo-700 dark:text-indigo-300">New Loan Amount</p>
                                        <p className="font-medium text-indigo-900 dark:text-indigo-200">{formatCurrency(newLoanAmount)}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-indigo-700 dark:text-indigo-300">Cash Out (After Costs)</p>
                                        <p className="font-medium text-green-600">{formatCurrency(cashOut)}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-indigo-700 dark:text-indigo-300">Capital Recovered</p>
                                        <p className="font-medium text-green-600">{formatCurrency(capitalRecovered)}</p>
                                      </div>
                                      {additionalCash > 0 && (
                                        <div>
                                          <p className="text-sm text-indigo-700 dark:text-indigo-300">Additional Cash</p>
                                          <p className="font-medium text-green-600">{formatCurrency(additionalCash)}</p>
                                        </div>
                                      )}
                                      <div>
                                        <p className="text-sm text-indigo-700 dark:text-indigo-300">New Monthly Payment</p>
                                        <p className="font-medium text-indigo-900 dark:text-indigo-200">{formatCurrency(monthlyPayment)}</p>
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Sale Projections */}
                        {dealAnalyzerData?.exitAnalysis && (
                          <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-6 border border-teal-200 dark:border-teal-800">
                            <h3 className="text-lg font-semibold text-teal-900 dark:text-teal-300 mb-4">Sale Projections</h3>
                            <div className="grid md:grid-cols-2 gap-6">
                              <div className="space-y-3">
                                {(() => {
                                  const arv = dealAnalyzerData?.calculations?.arv || parseFloat(showPropertyDetailModal.arvAtTimePurchased || '0');
                                  const saleFactor = dealAnalyzerData.exitAnalysis.saleFactor || 1.0;
                                  const saleCostsPercent = dealAnalyzerData.exitAnalysis.saleCostsPercent || 0.06;
                                  
                                  const projectedSalePrice = arv * saleFactor;
                                  const saleCosts = projectedSalePrice * saleCostsPercent;
                                  const netProceeds = projectedSalePrice - saleCosts;
                                  
                                  return (
                                    <>
                                      <div>
                                        <p className="text-sm text-teal-700 dark:text-teal-300">Current ARV</p>
                                        <p className="font-medium text-teal-900 dark:text-teal-200">{formatCurrency(arv)}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-teal-700 dark:text-teal-300">Projected Sale Price</p>
                                        <p className="font-medium text-teal-900 dark:text-teal-200">{formatCurrency(projectedSalePrice)}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-teal-700 dark:text-teal-300">Sale Costs</p>
                                        <p className="font-medium text-red-600">({formatCurrency(saleCosts)})</p>
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                              <div className="space-y-3">
                                {(() => {
                                  const arv = dealAnalyzerData?.calculations?.arv || parseFloat(showPropertyDetailModal.arvAtTimePurchased || '0');
                                  const saleFactor = dealAnalyzerData.exitAnalysis.saleFactor || 1.0;
                                  const saleCostsPercent = dealAnalyzerData.exitAnalysis.saleCostsPercent || 0.06;
                                  const initialCapital = parseFloat(showPropertyDetailModal.initialCapitalRequired || '0');
                                  
                                  const projectedSalePrice = arv * saleFactor;
                                  const saleCosts = projectedSalePrice * saleCostsPercent;
                                  const netProceeds = projectedSalePrice - saleCosts;
                                  const totalReturn = netProceeds - initialCapital;
                                  const holdPeriod = dealAnalyzerData.exitAnalysis.holdPeriodYears || 3;
                                  const annualizedReturn = initialCapital > 0 ? (Math.pow(netProceeds / initialCapital, 1 / holdPeriod) - 1) * 100 : 0;
                                  
                                  return (
                                    <>
                                      <div>
                                        <p className="text-sm text-teal-700 dark:text-teal-300">Net Proceeds</p>
                                        <p className="font-medium text-green-600">{formatCurrency(netProceeds)}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-teal-700 dark:text-teal-300">Total Return</p>
                                        <p className={`font-medium ${totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                          {formatCurrency(totalReturn)}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-teal-700 dark:text-teal-300">Annualized Return</p>
                                        <p className={`font-medium ${annualizedReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                          {formatPercentage(annualizedReturn)}
                                        </p>
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Strategy Comparison */}
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Exit Strategy Comparison</h3>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                              <thead>
                                <tr>
                                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Strategy</th>
                                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Cash Received</th>
                                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Remaining Equity</th>
                                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Annual Cash Flow</th>
                                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Total Return</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                {(() => {
                                  const arv = dealAnalyzerData?.calculations?.arv || parseFloat(showPropertyDetailModal.arvAtTimePurchased || '0');
                                  const currentCashFlow = parseFloat(showPropertyDetailModal.cashFlow || '0');
                                  const initialCapital = parseFloat(showPropertyDetailModal.initialCapitalRequired || '0');
                                  
                                  // Refinance scenario
                                  const refinanceLtv = dealAnalyzerData?.refinanceAnalysis?.ltv || 0.75;
                                  const refinanceRate = dealAnalyzerData?.refinanceAnalysis?.interestRate || 0.065;
                                  const refinanceCosts = dealAnalyzerData?.refinanceAnalysis?.closingCosts || 5000;
                                  const newLoanAmount = arv * refinanceLtv;
                                  const refinanceCashOut = newLoanAmount - refinanceCosts;
                                  const newMonthlyPayment = newLoanAmount * (refinanceRate / 12 * Math.pow(1 + refinanceRate / 12, 360)) / (Math.pow(1 + refinanceRate / 12, 360) - 1);
                                  const refinanceNewCashFlow = currentCashFlow - (newMonthlyPayment * 12);
                                  const refinanceEquity = arv - newLoanAmount;
                                  
                                  // Sale scenario
                                  const saleFactor = dealAnalyzerData?.exitAnalysis?.saleFactor || 1.0;
                                  const saleCostsPercent = dealAnalyzerData?.exitAnalysis?.saleCostsPercent || 0.06;
                                  const salePrice = arv * saleFactor;
                                  const saleCosts = salePrice * saleCostsPercent;
                                  const saleNetProceeds = salePrice - saleCosts;
                                  
                                  return (
                                    <>
                                      <tr>
                                        <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">Hold & Cash Flow</td>
                                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-300">$0</td>
                                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-300">{formatCurrency(arv)}</td>
                                        <td className="px-4 py-2 text-sm text-green-600">{formatCurrency(currentCashFlow)}</td>
                                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-300">Equity + Cash Flow</td>
                                      </tr>
                                      <tr>
                                        <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">Refinance</td>
                                        <td className="px-4 py-2 text-sm text-green-600">{formatCurrency(refinanceCashOut)}</td>
                                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-300">{formatCurrency(refinanceEquity)}</td>
                                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-300">{formatCurrency(refinanceNewCashFlow)}</td>
                                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-300">Cash + Equity + CF</td>
                                      </tr>
                                      <tr>
                                        <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">Sale</td>
                                        <td className="px-4 py-2 text-sm text-green-600">{formatCurrency(saleNetProceeds)}</td>
                                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-300">$0</td>
                                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-300">$0</td>
                                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-300">{formatCurrency(saleNetProceeds - initialCapital)}</td>
                                      </tr>
                                    </>
                                  );
                                })()}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    );

                  default:
                    return <div>Select a tab to view property details</div>;
                }
              })()}
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={closeDetailModal}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}