import React, { useState } from 'react';
import { CreditCard, RefreshCw, Eye, TrendingUp, DollarSign, Building2, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PlaidLink from './PlaidLink';

interface BankAccount {
  id: number;
  accountName: string;
  institutionName: string;
  accountType: string;
  accountSubtype: string;
  mask: string;
  currentBalance: number;
  availableBalance: number;
  lastUpdated: string;
  isActive: boolean;
}

const BankAccountManager: React.FC = () => {
  const [showTransactions, setShowTransactions] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // Fetch bank accounts
  const { data: bankAccounts = [], isLoading, error } = useQuery({
    queryKey: ['/api/plaid/accounts'],
    queryFn: async () => {
      const response = await fetch('/api/plaid/accounts', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch bank accounts');
      return response.json();
    }
  });

  // Refresh balances mutation
  const refreshBalancesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/plaid/refresh-balances', {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to refresh balances');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/plaid/accounts'] });
    }
  });

  // Handle successful bank account linking
  const handlePlaidSuccess = (accessToken: string, metadata: any) => {
    console.log('Bank account linked successfully:', metadata);
    // Refresh the bank accounts list
    queryClient.invalidateQueries({ queryKey: ['/api/plaid/accounts'] });
  };

  // Format currency
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

  // Calculate total cash balance
  const totalCashBalance = bankAccounts.reduce((sum: number, account: BankAccount) => {
    return sum + (parseFloat(account.currentBalance?.toString() || '0'));
  }, 0);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Cash Balance</h3>
          <CreditCard className="h-5 w-5 text-blue-600" />
        </div>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Cash Balance</h3>
          <AlertCircle className="h-5 w-5 text-red-500" />
        </div>
        <div className="text-center py-4">
          <p className="text-red-600 mb-4">Failed to load bank accounts</p>
          <PlaidLink 
            onSuccess={handlePlaidSuccess}
            buttonText="Connect Bank Account"
            className="w-full"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Cash Balance</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => refreshBalancesMutation.mutate()}
            disabled={refreshBalancesMutation.isPending}
            className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
            title="Refresh Balances"
          >
            <RefreshCw className={`h-4 w-4 ${refreshBalancesMutation.isPending ? 'animate-spin' : ''}`} />
          </button>
          <CreditCard className="h-5 w-5 text-blue-600" />
        </div>
      </div>

      {bankAccounts.length === 0 ? (
        <div className="text-center py-6">
          <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Bank Accounts Connected</h4>
          <p className="text-gray-500 mb-4">Connect your bank account to track cash balances and transactions automatically.</p>
          <PlaidLink 
            onSuccess={handlePlaidSuccess}
            buttonText="Connect Your First Account"
            className="w-full"
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Total Balance */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Total Cash Balance</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalCashBalance)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          {/* Individual Accounts */}
          <div className="space-y-3">
            {bankAccounts.map((account: BankAccount) => (
              <div key={account.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {account.accountName} ••••{account.mask}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {account.institutionName} • {account.accountSubtype || account.accountType}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(account.currentBalance)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Available: {formatCurrency(account.availableBalance)}
                    </p>
                  </div>
                </div>
                
                {account.lastUpdated && (
                  <p className="text-xs text-gray-400 mt-2">
                    Last updated: {new Date(account.lastUpdated).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Add Another Account */}
          <div className="pt-2">
            <PlaidLink 
              onSuccess={handlePlaidSuccess}
              buttonText="+ Add Another Account"
              className="w-full text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BankAccountManager;