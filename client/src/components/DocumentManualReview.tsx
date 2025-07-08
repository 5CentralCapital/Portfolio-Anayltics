import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Edit3, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

interface DocumentManualReviewProps {
  processingResult: any;
  onSave: (reviewedData: any) => void;
  onCancel: () => void;
}

export function DocumentManualReview({ processingResult, onSave, onCancel }: DocumentManualReviewProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [editedData, setEditedData] = useState(processingResult.extractedData || {});
  const { toast } = useToast();

  // Fetch properties for dropdown
  const { data: properties = [], isLoading: propertiesLoading } = useQuery({
    queryKey: ['/api/properties'],
    queryFn: async () => {
      const response = await fetch('/api/properties', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch properties');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
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

    const reviewedData = {
      ...processingResult,
      extractedData: editedData,
      propertyId: parseInt(selectedPropertyId),
      manualReview: true,
      confidence: 1.0 // Manual review means 100% confidence
    };

    onSave(reviewedData);
  };

  const formatCurrency = (amount: number) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const renderDocumentData = () => {
    const { documentType } = processingResult;

    switch (documentType) {
      case 'lease':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tenantNames">Tenant Names</Label>
                <Input
                  id="tenantNames"
                  value={editedData.tenantNames?.join(', ') || ''}
                  onChange={(e) => setEditedData({
                    ...editedData,
                    tenantNames: e.target.value.split(',').map(name => name.trim())
                  })}
                  placeholder="John Doe, Jane Smith"
                />
              </div>
              <div>
                <Label htmlFor="propertyAddress">Property Address</Label>
                <Input
                  id="propertyAddress"
                  value={editedData.propertyAddress || ''}
                  onChange={(e) => setEditedData({
                    ...editedData,
                    propertyAddress: e.target.value
                  })}
                  placeholder="123 Main St, City, State"
                />
              </div>
              <div>
                <Label htmlFor="monthlyRent">Monthly Rent</Label>
                <Input
                  id="monthlyRent"
                  type="number"
                  value={editedData.monthlyRent || ''}
                  onChange={(e) => setEditedData({
                    ...editedData,
                    monthlyRent: parseFloat(e.target.value) || 0
                  })}
                  placeholder="1500"
                />
              </div>
              <div>
                <Label htmlFor="securityDeposit">Security Deposit</Label>
                <Input
                  id="securityDeposit"
                  type="number"
                  value={editedData.securityDeposit || ''}
                  onChange={(e) => setEditedData({
                    ...editedData,
                    securityDeposit: parseFloat(e.target.value) || 0
                  })}
                  placeholder="1500"
                />
              </div>
              <div>
                <Label htmlFor="leaseStartDate">Lease Start Date</Label>
                <Input
                  id="leaseStartDate"
                  type="date"
                  value={editedData.leaseStartDate || ''}
                  onChange={(e) => setEditedData({
                    ...editedData,
                    leaseStartDate: e.target.value
                  })}
                />
              </div>
              <div>
                <Label htmlFor="leaseEndDate">Lease End Date</Label>
                <Input
                  id="leaseEndDate"
                  type="date"
                  value={editedData.leaseEndDate || ''}
                  onChange={(e) => setEditedData({
                    ...editedData,
                    leaseEndDate: e.target.value
                  })}
                />
              </div>
            </div>
          </div>
        );

      case 'mortgage_statement':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="lenderName">Lender Name</Label>
                <Input
                  id="lenderName"
                  value={editedData.lenderName || ''}
                  onChange={(e) => setEditedData({
                    ...editedData,
                    lenderName: e.target.value
                  })}
                  placeholder="Wells Fargo"
                />
              </div>
              <div>
                <Label htmlFor="loanNumber">Loan Number</Label>
                <Input
                  id="loanNumber"
                  value={editedData.loanNumber || ''}
                  onChange={(e) => setEditedData({
                    ...editedData,
                    loanNumber: e.target.value
                  })}
                  placeholder="WF123456789"
                />
              </div>
              <div>
                <Label htmlFor="currentBalance">Current Balance</Label>
                <Input
                  id="currentBalance"
                  type="number"
                  value={editedData.currentBalance || ''}
                  onChange={(e) => setEditedData({
                    ...editedData,
                    currentBalance: parseFloat(e.target.value) || 0
                  })}
                  placeholder="245000"
                />
              </div>
              <div>
                <Label htmlFor="monthlyPayment">Monthly Payment</Label>
                <Input
                  id="monthlyPayment"
                  type="number"
                  value={editedData.monthlyPayment || ''}
                  onChange={(e) => setEditedData({
                    ...editedData,
                    monthlyPayment: parseFloat(e.target.value) || 0
                  })}
                  placeholder="1850"
                />
              </div>
              <div>
                <Label htmlFor="interestRate">Interest Rate (%)</Label>
                <Input
                  id="interestRate"
                  type="number"
                  step="0.01"
                  value={editedData.interestRate || ''}
                  onChange={(e) => setEditedData({
                    ...editedData,
                    interestRate: parseFloat(e.target.value) || 0
                  })}
                  placeholder="6.5"
                />
              </div>
              <div>
                <Label htmlFor="nextPaymentDate">Next Payment Date</Label>
                <Input
                  id="nextPaymentDate"
                  type="date"
                  value={editedData.nextPaymentDate || ''}
                  onChange={(e) => setEditedData({
                    ...editedData,
                    nextPaymentDate: e.target.value
                  })}
                />
              </div>
            </div>
          </div>
        );

      case 'llc_document':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="entityName">Entity Name</Label>
                <Input
                  id="entityName"
                  value={editedData.entityName || ''}
                  onChange={(e) => setEditedData({
                    ...editedData,
                    entityName: e.target.value
                  })}
                  placeholder="5Central Capital LLC"
                />
              </div>
              <div>
                <Label htmlFor="entityType">Entity Type</Label>
                <Input
                  id="entityType"
                  value={editedData.entityType || ''}
                  onChange={(e) => setEditedData({
                    ...editedData,
                    entityType: e.target.value
                  })}
                  placeholder="Limited Liability Company"
                />
              </div>
              <div>
                <Label htmlFor="formationDate">Formation Date</Label>
                <Input
                  id="formationDate"
                  type="date"
                  value={editedData.formationDate || ''}
                  onChange={(e) => setEditedData({
                    ...editedData,
                    formationDate: e.target.value
                  })}
                />
              </div>
              <div>
                <Label htmlFor="registeredAddress">Registered Address</Label>
                <Input
                  id="registeredAddress"
                  value={editedData.registeredAddress || ''}
                  onChange={(e) => setEditedData({
                    ...editedData,
                    registeredAddress: e.target.value
                  })}
                  placeholder="123 Business Ave, City, State"
                />
              </div>
            </div>
            <div>
              <Label>Members</Label>
              <Textarea
                value={JSON.stringify(editedData.members || [], null, 2)}
                onChange={(e) => {
                  try {
                    setEditedData({
                      ...editedData,
                      members: JSON.parse(e.target.value)
                    });
                  } catch (error) {
                    // Keep the original value if parsing fails
                  }
                }}
                rows={6}
                className="font-mono text-sm"
                placeholder='[{"name": "John Doe", "ownershipPercentage": 100, "role": "Manager"}]'
              />
            </div>
          </div>
        );

      default:
        return (
          <div>
            <Label>Raw Data (JSON)</Label>
            <Textarea
              value={JSON.stringify(editedData, null, 2)}
              onChange={(e) => {
                try {
                  setEditedData(JSON.parse(e.target.value));
                } catch (error) {
                  // Keep the text as is if invalid JSON
                }
              }}
              rows={10}
              className="font-mono text-sm"
              placeholder="Edit the extracted data..."
            />
          </div>
        );
    }
  };

  return (
    <Card className="border-l-4 border-l-orange-500 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit3 className="h-5 w-5" />
          Manual Review & Correction
        </CardTitle>
        <CardDescription>
          Review and edit the extracted {processingResult.documentType} data before applying to your property records.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Document Info */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-orange-100 text-orange-800">
            {processingResult.documentType.replace('_', ' ').toUpperCase()}
          </Badge>
          <Badge variant="outline">
            {Math.round(processingResult.confidence * 100)}% Confidence
          </Badge>
        </div>

        {/* Property Selection */}
        <div>
          <Label htmlFor="property-select">Assign to Property</Label>
          <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
            <SelectTrigger>
              <SelectValue placeholder="Select property" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No property selected</SelectItem>
              {propertiesLoading && (
                <SelectItem value="loading" disabled>Loading properties...</SelectItem>
              )}
              {properties.map((property: any) => (
                <SelectItem key={property.id} value={property.id.toString()}>
                  {property.address} ({property.apartments} units)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Document-specific fields */}
        {renderDocumentData()}

        {/* Action buttons */}
        <div className="flex gap-2 pt-4">
          <Button onClick={onCancel} variant="outline">
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!selectedPropertyId}>
            <Save className="h-4 w-4 mr-2" />
            Save Review
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}