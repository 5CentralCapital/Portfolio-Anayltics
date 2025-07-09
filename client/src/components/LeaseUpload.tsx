import React, { useState, useRef } from 'react';
import { Upload, File, AlertCircle, CheckCircle, Download, X, FileText, Database, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { useToast } from '../hooks/use-toast';
import UnmatchedLeaseCard from './UnmatchedLeaseCard';

interface UploadResult {
  fileName: string;
  parsed: number;
  matched: number;
  unmatched: number;
  updated: number;
  errors?: string[];
}

interface UploadResponse {
  success: boolean;
  message: string;
  results?: {
    fileName: string;
    parsed: number;
    matched: number;
    unmatched: number;
    updated: number;
    errors?: string[];
    warnings?: string[];
  };
  data?: {
    matched: Array<{
      tenant: string;
      property: string;
      rent: number;
      leaseStart: string;
      leaseEnd: string;
    }>;
    unmatched: Array<{
      tenant: string;
      address?: string;
      rent: number;
      leaseStart?: string;
      leaseEnd?: string;
    }>;
  };
  summary?: {
    filesProcessed: number;
    totalParsed: number;
    totalMatched: number;
    totalUpdated: number;
    totalErrors: number;
    totalWarnings: number;
  };
}

const LeaseUpload: React.FC = () => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [results, setResults] = useState<UploadResponse | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
    }
  };

  const validateFiles = (files: File[]): string[] => {
    const errors: string[] = [];
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    files.forEach(file => {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!allowedTypes.includes(extension)) {
        errors.push(`${file.name}: Unsupported file type. Allowed: PDF, DOC, DOCX, TXT`);
      }
      
      if (file.size > maxSize) {
        errors.push(`${file.name}: File too large (max 10MB)`);
      }
    });

    return errors;
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select lease documents to upload.",
        variant: "destructive",
      });
      return;
    }

    const validationErrors = validateFiles(selectedFiles);
    if (validationErrors.length > 0) {
      toast({
        title: "File Validation Failed",
        description: validationErrors.join('\n'),
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setResults(null);

    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('leases', file);
      });

      const response = await fetch('/api/leases/upload', {
        method: 'POST',
        body: formData,
      });

      const result: UploadResponse = await response.json();
      
      if (result.success) {
        setResults(result);
        setSelectedFiles([]);
        toast({
          title: "Upload Successful",
          description: `Processed ${result.results?.parsed || 0} lease(s), matched ${result.results?.matched || 0} to properties.`,
        });
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'An error occurred during upload.',
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(100);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearResults = () => {
    setResults(null);
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Upload Lease Documents
        </h3>
        <p className="text-gray-500 mb-4">
          Drag and drop lease agreements here, or click to browse
        </p>
        <p className="text-sm text-gray-400 mb-6">
          Supports PDF, DOC, DOCX, TXT files up to 10MB each
        </p>
        
        <Button 
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="mx-auto"
        >
          <Upload className="h-4 w-4 mr-2" />
          Choose Files
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Selected Files</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  <File className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(file.size / 1024 / 1024).toFixed(1)} MB)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            <div className="flex gap-2 pt-2">
              <Button 
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1"
              >
                {uploading ? (
                  <>
                    <Database className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload & Process
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => setSelectedFiles([])}
                disabled={uploading}
              >
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Progress */}
      {uploading && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing lease documents...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Results */}
      {results && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Processing Results</CardTitle>
              <CardDescription>
                {results.message}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={clearResults}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary Stats */}
            {results.results && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded">
                  <div className="text-2xl font-bold text-blue-600">
                    {results.results.parsed}
                  </div>
                  <div className="text-sm text-blue-800">Parsed</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded">
                  <div className="text-2xl font-bold text-green-600">
                    {results.results.matched}
                  </div>
                  <div className="text-sm text-green-800">Matched</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded">
                  <div className="text-2xl font-bold text-yellow-600">
                    {results.results.unmatched}
                  </div>
                  <div className="text-sm text-yellow-800">Unmatched</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded">
                  <div className="text-2xl font-bold text-purple-600">
                    {results.results.updated}
                  </div>
                  <div className="text-sm text-purple-800">Updated</div>
                </div>
              </div>
            )}

            {/* Matched Leases */}
            {results.data?.matched && results.data.matched.length > 0 && (
              <div>
                <h4 className="font-medium text-green-700 mb-2 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Successfully Matched Leases
                </h4>
                <div className="space-y-2">
                  {results.data.matched.map((lease, index) => (
                    <div key={index} className="p-3 bg-green-50 rounded border-l-4 border-green-500">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-green-900">{lease.tenant}</div>
                          <div className="text-sm text-green-700">{lease.property}</div>
                          <div className="text-sm text-green-600">
                            ${lease.rent}/month • {lease.leaseStart} to {lease.leaseEnd}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unmatched Leases */}
            {results.data?.unmatched && results.data.unmatched.length > 0 && (
              <div>
                <h4 className="font-medium text-yellow-700 mb-2 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Unmatched Leases - Manual Review Required
                </h4>
                <div className="space-y-3">
                  {results.data.unmatched.map((lease, index) => (
                    <UnmatchedLeaseCard
                      key={index}
                      lease={lease}
                      onReviewComplete={() => {
                        // Refresh results or handle completion
                        toast({
                          title: "Lease Reviewed",
                          description: "Lease data has been saved to the property.",
                        });
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Errors */}
            {results.results?.errors && results.results.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-1">Processing Errors:</div>
                  <ul className="list-disc list-inside text-sm">
                    {results.results.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Help Text */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-medium mb-2">Supported Lease Data</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• <strong>Tenant Information:</strong> Names, contact details, lease dates</p>
            <p>• <strong>Property Details:</strong> Address, unit number, rental amounts</p>
            <p>• <strong>Lease Terms:</strong> Start/end dates, monthly rent, security deposits</p>
            <p>• <strong>Additional Details:</strong> Pet policies, utilities, parking</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaseUpload;