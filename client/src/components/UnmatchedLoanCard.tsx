import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Edit3, Save, X } from 'lucide-react';

interface UnmatchedLoan {
  lender: string;
  balance: number;
  loanId: string;
  interestRate?: number;
  monthlyPayment?: number;
  propertyAddress?: string;
  nextPaymentDate?: string;
  additionalInfo?: any;
}

interface UnmatchedLoanCardProps {
  loan: UnmatchedLoan;
  onSave: () => void;
}

const UnmatchedLoanCard: React.FC<UnmatchedLoanCardProps> = ({ loan, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedLoan, setEditedLoan] = useState(loan);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch properties for dropdown (public endpoint)
  const { data: propertiesData, isLoading: propertiesLoading, error: propertiesError } = useQuery({
    queryKey: ['/api/properties/public'],
    queryFn: () => apiRequest('/api/properties/public')
  });

  // Ensure properties is always an array
  const properties = Array.isArray(propertiesData) ? propertiesData : [];

  // Save manual review mutation
  const saveManualReviewMutation = useMutation({
    mutationFn: async (reviewData: any) => {
      return apiRequest('/api/statements/manual-review', {
        method: 'POST',
        body: JSON.stringify(reviewData)
      });
    },
    onSuccess: () => {
      toast({
        title: "Loan Updated",
        description: "Manual review saved successfully"
      });
      onSave();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save manual review",
        variant: "destructive"
      });
    }
  });

  const handleSave = () => {
    if (!selectedPropertyId) {
      toast({
        title: "Error",
        description: "Please select a property",
        variant: "destructive"
      });
      return;
    }

    const reviewData = {
      originalLoan: loan,
      editedLoan: editedLoan,
      propertyId: parseInt(selectedPropertyId),
      manualReview: true
    };

    saveManualReviewMutation.mutate(reviewData);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (!isEditing) {
    return (
      <Card className="border-l-4 border-l-orange-500 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h4 className="font-semibold text-gray-900">
                {loan.propertyAddress || 'Unknown Property'}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {loan.lender} • {formatCurrency(loan.balance)} • {loan.loanId}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-orange-100 text-orange-800">
                Needs Review
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>
          </div>
          
          {/* Enhanced loan information display */}
          <div className="space-y-4">
            {/* Payment Information */}
            <div className="bg-green-50 p-3 rounded">
              <h5 className="font-medium text-green-800 mb-2">Payment Information</h5>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Monthly Payment:</span>
                  <span className="font-medium ml-2">
                    ${(loan.monthlyPayment || loan.additionalInfo?.monthlyPayment || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Interest Rate:</span>
                  <span className="font-medium ml-2">
                    {loan.interestRate || loan.additionalInfo?.interestRate || 'N/A'}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Next Payment:</span>
                  <span className="font-medium ml-2">
                    {loan.nextPaymentDate || loan.additionalInfo?.nextPaymentDate || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Late Fee After:</span>
                  <span className="font-medium ml-2">
                    {loan.additionalInfo?.lateFeeAfterDate || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Account Balances */}
            <div className="bg-blue-50 p-3 rounded">
              <h5 className="font-medium text-blue-800 mb-2">Account Balances</h5>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Principal Balance:</span>
                  <span className="font-bold ml-2">${loan.balance.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-600">Escrow Balance:</span>
                  <span className="font-medium ml-2">
                    ${(loan.additionalInfo?.escrowBalance || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Unapplied Funds:</span>
                  <span className="font-medium ml-2">
                    ${(loan.additionalInfo?.unappliedFunds || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Past Due:</span>
                  <span className={`font-medium ml-2 ${(loan.additionalInfo?.pastDueAmount || 0) > 0 ? 'text-red-600' : 'text-gray-700'}`}>
                    ${(loan.additionalInfo?.pastDueAmount || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Loan Terms (if available) */}
            {(loan.additionalInfo?.originalLoanAmount || loan.additionalInfo?.maturityDate || loan.additionalInfo?.prepaymentPenalty) && (
              <div className="bg-purple-50 p-3 rounded">
                <h5 className="font-medium text-purple-800 mb-2">Loan Terms</h5>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {loan.additionalInfo?.originalLoanAmount && (
                    <div>
                      <span className="text-gray-600">Original Amount:</span>
                      <span className="font-medium ml-2">
                        ${loan.additionalInfo.originalLoanAmount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {loan.additionalInfo?.maturityDate && (
                    <div>
                      <span className="text-gray-600">Maturity Date:</span>
                      <span className="font-medium ml-2">{loan.additionalInfo.maturityDate}</span>
                    </div>
                  )}
                  {loan.additionalInfo?.prepaymentPenalty && (
                    <div>
                      <span className="text-gray-600">Prepayment Penalty:</span>
                      <span className="font-medium ml-2">{loan.additionalInfo.prepaymentPenalty}</span>
                    </div>
                  )}
                  {loan.additionalInfo?.maxLateFee && (
                    <div>
                      <span className="text-gray-600">Max Late Fee:</span>
                      <span className="font-medium ml-2">
                        ${loan.additionalInfo.maxLateFee.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-blue-500 bg-blue-50 max-w-4xl">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h4 className="font-semibold text-gray-900">Manual Review</h4>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saveManualReviewMutation.isPending}
            >
              <Save className="h-4 w-4 mr-1" />
              {saveManualReviewMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Label htmlFor="property-select">Select Property</Label>
            <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a property" />
              </SelectTrigger>
              <SelectContent>
                {propertiesLoading ? (
                  <SelectItem value="loading" disabled>Loading properties...</SelectItem>
                ) : propertiesError ? (
                  <SelectItem value="error" disabled>Error loading properties</SelectItem>
                ) : properties.length === 0 ? (
                  <SelectItem value="empty" disabled>No properties available</SelectItem>
                ) : (
                  properties.map((property: any) => (
                    <SelectItem key={property.id} value={property.id.toString()}>
                      {property.address} - {property.propertyName}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="lender">Lender</Label>
            <Input
              id="lender"
              value={editedLoan.lender}
              onChange={(e) => setEditedLoan({...editedLoan, lender: e.target.value})}
            />
          </div>

          <div>
            <Label htmlFor="balance">Current Balance</Label>
            <Input
              id="balance"
              type="number"
              value={editedLoan.balance}
              onChange={(e) => setEditedLoan({...editedLoan, balance: parseFloat(e.target.value) || 0})}
            />
          </div>

          <div>
            <Label htmlFor="monthly-payment">Monthly Payment</Label>
            <Input
              id="monthly-payment"
              type="number"
              value={editedLoan.monthlyPayment || ''}
              onChange={(e) => setEditedLoan({...editedLoan, monthlyPayment: parseFloat(e.target.value) || 0})}
            />
          </div>

          <div>
            <Label htmlFor="interest-rate">Interest Rate (%)</Label>
            <Input
              id="interest-rate"
              type="number"
              step="0.01"
              value={editedLoan.interestRate || ''}
              onChange={(e) => setEditedLoan({...editedLoan, interestRate: parseFloat(e.target.value) || 0})}
            />
          </div>

          <div>
            <Label htmlFor="loan-id">Loan ID</Label>
            <Input
              id="loan-id"
              value={editedLoan.loanId}
              onChange={(e) => setEditedLoan({...editedLoan, loanId: e.target.value})}
            />
          </div>

          <div>
            <Label htmlFor="escrow-balance">Escrow Balance</Label>
            <Input
              id="escrow-balance"
              type="number"
              step="0.01"
              value={editedLoan.escrowBalance || 0}
              onChange={(e) => setEditedLoan({...editedLoan, escrowBalance: parseFloat(e.target.value) || 0})}
              className="text-green-600 font-medium"
            />
          </div>

          <div>
            <Label htmlFor="property-address">Property Address</Label>
            <Input
              id="property-address"
              value={editedLoan.propertyAddress || editedLoan.address || ''}
              onChange={(e) => setEditedLoan({...editedLoan, propertyAddress: e.target.value})}
            />
          </div>
        </div>

        {editedLoan.additionalInfo && (
          <div className="mt-6 col-span-full">
            <Label className="text-lg font-semibold text-gray-900">Comprehensive Mortgage Statement Details</Label>
            
            {/* Payment Information Section */}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-3">Payment Information</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><span className="font-medium">Monthly Payment:</span> ${editedLoan.monthlyPayment?.toLocaleString() || 'N/A'}</div>
                <div><span className="font-medium">Interest Rate:</span> {editedLoan.interestRate}%</div>
                <div><span className="font-medium">Next Payment:</span> {editedLoan.nextPaymentDate || 'N/A'}</div>
                <div><span className="font-medium">Amount Due:</span> ${editedLoan.nextPaymentAmount?.toLocaleString() || 'N/A'}</div>
                <div><span className="font-medium">Last Payment:</span> {editedLoan.lastPaymentDate || 'N/A'}</div>
                <div><span className="font-medium">Last Amount:</span> ${editedLoan.lastPaymentAmount?.toLocaleString() || 'N/A'}</div>
                <div><span className="font-medium">Past Due:</span> <span className="text-red-600">${editedLoan.additionalInfo?.pastDueAmount?.toLocaleString() || '0'}</span></div>
                <div><span className="font-medium">Late Fee:</span> ${editedLoan.additionalInfo?.maxLateFee?.toLocaleString() || '0'}</div>
              </div>
            </div>

            {/* Account Balances Section */}
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-3">Account Balances</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><span className="font-medium">Principal Balance:</span> ${editedLoan.balance?.toLocaleString() || 'N/A'}</div>
                <div><span className="font-medium">Escrow Balance:</span> <span className="text-green-600">${editedLoan.escrowBalance?.toLocaleString() || '0'}</span></div>
                <div><span className="font-medium">Unapplied Funds:</span> ${editedLoan.additionalInfo?.unappliedFunds?.toLocaleString() || '0'}</div>
                <div><span className="font-medium">Deferred Balance:</span> ${editedLoan.additionalInfo?.deferredBalance?.toLocaleString() || '0'}</div>
                <div><span className="font-medium">Reserve Balance:</span> ${editedLoan.additionalInfo?.replacementReserveBalance?.toLocaleString() || '0'}</div>
                <div><span className="font-medium">Total Due:</span> ${editedLoan.additionalInfo?.totalAmountDue?.toLocaleString() || 'N/A'}</div>
              </div>
            </div>

            {/* Loan Terms Section */}
            <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-3">Loan Terms</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><span className="font-medium">Remaining Term:</span> {editedLoan.remainingTerm || 'N/A'} months</div>
                <div><span className="font-medium">Prepayment Penalty:</span> {editedLoan.additionalInfo?.prepaymentPenalty || 'N/A'}</div>
                <div><span className="font-medium">Original Amount:</span> ${editedLoan.additionalInfo?.originalLoanAmount?.toLocaleString() || 'N/A'}</div>
                <div><span className="font-medium">Loan Type:</span> {editedLoan.additionalInfo?.loanType || 'N/A'}</div>
                <div><span className="font-medium">Maturity Date:</span> {editedLoan.additionalInfo?.maturityDate || 'N/A'}</div>
                <div><span className="font-medium">Late Fee After:</span> {editedLoan.additionalInfo?.lateFeeAfterDate || 'N/A'}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UnmatchedLoanCard;