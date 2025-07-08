import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const [autoApply, setAutoApply] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Set available OpenAI models
  useEffect(() => {
    setAvailableModels([
      { id: 'gpt-4o', displayName: 'GPT-4o: Best accuracy for complex documents' },
      { id: 'gpt-4o-mini', displayName: 'GPT-4o Mini: Good balance of speed and accuracy' },
      { id: 'gpt-4-turbo', displayName: 'GPT-4 Turbo: High accuracy, slower processing' },
      { id: 'gpt-3.5-turbo', displayName: 'GPT-3.5: Fastest processing, lower accuracy' }
    ]);
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
      
      if (propertyId) formData.append('propertyId', propertyId.toString());
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

        if (onProcessingComplete) {
          onProcessingComplete(result);
        }
      } else {
        toast({
          title: "Processing completed with issues",
          description: result.errors?.join(', ') || "Some issues were found during processing.",
          variant: "destructive"
        });
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
                  {availableModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 pt-6">
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

      {/* Processing Results */}
      {processingResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {processingResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              Processing Results
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