import { useState } from 'react';
import { X, Star, StarOff, Trash2, Calculator, MapPin, Calendar, DollarSign, TrendingUp, Home, Users, AlertTriangle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface Property {
  id: number;
  propertyName: string;
  address: string;
  city: string;
  state: string;
  apartments: number;
  acquisitionPrice: string;
  arvAtTimePurchased: string;
  cashOnCashReturn: string;
  cashFlow: string;
  totalProfits: string;
  isFeatured: boolean;
  status: string;
  entity?: string;
  acquisitionDate?: string;
}

interface PropertyModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
}

const PropertyModal: React.FC<PropertyModalProps> = ({ property, isOpen, onClose }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const queryClient = useQueryClient();

  // Feature/unfeature property mutation
  const featureMutation = useMutation({
    mutationFn: async ({ id, isFeatured }: { id: number; isFeatured: boolean }) => {
      const response = await fetch(`/api/properties/${id}/featured`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured }),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to update property');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      queryClient.invalidateQueries({ queryKey: ['/api/properties/featured'] });
    }
  });

  // Delete property mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/properties/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete property');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      queryClient.invalidateQueries({ queryKey: ['/api/properties/featured'] });
      onClose();
    }
  });

  const handleFeatureToggle = () => {
    if (!property) return;
    featureMutation.mutate({ id: property.id, isFeatured: !property.isFeatured });
  };

  const handleDelete = () => {
    if (!property) return;
    deleteMutation.mutate(property.id);
  };

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numValue);
  };

  const formatPercentage = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '0%';
    return `${numValue.toFixed(1)}%`;
  };

  if (!isOpen || !property) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{property.propertyName}</h2>
            <div className="flex items-center text-gray-600 mt-1">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{property.address}, {property.city}, {property.state}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Feature Toggle Button */}
            <button
              onClick={handleFeatureToggle}
              disabled={featureMutation.isPending}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                property.isFeatured
                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={property.isFeatured ? 'Remove from featured' : 'Add to featured'}
            >
              {property.isFeatured ? (
                <StarOff className="h-4 w-4" />
              ) : (
                <Star className="h-4 w-4" />
              )}
              <span>{property.isFeatured ? 'Unfeature' : 'Feature'}</span>
            </button>

            {/* Delete Button */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              title="Delete property"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Property Overview */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Home className="h-5 w-5 mr-2" />
                Property Details
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Units:</span>
                  <span className="font-medium">{property.apartments}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Entity:</span>
                  <span className="font-medium">{property.entity || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    property.status === 'Cashflowing' ? 'bg-green-100 text-green-700' :
                    property.status === 'Rehabbing' ? 'bg-yellow-100 text-yellow-700' :
                    property.status === 'Under Contract' ? 'bg-blue-100 text-blue-700' :
                    property.status === 'Sold' ? 'bg-gray-100 text-gray-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {property.status}
                  </span>
                </div>
                {property.acquisitionDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Acquisition Date:</span>
                    <span className="font-medium">
                      {new Date(property.acquisitionDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Metrics */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Calculator className="h-5 w-5 mr-2" />
                Financial Performance
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Acquisition Price:</span>
                  <span className="font-medium">{formatCurrency(property.acquisitionPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ARV:</span>
                  <span className="font-medium">{formatCurrency(property.arvAtTimePurchased)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Annual Cash Flow:</span>
                  <span className="font-medium text-green-600">{formatCurrency(property.cashFlow)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cash-on-Cash Return:</span>
                  <span className="font-medium text-green-600">{formatPercentage(property.cashOnCashReturn)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Profits:</span>
                  <span className="font-medium text-green-600">{formatCurrency(property.totalProfits)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Featured Status */}
          {property.isFeatured && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <Star className="h-5 w-5 text-yellow-500 mr-2" />
                <span className="text-yellow-800 font-medium">
                  This property is featured on the homepage
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
              <div className="flex items-center mb-4">
                <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Delete Property</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{property.propertyName}"? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyModal;