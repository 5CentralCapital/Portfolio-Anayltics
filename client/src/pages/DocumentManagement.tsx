import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DocumentUpload } from '@/components/DocumentUpload';
import StatementUpload from '@/components/StatementUpload';
import { FileText, Clock, CheckCircle, AlertCircle, TrendingUp, Upload, Eye, CreditCard } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

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
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Processed</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Successful</p>
                <p className="text-2xl font-bold text-green-600">{stats.successful}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Applied</p>
                <p className="text-2xl font-bold text-blue-600">{stats.applied}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="ai-documents" className="space-y-6">
        <TabsList>
          <TabsTrigger value="ai-documents">AI Documents</TabsTrigger>
          <TabsTrigger value="debt-statements">Debt Statements</TabsTrigger>
          <TabsTrigger value="history">Processing History</TabsTrigger>
        </TabsList>

        <TabsContent value="ai-documents" className="space-y-6">
          {/* AI Model Selection */}
          <Card>
            <CardHeader>
              <CardTitle>AI Model Configuration</CardTitle>
              <CardDescription>
                Choose the AI model for document analysis and data extraction (OpenAI or Gemini)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">AI Model</label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o">GPT-4o (Latest, Recommended)</SelectItem>
                      <SelectItem value="gpt-4o-mini">GPT-4o Mini (Faster, Cost-effective)</SelectItem>
                      <SelectItem value="gpt-4-turbo">GPT-4 Turbo (Previous Generation)</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Budget Option)</SelectItem>
                      <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash (Fast, Multimodal)</SelectItem>
                      <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro (Highest Accuracy)</SelectItem>
                      <SelectItem value="gemini-2.0-flash-preview-image-generation">Gemini 2.0 Flash Preview (Latest)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 flex items-end">
                  <div className="text-sm text-gray-600">
                    <strong>GPT-4o:</strong> Best accuracy for complex documents<br/>
                    <strong>GPT-4o Mini:</strong> Good balance of speed and accuracy<br/>
                    <strong>GPT-4 Turbo:</strong> High accuracy, slower processing<br/>
                    <strong>GPT-3.5:</strong> Fastest processing, lower accuracy
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Property/Entity Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Target Property/Entity</CardTitle>
              <CardDescription>
                Select the property or entity to associate with the uploaded document
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Property</label>
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

                <div>
                  <label className="text-sm font-medium">Entity</label>
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Debt Statement Upload
              </CardTitle>
              <CardDescription>
                Upload mortgage statements and lender documents to automatically sync loan data with your properties
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StatementUpload />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
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
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.success && !item.appliedAt && (
                          <Button 
                            size="sm" 
                            onClick={() => {
                              // Apply updates logic would go here
                              console.log('Apply updates for:', item.id);
                            }}
                          >
                            Apply Updates
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
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

                    {item.warnings && item.warnings.length > 0 && (
                      <div className="mt-3 p-2 bg-yellow-50 rounded text-sm">
                        <div className="flex items-center gap-1 text-yellow-700 font-medium mb-1">
                          <AlertCircle className="h-4 w-4" />
                          Warnings
                        </div>
                        <ul className="list-disc list-inside text-yellow-600">
                          {item.warnings.map((warning, index) => (
                            <li key={index}>{warning}</li>
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