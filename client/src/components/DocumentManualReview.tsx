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
  const { data: propertiesData, isLoading: propertiesLoading, error: propertiesError } = useQuery({
    queryKey: ['/api/properties'],
    queryFn: async () => {
      const response = await fetch('/api/properties', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        if (response.status === 401) {
          return []; // Return empty array for auth issues
        }
        throw new Error('Failed to fetch properties');
      }
      const data = await response.json();
      return data;
    },
    retry: false // Don't retry auth failures
  });

  // Ensure properties is always an array
  const properties = Array.isArray(propertiesData) ? propertiesData : [];

  // Debug logging
  console.log('Properties data:', propertiesData);
  console.log('Properties array:', properties);
  console.log('Properties error:', propertiesError);

  const handleSave = () => {
    if (!selectedPropertyId || selectedPropertyId === 'none') {
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
      propertyId: selectedPropertyId === 'none' ? null : parseInt(selectedPropertyId),
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

      case 'insurance_policy':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="insuranceCompany">Insurance Company</Label>
                <Input
                  id="insuranceCompany"
                  value={editedData.insuranceCompany || ''}
                  onChange={(e) => setEditedData({
                    ...editedData,
                    insuranceCompany: e.target.value
                  })}
                  placeholder="State Farm"
                />
              </div>
              <div>
                <Label htmlFor="policyNumber">Policy Number</Label>
                <Input
                  id="policyNumber"
                  value={editedData.policyNumber || ''}
                  onChange={(e) => setEditedData({
                    ...editedData,
                    policyNumber: e.target.value
                  })}
                  placeholder="SF123456789"
                />
              </div>
              <div>
                <Label htmlFor="coverageAmount">Coverage Amount</Label>
                <Input
                  id="coverageAmount"
                  type="number"
                  value={editedData.coverageAmount || ''}
                  onChange={(e) => setEditedData({
                    ...editedData,
                    coverageAmount: parseFloat(e.target.value) || 0
                  })}
                  placeholder="250000"
                />
              </div>
              <div>
                <Label htmlFor="annualPremium">Annual Premium</Label>
                <Input
                  id="annualPremium"
                  type="number"
                  value={editedData.annualPremium || ''}
                  onChange={(e) => setEditedData({
                    ...editedData,
                    annualPremium: parseFloat(e.target.value) || 0
                  })}
                  placeholder="1200"
                />
              </div>
            </div>
          </div>
        );

      case 'vendor_invoice':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vendorName">Vendor/Contractor</Label>
                <Input
                  id="vendorName"
                  value={editedData.vendorName || ''}
                  onChange={(e) => setEditedData({
                    ...editedData,
                    vendorName: e.target.value
                  })}
                  placeholder="ABC Plumbing"
                />
              </div>
              <div>
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input
                  id="invoiceNumber"
                  value={editedData.invoiceNumber || ''}
                  onChange={(e) => setEditedData({
                    ...editedData,
                    invoiceNumber: e.target.value
                  })}
                  placeholder="INV-001"
                />
              </div>
              <div>
                <Label htmlFor="invoiceAmount">Invoice Amount</Label>
                <Input
                  id="invoiceAmount"
                  type="number"
                  value={editedData.invoiceAmount || ''}
                  onChange={(e) => setEditedData({
                    ...editedData,
                    invoiceAmount: parseFloat(e.target.value) || 0
                  })}
                  placeholder="350"
                />
              </div>
              <div>
                <Label htmlFor="serviceDate">Service Date</Label>
                <Input
                  id="serviceDate"
                  type="date"
                  value={editedData.serviceDate || ''}
                  onChange={(e) => setEditedData({
                    ...editedData,
                    serviceDate: e.target.value
                  })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="workDescription">Work Description</Label>
              <Textarea
                id="workDescription"
                value={editedData.workDescription || ''}
                onChange={(e) => setEditedData({
                  ...editedData,
                  workDescription: e.target.value
                })}
                rows={3}
                placeholder="Description of work performed..."
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2">Unknown Document Type</h4>
              <p className="text-sm text-blue-600">
                This document type isn't specifically recognized. You can still extract and store key information below.
              </p>
            </div>
            
            {/* Key-Value pairs for flexible data entry */}
            <div className="space-y-3">
              <Label>Key Information</Label>
              {Object.entries(editedData || {}).map(([key, value], index) => (
                <div key={`field-${index}`} className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Field name (e.g., 'Total Amount')"
                    value={key}
                    onChange={(e) => {
                      const newData = { ...editedData };
                      delete newData[key];
                      if (e.target.value) {
                        newData[e.target.value] = value;
                      }
                      setEditedData(newData);
                    }}
                  />
                  <Input
                    placeholder="Value"
                    value={value?.toString() || ''}
                    onChange={(e) => setEditedData({
                      ...editedData,
                      [key]: e.target.value
                    })}
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditedData({
                  ...editedData,
                  [`field_${Object.keys(editedData || {}).length + 1}`]: ''
                })}
              >
                Add Field
              </Button>
            </div>
            
            <div>
              <Label>Raw Extracted Data (Advanced)</Label>
              <Textarea
                value={JSON.stringify(editedData, null, 2)}
                onChange={(e) => {
                  try {
                    setEditedData(JSON.parse(e.target.value));
                  } catch (error) {
                    // Keep the text as is if invalid JSON
                  }
                }}
                rows={6}
                className="font-mono text-sm"
                placeholder="Advanced JSON editing..."
              />
            </div>
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
              <SelectItem value="none">No property selected</SelectItem>
              {propertiesLoading && (
                <SelectItem value="loading" disabled>Loading properties...</SelectItem>
              )}
              {propertiesError && (
                <SelectItem value="error" disabled>Authentication required</SelectItem>
              )}
              {properties.length > 0 ? properties.map((property: any) => (
                <SelectItem key={property.id} value={property.id.toString()}>
                  {property.address || 'No address'} ({property.apartments || 0} units)
                </SelectItem>
              )) : !propertiesLoading && !propertiesError && (
                <SelectItem value="no-props" disabled>No properties available</SelectItem>
              )}
            </SelectContent>
          </Select>
          {propertiesError && (
            <p className="text-sm text-orange-600 mt-1">
              Please log in to see your properties, or continue without assigning to a property.
            </p>
          )}
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