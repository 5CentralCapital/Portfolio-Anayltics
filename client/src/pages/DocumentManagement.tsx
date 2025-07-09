import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DocumentUpload } from '@/components/DocumentUpload';
import StatementUpload from '@/components/StatementUpload';
import LeaseUpload from '@/components/LeaseUpload';
import { FileText, Clock, CheckCircle, AlertCircle, TrendingUp, Upload, Eye, CreditCard, Trash2, FolderOpen, Loader2 } from 'lucide-react';
import { useQuery, useMutation, queryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface ProcessingHistory {
  id: number;
  fileName: string;
  documentType: string;
  confidence: number;
  success: boolean;
  errors?: string[];
  warnings?: string[];
  suggestedActions?: string[];
  propertyId?: number;
  entityId?: number;
  processedAt: string;
  appliedAt?: string;
  extractedData?: string;
}

interface Property {
  id: number;
  address: string;
  apartments: number;
  status: string;
}

function DocumentManagement() {
  const [selectedProperty, setSelectedProperty] = useState<string>('none');
  const [selectedEntity, setSelectedEntity] = useState<string>('none');
  const [historyFilter, setHistoryFilter] = useState<string>('all');
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o');
  const { toast } = useToast();

  // Add mutations for apply updates and delete
  const applyUpdatesMutation = useMutation({
    mutationFn: async (processingId: number) => {
      const response = await fetch(`/api/ai-documents/apply-updates/${processingId}`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to apply updates');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Updates Applied",
        description: "Document data has been successfully integrated with property records.",
      });
      refetchHistory();
    },
    onError: (error: any) => {
      toast({
        title: "Apply Failed",
        description: error.message || "Failed to apply document updates.",
        variant: "destructive",
      });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (processingId: number) => {
      const response = await fetch(`/api/ai-documents/delete/${processingId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete document');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Document Deleted",
        description: "Document and its data have been permanently removed.",
      });
      refetchHistory();
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete document.",
        variant: "destructive",
      });
    },
  });

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

  // Fetch processing history
  const { data: processingHistory = [], refetch: refetchHistory } = useQuery<ProcessingHistory[]>({
    queryKey: ['/api/ai-documents/history', selectedProperty, selectedEntity],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (selectedProperty && selectedProperty !== 'none') params.append('propertyId', selectedProperty);
        if (selectedEntity && selectedEntity !== 'none') params.append('entityId', selectedEntity);
        
        const response = await fetch(`/api/ai-documents/history?${params}`);
        if (!response.ok) {
          console.warn('Failed to fetch processing history, returning empty array');
          return [];
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.warn('Error fetching processing history:', error);
        return [];
      }
    }
  });

  const filteredHistory = processingHistory.filter(item => {
    switch (historyFilter) {
      case 'success':
        return item.success;
      case 'pending':
        return item.success && !item.appliedAt;
      case 'applied':
        return item.appliedAt;
      case 'errors':
        return !item.success;
      default:
        return true;
    }
  });

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'lease':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'llc_document':
        return <FileText className="h-4 w-4 text-green-500" />;
      case 'mortgage_statement':
        return <FileText className="h-4 w-4 text-purple-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleDownload = async (documentId: number) => {
    try {
      const response = await fetch(`/api/ai-documents/download/${documentId}`);
      if (!response.ok) throw new Error('Failed to download document');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'document';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const getStatusBadge = (item: ProcessingHistory) => {
    if (!item.success) {
      return <Badge variant="destructive">Failed</Badge>;
    }
    if (item.appliedAt) {
      return <Badge variant="default">Applied</Badge>;
    }
    return <Badge variant="secondary">Pending Review</Badge>;
  };

  const handleProcessingComplete = () => {
    refetchHistory();
  };

  // Statistics calculation
  const stats = {
    total: processingHistory.length,
    successful: processingHistory.filter(item => item.success).length,
    pending: processingHistory.filter(item => item.success && !item.appliedAt).length,
    applied: processingHistory.filter(item => item.appliedAt).length
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Document Processing</h1>
        <p className="text-gray-600 mt-2">
          AI-powered document analysis and automated debt statement processing for comprehensive property management
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="space-y-1">
              <FileText className="h-6 w-6 text-blue-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">Total Processed</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="space-y-1">
              <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">Successful</p>
              <p className="text-2xl font-bold text-green-600">{stats.successful}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="space-y-1">
              <Clock className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="space-y-1">
              <TrendingUp className="h-6 w-6 text-blue-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">Applied</p>
              <p className="text-2xl font-bold text-blue-600">{stats.applied}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="ai-documents" className="space-y-6">
        <TabsList>
          <TabsTrigger value="ai-documents">AI Documents</TabsTrigger>
          <TabsTrigger value="debt-statements">Debt Statements</TabsTrigger>
          <TabsTrigger value="leases">Leases</TabsTrigger>
          <TabsTrigger value="history">Processing History</TabsTrigger>
        </TabsList>

        <TabsContent value="ai-documents" className="space-y-6">


          {/* Property/Entity Selection */}
          <Card>
            <CardHeader className="text-center pb-3">
              <CardTitle className="text-lg">Target Property/Entity</CardTitle>
              <CardDescription className="text-sm">
                Select the property or entity to associate with the uploaded document
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <label className="text-sm font-medium block mb-1">Property</label>
                  <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select property (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No property selected</SelectItem>
                      {Array.isArray(properties) && properties.map(property => (
                        <SelectItem key={property.id} value={property.id.toString()}>
                          {property.address} ({property.apartments} units)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="text-center">
                  <label className="text-sm font-medium block mb-1">Entity</label>
                  <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select entity (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No entity selected</SelectItem>
                      <SelectItem value="1">5Central Capital</SelectItem>
                      <SelectItem value="2">The House Doctors</SelectItem>
                      <SelectItem value="3">Arcadia Vision Group</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Upload */}
          <DocumentUpload 
            propertyId={selectedProperty === 'none' ? undefined : Number(selectedProperty)}
            entityId={selectedEntity === 'none' ? undefined : Number(selectedEntity)}
            model={selectedModel}
            onProcessingComplete={handleProcessingComplete}
          />
        </TabsContent>

        <TabsContent value="debt-statements" className="space-y-6">
          <Card>
            <CardHeader className="text-center pb-3">
              <CardTitle className="flex items-center justify-center gap-2 text-lg">
                <CreditCard className="h-5 w-5" />
                Debt Statement Upload
              </CardTitle>
              <CardDescription className="text-sm">
                Upload mortgage statements and lender documents to automatically sync loan data with your properties
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <StatementUpload />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leases" className="space-y-6">
          <Card>
            <CardHeader className="text-center pb-3">
              <CardTitle className="flex items-center justify-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Lease Document Upload
              </CardTitle>
              <CardDescription className="text-sm">
                Upload lease agreements to automatically extract tenant data and integrate with property rent rolls
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <LeaseUpload />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-center gap-4">
                <Select value={historyFilter} onValueChange={setHistoryFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter documents" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Documents</SelectItem>
                    <SelectItem value="success">Successful Only</SelectItem>
                    <SelectItem value="pending">Pending Review</SelectItem>
                    <SelectItem value="applied">Applied Updates</SelectItem>
                    <SelectItem value="errors">Failed Processing</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={() => refetchHistory()}>
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Processing History */}
          <div className="space-y-4">
            {filteredHistory.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
                  <p className="text-gray-500">
                    {historyFilter === 'all' 
                      ? 'No documents have been processed yet. Upload your first document above.'
                      : 'No documents match the current filter. Try adjusting your filter criteria.'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              Array.isArray(filteredHistory) && filteredHistory.map(item => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getDocumentTypeIcon(item.documentType)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium truncate">{item.fileName}</h3>
                            {getStatusBadge(item)}
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>Type: <span className="capitalize">{item.documentType?.replace('_', ' ') || 'Unknown'}</span></p>
                            <p>Confidence: {Math.round((item.confidence || 0) * 100)}%</p>
                            <p>Processed: {new Date(item.processedAt).toLocaleDateString()}</p>
                            {item.appliedAt && (
                              <p>Applied: {new Date(item.appliedAt).toLocaleDateString()}</p>
                            )}
                            <div className="flex items-center gap-1 text-xs">
                              <FolderOpen className="h-3 w-3" />
                              <span>File: /uploads/{item.fileName}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.success && !item.appliedAt && (
                          <Button 
                            size="sm" 
                            onClick={() => applyUpdatesMutation.mutate(item.id)}
                            disabled={applyUpdatesMutation.isPending}
                          >
                            {applyUpdatesMutation.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                Applying...
                              </>
                            ) : (
                              'Apply Updates'
                            )}
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => handleDownload(item.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${item.fileName}"? This action cannot be undone.`)) {
                              deleteDocumentMutation.mutate(item.id);
                            }
                          }}
                          disabled={deleteDocumentMutation.isPending}
                          className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                        >
                          {deleteDocumentMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Errors/Warnings */}
                    {item.errors && item.errors.length > 0 && (
                      <div className="mt-3 p-2 bg-red-50 rounded text-sm">
                        <div className="flex items-center gap-1 text-red-700 font-medium mb-1">
                          <AlertCircle className="h-4 w-4" />
                          Errors
                        </div>
                        <ul className="list-disc list-inside text-red-600">
                          {item.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}



                    {/* Suggested Actions */}
                    {item.suggestedActions && item.suggestedActions.length > 0 && (
                      <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
                        <div className="flex items-center gap-1 text-blue-700 font-medium mb-1">
                          <CheckCircle className="h-4 w-4" />
                          Suggested Actions
                        </div>
                        <ul className="list-disc list-inside text-blue-600">
                          {item.suggestedActions.map((action, index) => (
                            <li key={index}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default DocumentManagement;