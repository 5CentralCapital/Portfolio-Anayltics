import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { AlertCircle, CheckCircle, Edit, Save, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '../hooks/use-toast';

interface Property {
  id: number;
  address: string;
  apartments: number;
  status: string;
}

interface UnmatchedLease {
  tenant: string;
  address?: string;
  rent: number;
  leaseStart?: string;
  leaseEnd?: string;
  phone?: string;
  email?: string;
  unitNumber?: string;
  securityDeposit?: number;
  petDeposit?: number;
  utilities?: string;
  petPolicy?: string;
  notes?: string;
}

interface UnmatchedLeaseCardProps {
  lease: UnmatchedLease;
  onReviewComplete: () => void;
}

const UnmatchedLeaseCard: React.FC<UnmatchedLeaseCardProps> = ({ 
  lease, 
  onReviewComplete 
}) => {
  const [isEditing, setIsEditing] = useState(true);
  const [editedLease, setEditedLease] = useState<UnmatchedLease & { propertyId?: number }>({
    ...lease,
    propertyId: undefined
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Fetch properties for dropdown
  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
    queryFn: async () => {
      const response = await fetch('/api/properties');
      if (!response.ok) throw new Error('Failed to fetch properties');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    }
  });

  const handleSave = async () => {
    if (!editedLease.propertyId) {
      toast({
        title: "Property Required",
        description: "Please select a property to assign this lease to.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/leases/manual-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalLease: lease,
          editedLease: editedLease,
          propertyId: editedLease.propertyId,
          manualReview: true
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Lease Data Saved",
          description: "Lease has been successfully added to the property rent roll.",
        });
        setIsEditing(false);
        onReviewComplete();
      } else {
        throw new Error(result.message || 'Failed to save lease data');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : 'An error occurred while saving.',
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof UnmatchedLease | 'propertyId', value: any) => {
    setEditedLease(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-yellow-600" />
          Lease Review Required
          {!isEditing && <CheckCircle className="h-5 w-5 text-green-500" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tenant Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-700 border-b pb-1">Tenant Information</h4>
              
              <div>
                <Label htmlFor="tenant">Tenant Name</Label>
                <Input
                  id="tenant"
                  value={editedLease.tenant}
                  onChange={(e) => updateField('tenant', e.target.value)}
                  placeholder="Full tenant name"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={editedLease.phone || ''}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="(xxx) xxx-xxxx"
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={editedLease.email || ''}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="tenant@email.com"
                />
              </div>
            </div>

            {/* Property & Lease Details */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-700 border-b pb-1">Property & Lease</h4>
              
              <div>
                <Label htmlFor="property">Property *</Label>
                <Select 
                  value={editedLease.propertyId?.toString() || ''} 
                  onValueChange={(value) => updateField('propertyId', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map(property => (
                      <SelectItem key={property.id} value={property.id.toString()}>
                        {property.address} ({property.apartments} units)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="unitNumber">Unit Number</Label>
                <Input
                  id="unitNumber"
                  value={editedLease.unitNumber || ''}
                  onChange={(e) => updateField('unitNumber', e.target.value)}
                  placeholder="Unit #"
                />
              </div>

              <div>
                <Label htmlFor="rent">Monthly Rent</Label>
                <Input
                  id="rent"
                  type="number"
                  step="0.01"
                  value={editedLease.rent}
                  onChange={(e) => updateField('rent', parseFloat(e.target.value) || 0)}
                  placeholder="1500.00"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="leaseStart">Lease Start</Label>
                  <Input
                    id="leaseStart"
                    type="date"
                    value={editedLease.leaseStart || ''}
                    onChange={(e) => updateField('leaseStart', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="leaseEnd">Lease End</Label>
                  <Input
                    id="leaseEnd"
                    type="date"
                    value={editedLease.leaseEnd || ''}
                    onChange={(e) => updateField('leaseEnd', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-700 border-b pb-1">Additional Details</h4>
              
              <div>
                <Label htmlFor="securityDeposit">Security Deposit</Label>
                <Input
                  id="securityDeposit"
                  type="number"
                  step="0.01"
                  value={editedLease.securityDeposit || ''}
                  onChange={(e) => updateField('securityDeposit', parseFloat(e.target.value) || 0)}
                  placeholder="1500.00"
                />
              </div>

              <div>
                <Label htmlFor="petDeposit">Pet Deposit</Label>
                <Input
                  id="petDeposit"
                  type="number"
                  step="0.01"
                  value={editedLease.petDeposit || ''}
                  onChange={(e) => updateField('petDeposit', parseFloat(e.target.value) || 0)}
                  placeholder="250.00"
                />
              </div>

              <div>
                <Label htmlFor="utilities">Utilities</Label>
                <Input
                  id="utilities"
                  value={editedLease.utilities || ''}
                  onChange={(e) => updateField('utilities', e.target.value)}
                  placeholder="Electric, Water, etc."
                />
              </div>

              <div>
                <Label htmlFor="petPolicy">Pet Policy</Label>
                <Input
                  id="petPolicy"
                  value={editedLease.petPolicy || ''}
                  onChange={(e) => updateField('petPolicy', e.target.value)}
                  placeholder="No pets, Cats only, etc."
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={editedLease.notes || ''}
                  onChange={(e) => updateField('notes', e.target.value)}
                  placeholder="Additional lease details..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-green-50 rounded border-l-4 border-green-500">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">Lease data saved successfully</span>
            </div>
            <div className="text-sm text-green-600 mt-1">
              {editedLease.tenant} - {properties.find(p => p.id === editedLease.propertyId)?.address}
            </div>
          </div>
        )}

        {isEditing && (
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleSave}
              disabled={saving || !editedLease.propertyId}
              className="flex-1"
            >
              {saving ? (
                <>
                  <Save className="h-4 w-4 mr-2 animate-pulse" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save to Property
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UnmatchedLeaseCard;