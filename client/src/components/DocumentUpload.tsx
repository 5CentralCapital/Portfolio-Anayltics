import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Eye, Edit, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

interface DocumentUploadProps {
  propertyId?: number;
  entityId?: number;
  model?: string;
  onProcessingComplete?: (result: any) => void;
}

interface ProcessingResult {
  success: boolean;
  documentType: string;
  extractedData: any;
  confidence: number;
  errors?: string[];
  warnings?: string[];
  suggestedActions?: string[];
  processingId: number;
  requiresReview?: boolean;
}

export function DocumentUpload({ propertyId, entityId, model = 'gpt-4o', onProcessingComplete }: DocumentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>('auto');
  const [selectedModel, setSelectedModel] = useState<string>(model);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(propertyId?.toString() || 'none');
  const [autoApply, setAutoApply] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [geminiModels, setGeminiModels] = useState<any[]>([]);
  const [showManualReview, setShowManualReview] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch properties for dropdown
  const { data: properties = [], isLoading: propertiesLoading, error: propertiesError } = useQuery({
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

  // Ensure properties is always an array
  const safeProperties = Array.isArray(properties) ? properties : [];

  // Fetch all available models (OpenAI and Gemini)
  useEffect(() => {
    const fetchModels = async () => {
      try {
        // Fetch OpenAI models
        const openaiResponse = await fetch('/api/openai/models');
        if (openaiResponse.ok) {
          const openaiData = await openaiResponse.json();
          if (openaiData.success) {
            setAvailableModels(openaiData.models);
          }
        }

        // Fetch Gemini models
        const geminiResponse = await fetch('/api/gemini/models');
        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json();
          console.log('Gemini models data:', geminiData);
          setGeminiModels(geminiData);
        }
      } catch (error) {
        console.error('Failed to fetch models:', error);
        // Set fallback models if API fails
        setAvailableModels([
          { id: 'gpt-4o', displayName: 'GPT-4o (Recommended)' },
          { id: 'gpt-4o-mini', displayName: 'GPT-4o Mini (Fast)' },
          { id: 'gpt-4-turbo', displayName: 'GPT-4 Turbo' },
          { id: 'gpt-3.5-turbo', displayName: 'GPT-3.5 Turbo' }
        ]);
        setGeminiModels([
          { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Fast multimodal processing' },
          { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Highest accuracy' }
        ]);
      }
    };

    fetchModels();
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setProcessingResult(null);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      setSelectedFile(files[0]);
      setProcessingResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a document to upload.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('document', selectedFile);
      
      if (selectedPropertyId && selectedPropertyId !== 'none' && selectedPropertyId !== 'loading' && selectedPropertyId !== 'error') {
        formData.append('propertyId', selectedPropertyId);
      }
      if (entityId) formData.append('entityId', entityId.toString());
      if (documentType && documentType !== 'auto') formData.append('documentType', documentType);
      formData.append('model', selectedModel);
      formData.append('autoApply', autoApply.toString());

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/ai-documents/process', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result: ProcessingResult = await response.json();
      setProcessingResult(result);

      if (result.success) {
        toast({
          title: "Document processed successfully",
          description: `Extracted ${result.documentType} data with ${Math.round(result.confidence * 100)}% confidence.`
        });

        // Show manual review for low confidence or if requested
        if (result.confidence < 0.8 || result.documentType === 'unknown') {
          setEditedData(result.extractedData);
          setShowManualReview(true);
        }

        if (onProcessingComplete) {
          onProcessingComplete(result);
        }
      } else {
        toast({
          title: "Processing completed with issues",
          description: result.errors?.join(', ') || "Could not determine document type",
          variant: "destructive"
        });
        
        // Show manual review for failed processing
        setEditedData(result.extractedData || {});
        setShowManualReview(true);
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleApplyUpdates = async () => {
    if (!processingResult) return;

    try {
      const response = await fetch(`/api/ai-documents/apply-updates/${processingResult.processingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          entityId,
          approvedFields: [] // Apply all fields for now
        })
      });

      if (!response.ok) {
        throw new Error('Failed to apply updates');
      }

      const result = await response.json();
      
      toast({
        title: "Updates applied successfully",
        description: `Updated: ${result.updatedFields.join(', ')}`
      });

      setProcessingResult(null);
      setSelectedFile(null);
      
    } catch (error) {
      console.error('Apply updates error:', error);
      toast({
        title: "Failed to apply updates",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            AI Document Processing
          </CardTitle>
          <CardDescription>
            Upload leases, LLC documents, or mortgage statements to automatically extract and update property information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload Area */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-2">
              <FileText className="h-12 w-12 text-gray-400" />
              <div className="text-lg font-medium">
                {selectedFile ? selectedFile.name : 'Drop files here or click to browse'}
              </div>
              <div className="text-sm text-gray-500">
                {selectedFile ? 
                  `${formatFileSize(selectedFile.size)} • ${selectedFile.type || 'Unknown type'}` :
                  'Supports PDF, JPG, PNG, TXT, CSV, DOC, DOCX (max 10MB)'
                }
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.txt,.csv,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Document Type and Model Selection */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="document-type">Document Type (Optional)</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Auto-detect document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-detect</SelectItem>
                  <SelectItem value="lease">Lease Agreement</SelectItem>
                  <SelectItem value="llc_document">LLC Document</SelectItem>
                  <SelectItem value="mortgage_statement">Mortgage Statement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="ai-model">AI Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select AI model" />
                </SelectTrigger>
                <SelectContent>
                  {/* OpenAI Models */}
                  {availableModels.length > 0 && (
                    <>
                      <SelectItem value="openai-header" disabled>
                        <div className="font-semibold text-xs text-gray-500 uppercase">OpenAI Models</div>
                      </SelectItem>
                      {availableModels.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.displayName}
                        </SelectItem>
                      ))}
                    </>
                  )}
                  
                  {/* Gemini Models */}
                  {geminiModels.length > 0 && (
                    <>
                      <SelectItem value="gemini-header" disabled>
                        <div className="font-semibold text-xs text-gray-500 uppercase">Gemini Models</div>
                      </SelectItem>
                      {geminiModels.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}: {model.description}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="property-select">Property (Optional)</Label>
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
                    <SelectItem value="error" disabled>Error loading properties</SelectItem>
                  )}
                  {safeProperties.map((property: any) => (
                    <SelectItem key={property.id} value={property.id.toString()}>
                      {property.address} ({property.apartments} units)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Auto-apply checkbox */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="auto-apply"
              checked={autoApply}
              onChange={(e) => setAutoApply(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="auto-apply" className="text-sm">
              Auto-apply high-confidence updates
            </Label>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing document...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Upload Button */}
          <Button 
            onClick={handleUpload} 
            disabled={!selectedFile || uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Process Document
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Manual Review Interface */}
      {showManualReview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Manual Review & Correction
            </CardTitle>
            <CardDescription>
              Review and edit the extracted data before applying to your property records.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="extracted-data">Extracted Data (JSON)</Label>
              <Textarea
                id="extracted-data"
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
            
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowManualReview(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button 
                onClick={async () => {
                  // Save the manually reviewed data
                  if (processingResult) {
                    const updatedResult = {
                      ...processingResult,
                      extractedData: editedData,
                      confidence: 0.9, // Mark as high confidence after manual review
                      success: true
                    };
                    setProcessingResult(updatedResult);
                    setShowManualReview(false);
                    
                    toast({
                      title: "Manual review completed",
                      description: "Data has been updated and is ready to apply."
                    });
                  }
                }}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save Review
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Results */}
      {processingResult && !showManualReview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {processingResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              Processing Results
              {processingResult && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditedData(processingResult.extractedData || {});
                    setShowManualReview(true);
                  }}
                  className="ml-auto"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Review Data
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Document Type:</span>
                <span className="ml-2 capitalize">{processingResult.documentType.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="font-medium">Confidence:</span>
                <span className="ml-2">{Math.round(processingResult.confidence * 100)}%</span>
              </div>
            </div>

            {/* Extracted Data Preview */}
            {processingResult.extractedData && (
              <div>
                <h4 className="font-medium mb-2">Extracted Information:</h4>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(processingResult.extractedData, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Warnings */}
            {processingResult.warnings && processingResult.warnings.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warnings:</strong>
                  <ul className="list-disc list-inside mt-1">
                    {processingResult.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Errors */}
            {processingResult.errors && processingResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Errors:</strong>
                  <ul className="list-disc list-inside mt-1">
                    {processingResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Suggested Actions */}
            {processingResult.suggestedActions && processingResult.suggestedActions.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Suggested Actions:</h4>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {processingResult.suggestedActions.map((action, index) => (
                    <li key={index}>{action}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Apply Updates Button */}
            {processingResult.success && processingResult.requiresReview && (
              <Button onClick={handleApplyUpdates} className="w-full">
                Apply Updates to Property Records
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}