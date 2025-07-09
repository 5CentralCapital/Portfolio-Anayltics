import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  DollarSign, 
  Home, 
  FileText, 
  Save, 
  Edit, 
  AlertCircle,
  CheckCircle,
  Loader2,
  Users
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../hooks/use-toast';

interface TenantDetails {
  id?: number;
  propertyId: number;
  tenantName: string;
  unitNumber?: string;
  phoneNumber?: string;
  emailAddress?: string;
  leaseStartDate?: string;
  leaseEndDate?: string;
  monthlyRent?: string;
  securityDeposit?: string;
  petDeposit?: string;
  utilities?: string;
  petPolicy?: string;
  additionalNotes?: string;
  leaseTerm?: string;
  lateFee?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface TenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantName: string;
  propertyId: number;
  unitNumber?: string;
}

const TenantModal: React.FC<TenantModalProps> = ({
  isOpen,
  onClose,
  tenantName,
  propertyId,
  unitNumber
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDetails, setEditedDetails] = useState<TenantDetails | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tenant details
  const { data: tenantDetails, isLoading, refetch } = useQuery<TenantDetails>({
    queryKey: ['/api/tenant-details', propertyId, tenantName],
    queryFn: async () => {
      const response = await fetch(`/api/tenant-details/${propertyId}/${encodeURIComponent(tenantName)}`);
      if (!response.ok) {
        // If no details found, return default structure
        if (response.status === 404) {
          return {
            propertyId,
            tenantName,
            unitNumber: unitNumber || '',
            phoneNumber: '',
            emailAddress: '',
            leaseStartDate: '',
            leaseEndDate: '',
            monthlyRent: '',
            securityDeposit: '',
            petDeposit: '',
            utilities: '',
            petPolicy: '',
            additionalNotes: '',
            leaseTerm: '',
            lateFee: ''
          };
        }
        throw new Error('Failed to fetch tenant details');
      }
      return response.json();
    },
    enabled: isOpen && !!tenantName && !!propertyId
  });

  // Initialize editing state when tenant details load
  useEffect(() => {
    if (tenantDetails && !editedDetails) {
      setEditedDetails(tenantDetails);
    }
  }, [tenantDetails, editedDetails]);

  // Save tenant details mutation
  const saveMutation = useMutation({
    mutationFn: async (details: TenantDetails) => {
      const method = details.id ? 'PUT' : 'POST';
      const url = details.id 
        ? `/api/tenant-details/${details.id}`
        : '/api/tenant-details';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(details),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save tenant details');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Details Saved",
        description: "Tenant details have been successfully updated.",
      });
      setIsEditing(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save tenant details.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (editedDetails) {
      saveMutation.mutate(editedDetails);
    }
  };

  const handleCancel = () => {
    setEditedDetails(tenantDetails);
    setIsEditing(false);
  };

  const updateField = (field: keyof TenantDetails, value: string) => {
    setEditedDetails(prev => prev ? { ...prev, [field]: value } : null);
  };

  const formatCurrency = (amount: string | undefined) => {
    if (!amount || amount === '0') return 'Not specified';
    const num = parseFloat(amount);
    return isNaN(num) ? amount : `$${num.toLocaleString()}`;
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'Not specified';
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Users className="h-6 w-6 text-blue-500" />
            {tenantName}
            {isEditing && <Badge variant="secondary">Editing</Badge>}
          </DialogTitle>
          <DialogDescription>
            Comprehensive tenant information and lease details
            {unitNumber && ` • Unit ${unitNumber}`}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2">Loading tenant details...</span>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="lease">Lease Details</TabsTrigger>
              <TabsTrigger value="notes">Notes & Policies</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="tenantName">Tenant Name</Label>
                        <Input
                          id="tenantName"
                          value={editedDetails?.tenantName || ''}
                          onChange={(e) => updateField('tenantName', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="unitNumber">Unit Number</Label>
                        <Input
                          id="unitNumber"
                          value={editedDetails?.unitNumber || ''}
                          onChange={(e) => updateField('unitNumber', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        <Input
                          id="phoneNumber"
                          value={editedDetails?.phoneNumber || ''}
                          onChange={(e) => updateField('phoneNumber', e.target.value)}
                          placeholder="(xxx) xxx-xxxx"
                        />
                      </div>
                      <div>
                        <Label htmlFor="emailAddress">Email Address</Label>
                        <Input
                          id="emailAddress"
                          type="email"
                          value={editedDetails?.emailAddress || ''}
                          onChange={(e) => updateField('emailAddress', e.target.value)}
                          placeholder="tenant@email.com"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">Name:</span>
                          <span>{tenantDetails?.tenantName || 'Not specified'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">Unit:</span>
                          <span>{tenantDetails?.unitNumber || 'Not specified'}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">Phone:</span>
                          <span>{tenantDetails?.phoneNumber || 'Not specified'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">Email:</span>
                          <span>{tenantDetails?.emailAddress || 'Not specified'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="lease" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Lease Terms
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="leaseStartDate">Lease Start Date</Label>
                        <Input
                          id="leaseStartDate"
                          type="date"
                          value={editedDetails?.leaseStartDate || ''}
                          onChange={(e) => updateField('leaseStartDate', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="leaseEndDate">Lease End Date</Label>
                        <Input
                          id="leaseEndDate"
                          type="date"
                          value={editedDetails?.leaseEndDate || ''}
                          onChange={(e) => updateField('leaseEndDate', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="monthlyRent">Monthly Rent</Label>
                        <Input
                          id="monthlyRent"
                          type="number"
                          step="0.01"
                          value={editedDetails?.monthlyRent || ''}
                          onChange={(e) => updateField('monthlyRent', e.target.value)}
                          placeholder="1500.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="leaseTerm">Lease Term</Label>
                        <Input
                          id="leaseTerm"
                          value={editedDetails?.leaseTerm || ''}
                          onChange={(e) => updateField('leaseTerm', e.target.value)}
                          placeholder="12 months"
                        />
                      </div>
                      <div>
                        <Label htmlFor="securityDeposit">Security Deposit</Label>
                        <Input
                          id="securityDeposit"
                          type="number"
                          step="0.01"
                          value={editedDetails?.securityDeposit || ''}
                          onChange={(e) => updateField('securityDeposit', e.target.value)}
                          placeholder="1500.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="petDeposit">Pet Deposit</Label>
                        <Input
                          id="petDeposit"
                          type="number"
                          step="0.01"
                          value={editedDetails?.petDeposit || ''}
                          onChange={(e) => updateField('petDeposit', e.target.value)}
                          placeholder="250.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lateFee">Late Fee</Label>
                        <Input
                          id="lateFee"
                          type="number"
                          step="0.01"
                          value={editedDetails?.lateFee || ''}
                          onChange={(e) => updateField('lateFee', e.target.value)}
                          placeholder="100.00"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">Lease Start:</span>
                          <span>{formatDate(tenantDetails?.leaseStartDate)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">Lease End:</span>
                          <span>{formatDate(tenantDetails?.leaseEndDate)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">Monthly Rent:</span>
                          <span>{formatCurrency(tenantDetails?.monthlyRent)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">Lease Term:</span>
                          <span>{tenantDetails?.leaseTerm || 'Not specified'}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">Security Deposit:</span>
                          <span>{formatCurrency(tenantDetails?.securityDeposit)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">Pet Deposit:</span>
                          <span>{formatCurrency(tenantDetails?.petDeposit)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">Late Fee:</span>
                          <span>{formatCurrency(tenantDetails?.lateFee)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Utilities & Policies</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isEditing ? (
                      <>
                        <div>
                          <Label htmlFor="utilities">Utilities</Label>
                          <Input
                            id="utilities"
                            value={editedDetails?.utilities || ''}
                            onChange={(e) => updateField('utilities', e.target.value)}
                            placeholder="Electric, Water, Gas..."
                          />
                        </div>
                        <div>
                          <Label htmlFor="petPolicy">Pet Policy</Label>
                          <Input
                            id="petPolicy"
                            value={editedDetails?.petPolicy || ''}
                            onChange={(e) => updateField('petPolicy', e.target.value)}
                            placeholder="No pets, Cats only, etc."
                          />
                        </div>
                      </>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <span className="font-medium text-gray-700">Utilities:</span>
                          <p className="text-sm mt-1">{tenantDetails?.utilities || 'Not specified'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Pet Policy:</span>
                          <p className="text-sm mt-1">{tenantDetails?.petPolicy || 'Not specified'}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Additional Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <div>
                        <Label htmlFor="additionalNotes">Notes</Label>
                        <Textarea
                          id="additionalNotes"
                          value={editedDetails?.additionalNotes || ''}
                          onChange={(e) => updateField('additionalNotes', e.target.value)}
                          placeholder="Additional lease details, special agreements, maintenance notes..."
                          rows={6}
                        />
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm whitespace-pre-wrap">
                          {tenantDetails?.additionalNotes || 'No additional notes'}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Details
              </Button>
            </>
          )}
        </div>

        {/* Status Indicators */}
        {tenantDetails?.createdAt && (
          <div className="text-xs text-gray-500 text-center pt-2 border-t">
            Created: {formatDate(tenantDetails.createdAt)}
            {tenantDetails.updatedAt && tenantDetails.updatedAt !== tenantDetails.createdAt && (
              <> • Updated: {formatDate(tenantDetails.updatedAt)}</>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TenantModal;