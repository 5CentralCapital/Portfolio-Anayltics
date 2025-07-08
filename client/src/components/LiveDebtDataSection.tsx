import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Database, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Plus, 
  Edit3, 
  Trash2, 
  ArrowUpCircle,
  DollarSign,
  Calendar,
  FileText
} from 'lucide-react';

interface LiveDebtDataSectionProps {
  propertyId: number;
  dealAnalyzerData: any;
  isEditing: boolean;
  onUpdate: () => void;
}

const LiveDebtDataSection: React.FC<LiveDebtDataSectionProps> = ({ 
  propertyId, 
  dealAnalyzerData, 
  isEditing, 
  onUpdate 
}) => {
  const [showAddLoan, setShowAddLoan] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch property loans from database
  const { data: propertyLoans = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/property', propertyId, 'loans'],
    queryFn: () => apiRequest(`/api/property/${propertyId}/loans`)
  });

  // Create loan mutation
  const createLoanMutation = useMutation({
    mutationFn: (loanData: any) => 
      apiRequest(`/api/property/${propertyId}/loans`, {
        method: 'POST',
        body: JSON.stringify(loanData)
      }),
    onSuccess: () => {
      toast({ title: "Loan Added", description: "New loan record created successfully" });
      refetch();
      onUpdate();
      setShowAddLoan(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create loan",
        variant: "destructive" 
      });
    }
  });

  // Update loan mutation
  const updateLoanMutation = useMutation({
    mutationFn: ({ loanId, data }: { loanId: number; data: any }) =>
      apiRequest(`/api/loans/${loanId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      toast({ title: "Loan Updated", description: "Loan information updated successfully" });
      refetch();
      onUpdate();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update loan",
        variant: "destructive" 
      });
    }
  });

  // Delete loan mutation
  const deleteLoanMutation = useMutation({
    mutationFn: (loanId: number) => apiRequest(`/api/loans/${loanId}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast({ title: "Loan Deleted", description: "Loan record removed successfully" });
      refetch();
      onUpdate();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete loan",
        variant: "destructive" 
      });
    }
  });

  // Sync with Deal Analyzer mutation
  const syncMutation = useMutation({
    mutationFn: (loanData: any) =>
      apiRequest(`/api/property/${propertyId}/loans/sync`, {
        method: 'POST',
        body: JSON.stringify({ loanData })
      }),
    onSuccess: () => {
      toast({ title: "Sync Complete", description: "Loan data synchronized successfully" });
      refetch();
      onUpdate();
    },
    onError: (error: any) => {
      toast({ 
        title: "Sync Failed", 
        description: error.message || "Failed to sync loan data",
        variant: "destructive" 
      });
    }
  });

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num || 0);
  };

  const formatPercentage = (rate: string | number) => {
    const num = typeof rate === 'string' ? parseFloat(rate) : rate;
    // Interest rates are already stored as percentages (e.g., 8.49), not decimals (0.0849)
    return `${num.toFixed(2)}%`;
  };

  const getSyncStatusBadge = (status: string) => {
    const badges = {
      success: { icon: CheckCircle, color: 'text-green-600 bg-green-100', label: 'Synced' },
      pending: { icon: Clock, color: 'text-yellow-600 bg-yellow-100', label: 'Pending' },
      failed: { icon: AlertCircle, color: 'text-red-600 bg-red-100', label: 'Failed' },
      syncing: { icon: RefreshCw, color: 'text-blue-600 bg-blue-100', label: 'Syncing' }
    };
    
    const badge = badges[status as keyof typeof badges] || badges.pending;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {badge.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Live Debt Data Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Live Debt Data
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Real-time loan information from uploaded statements
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center text-sm"
            title="Refresh loan data"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          {isEditing && (
            <button
              onClick={() => setShowAddLoan(true)}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Loan
            </button>
          )}
        </div>
      </div>

      {/* Live Loans Display */}
      {isLoading ? (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
          <RefreshCw className="h-8 w-8 mx-auto text-gray-400 animate-spin mb-2" />
          <p className="text-gray-600 dark:text-gray-400">Loading loan data...</p>
        </div>
      ) : propertyLoans.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
          <Database className="h-8 w-8 mx-auto text-gray-400 mb-2" />
          <h3 className="font-medium text-gray-900 dark:text-white mb-1">No Live Debt Data</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Upload lender statements to see real-time loan information
          </p>
          {isEditing && (
            <button
              onClick={() => setShowAddLoan(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Manual Loan Record
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {propertyLoans.map((loan: any) => (
            <div key={loan.id} className={`bg-white dark:bg-gray-700 rounded-lg p-6 border-2 ${
              loan.isActive ? 'border-green-500' : 'border-gray-200 dark:border-gray-600'
            }`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {loan.loanName}
                  </h3>
                  {loan.isActive && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      Active
                    </span>
                  )}
                  {getSyncStatusBadge(loan.syncStatus)}
                </div>
                
                {isEditing && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        const newActiveState = !loan.isActive;
                        updateLoanMutation.mutate({
                          loanId: loan.id,
                          data: { isActive: newActiveState }
                        });
                      }}
                      className={`px-3 py-1 text-xs rounded ${
                        loan.isActive 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-green-100'
                      }`}
                      title="Toggle active status for debt service calculations"
                    >
                      {loan.isActive ? 'Active' : 'Set Active'}
                    </button>
                    
                    <button
                      onClick={() => {
                        if (confirm(`Delete loan "${loan.loanName}"?`)) {
                          deleteLoanMutation.mutate(loan.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-800"
                      title="Delete loan"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-5 gap-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Current Balance</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(loan.currentBalance)}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Payment</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(loan.monthlyPayment)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Interest Rate</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatPercentage(loan.interestRate)}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Escrow Balance</p>
                    <p className="font-medium text-green-600 dark:text-green-400">
                      {formatCurrency(loan.escrowBalance || 0)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Lender</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {loan.lender || 'Not specified'}
                    </p>
                  </div>
                  
                  {loan.pastDueAmount > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Past Due</p>
                      <p className="font-medium text-red-600 dark:text-red-400">
                        {formatCurrency(loan.pastDueAmount)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Loan Type</p>
                    <p className="font-medium text-gray-900 dark:text-white capitalize">
                      {loan.loanType.replace('_', ' ')}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">External ID</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {loan.externalLoanId || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Last Sync</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {loan.lastSyncDate 
                        ? new Date(loan.lastSyncDate).toLocaleDateString()
                        : 'Never'
                      }
                    </p>
                  </div>
                  
                  {loan.nextPaymentDate && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Next Payment</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(loan.nextPaymentDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {loan.syncError && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-800 dark:text-red-300">
                    <strong>Sync Error:</strong> {loan.syncError}
                  </p>
                </div>
              )}

              {/* Enhanced Mortgage Statement Details */}
              {loan.notes && loan.notes.includes('Manual review completed') && (
                <div className="mt-4">
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Enhanced Statement Details
                    </h4>
                    {(() => {
                      try {
                        const reviewData = JSON.parse(loan.notes.replace('Manual review completed: ', ''));
                        const additionalInfo = reviewData.editedLoan?.additionalInfo || {};
                        
                        return (
                          <div className="grid md:grid-cols-3 gap-4 text-sm">
                            {/* Payment Details */}
                            <div className="space-y-2">
                              <h5 className="font-medium text-gray-700 dark:text-gray-300">Payment Information</h5>
                              {additionalInfo.pastDueAmount > 0 && (
                                <div className="text-red-600">
                                  <span className="text-gray-600">Past Due:</span> {formatCurrency(additionalInfo.pastDueAmount)}
                                </div>
                              )}
                              {additionalInfo.lateFeeAfterDate && (
                                <div>
                                  <span className="text-gray-600">Late Fee After:</span> {new Date(additionalInfo.lateFeeAfterDate).toLocaleDateString()}
                                </div>
                              )}
                              {additionalInfo.maxLateFee > 0 && (
                                <div>
                                  <span className="text-gray-600">Max Late Fee:</span> {formatCurrency(additionalInfo.maxLateFee)}
                                </div>
                              )}
                              {additionalInfo.unappliedFunds > 0 && (
                                <div>
                                  <span className="text-gray-600">Unapplied Funds:</span> {formatCurrency(additionalInfo.unappliedFunds)}
                                </div>
                              )}
                            </div>

                            {/* Account Balances */}
                            <div className="space-y-2">
                              <h5 className="font-medium text-gray-700 dark:text-gray-300">Account Balances</h5>
                              {loan.escrowBalance > 0 && (
                                <div>
                                  <span className="text-gray-600">Escrow Balance:</span> {formatCurrency(loan.escrowBalance)}
                                </div>
                              )}
                              {additionalInfo.deferredBalance > 0 && (
                                <div>
                                  <span className="text-gray-600">Deferred Balance:</span> {formatCurrency(additionalInfo.deferredBalance)}
                                </div>
                              )}
                              {additionalInfo.replacementReserveBalance > 0 && (
                                <div>
                                  <span className="text-gray-600">Reserve Balance:</span> {formatCurrency(additionalInfo.replacementReserveBalance)}
                                </div>
                              )}
                              {additionalInfo.originalLoanAmount > 0 && (
                                <div>
                                  <span className="text-gray-600">Original Amount:</span> {formatCurrency(additionalInfo.originalLoanAmount)}
                                </div>
                              )}
                            </div>

                            {/* Loan Terms */}
                            <div className="space-y-2">
                              <h5 className="font-medium text-gray-700 dark:text-gray-300">Loan Terms</h5>
                              {loan.remainingTerm && (
                                <div>
                                  <span className="text-gray-600">Remaining Term:</span> {loan.remainingTerm} months
                                </div>
                              )}
                              {additionalInfo.prepaymentPenalty && (
                                <div className={additionalInfo.prepaymentPenalty !== 'None' ? 'text-yellow-600' : ''}>
                                  <span className="text-gray-600">Prepayment Penalty:</span> {additionalInfo.prepaymentPenalty}
                                </div>
                              )}
                              {additionalInfo.maturityDate && (
                                <div>
                                  <span className="text-gray-600">Maturity Date:</span> {new Date(additionalInfo.maturityDate).toLocaleDateString()}
                                </div>
                              )}
                              {additionalInfo.loanType && (
                                <div>
                                  <span className="text-gray-600">Loan Type:</span> {additionalInfo.loanType}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      } catch (error) {
                        return (
                          <p className="text-sm text-gray-500">Enhanced details available in loan notes</p>
                        );
                      }
                    })()}
                  </div>
                </div>
              )}

              {loan.isActive && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-800 dark:text-green-300 font-medium">
                    This loan is used for debt service calculations in cash flow analysis
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Sync with Deal Analyzer */}
      {dealAnalyzerData?.loans && dealAnalyzerData.loans.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-1">
                Synchronize with Deal Analyzer
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                Import loan data from Deal Analyzer to create live debt records
              </p>
            </div>
            
            <button
              onClick={() => {
                // Use the active loan from Deal Analyzer
                const activeLoan = dealAnalyzerData.loans.find((l: any) => l.isActive) || dealAnalyzerData.loans[0];
                if (activeLoan) {
                  syncMutation.mutate({
                    lenderName: 'Deal Analyzer Import',
                    loanId: `DA_${activeLoan.id}`,
                    currentBalance: activeLoan.amount || activeLoan.loanAmount,
                    interestRate: (activeLoan.interestRate * 100),
                    monthlyPayment: activeLoan.monthlyPayment,
                    statementDate: new Date().toISOString().split('T')[0],
                    principalBalance: activeLoan.amount || activeLoan.loanAmount,
                    nextPaymentDate: null,
                    nextPaymentAmount: activeLoan.monthlyPayment
                  });
                }
              }}
              disabled={syncMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <ArrowUpCircle className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              {syncMutation.isPending ? 'Syncing...' : 'Sync Active Loan'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveDebtDataSection;