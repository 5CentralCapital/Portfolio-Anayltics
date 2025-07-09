import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Home, DollarSign, FileText, Settings, Gavel, Shield, X } from 'lucide-react';

interface TenantDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantData: any;
  unitNumber: string;
}

export function TenantDetailsModal({ isOpen, onClose, tenantData, unitNumber }: TenantDetailsModalProps) {
  if (!tenantData) return null;

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Tenant Details - Unit {unitNumber}
          </DialogTitle>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tenant Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-blue-500" />
                Tenant Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Name</label>
                <p className="text-sm">{tenantData.tenantName || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Address</label>
                <p className="text-sm">{tenantData.tenantAddress || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Phone</label>
                <p className="text-sm">{tenantData.tenantPhone || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Email</label>
                <p className="text-sm">{tenantData.tenantEmail || 'Not specified'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Lease Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-green-500" />
                Lease Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Lease Period</label>
                <p className="text-sm">
                  {formatDate(tenantData.leaseStartDate)} - {formatDate(tenantData.leaseEndDate)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Monthly Rent</label>
                <p className="text-sm font-bold text-green-600">{formatCurrency(tenantData.monthlyRent)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Security Deposit</label>
                <p className="text-sm">{formatCurrency(tenantData.securityDeposit)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Total Move-in Cost</label>
                <p className="text-sm">{formatCurrency(tenantData.totalMoveInCost)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Rent Due Date</label>
                <p className="text-sm">{tenantData.rentDueDate || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Late Fee</label>
                <p className="text-sm">{formatCurrency(tenantData.lateFee)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5 text-yellow-500" />
                Financial Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-3 rounded-lg">
                  <label className="text-xs font-medium text-green-700">Monthly Rent</label>
                  <p className="text-lg font-bold text-green-800">{formatCurrency(tenantData.monthlyRent)}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <label className="text-xs font-medium text-blue-700">Security Deposit</label>
                  <p className="text-lg font-bold text-blue-800">{formatCurrency(tenantData.securityDeposit)}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Lock-out Charge</label>
                <p className="text-sm">{formatCurrency(tenantData.lockOutCharge)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Automatic Payment</label>
                <Badge variant={tenantData.automaticPaymentAuth ? 'default' : 'secondary'}>
                  {tenantData.automaticPaymentAuth ? 'Authorized' : 'Not Authorized'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Property Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="h-5 w-5 text-orange-500" />
                Property Rules & Policies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Utilities Responsibility</label>
                <p className="text-sm">{tenantData.utilitiesResponsibility || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Pet Policy</label>
                <p className="text-sm">{tenantData.petPolicy || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Smoking Policy</label>
                <p className="text-sm">{tenantData.smokingPolicy || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Guest Policy</label>
                <p className="text-sm">{tenantData.guestPolicy || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Alteration Policy</label>
                <p className="text-sm">{tenantData.alterationPolicy || 'Not specified'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Maintenance & Moving */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Home className="h-5 w-5 text-purple-500" />
                Maintenance & Moving
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Maintenance Policy</label>
                <p className="text-sm">{tenantData.maintenancePolicy || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Moving Out Notice</label>
                <p className="text-sm">{tenantData.movingOutNotice || 'Not specified'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Legal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Gavel className="h-5 w-5 text-red-500" />
                Legal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Governing Law</label>
                <p className="text-sm">{tenantData.governingLaw || 'Not specified'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          {tenantData.paymentMethods && tenantData.paymentMethods.length > 0 && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5 text-indigo-500" />
                  Accepted Payment Methods
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {tenantData.paymentMethods.map((method: string, index: number) => (
                    <Badge key={index} variant="outline">{method}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}