import React, { useState, useRef } from 'react';
import { Upload, File, AlertCircle, CheckCircle, Download, X, FileText, Database } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { useToast } from '../hooks/use-toast';
import UnmatchedLoanCard from './UnmatchedLoanCard';

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
      lender: string;
      property: string;
      balance: number;
      payment: number;
    }>;
    unmatched: Array<{
      lender: string;
      address?: string;
      balance: number;
      loanId?: string;
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

const StatementUpload: React.FC = () => {
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
    const allowedTypes = ['.pdf', '.csv', '.xlsx', '.xls', '.txt'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    files.forEach(file => {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!allowedTypes.includes(extension)) {
        errors.push(`${file.name}: Unsupported file type. Allowed: PDF, CSV, Excel, TXT`);
      }
      if (file.size > maxSize) {
        errors.push(`${file.name}: File size too large (max 10MB)`);
      }
    });

    return errors;
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one file to upload",
        variant: "destructive"
      });
      return;
    }

    const validationErrors = validateFiles(selectedFiles);
    if (validationErrors.length > 0) {
      toast({
        title: "File validation failed",
        description: validationErrors.join(', '),
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      
      if (selectedFiles.length === 1) {
        formData.append('statement', selectedFiles[0]);
        
        const response = await fetch('/api/statements/upload', {
          method: 'POST',
          body: formData
        });

        const result: UploadResponse = await response.json();
        setResults(result);
      } else {
        selectedFiles.forEach(file => {
          formData.append('statements', file);
        });

        const response = await fetch('/api/statements/upload-multiple', {
          method: 'POST',
          body: formData
        });

        const result: UploadResponse = await response.json();
        setResults(result);
      }

      setUploadProgress(100);
      
      if (results?.success) {
        toast({
          title: "Upload successful",
          description: `Processed ${selectedFiles.length} file(s) and updated loan data`,
        });
      } else if (results?.errors?.some(err => err.includes('PDF text extraction failed'))) {
        toast({
          title: "PDF Processing Issue",
          description: "PDF may be encrypted or image-based. Try copying text to a .txt file or use CSV format.",
          variant: "default"
        });
      } else {
        toast({
          title: "Upload completed with issues",
          description: results?.message || "Some files could not be processed",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "Upload failed",
        description: "An error occurred while uploading files",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const downloadTemplate = (type: 'csv' | 'text') => {
    try {
      let content = '';
      let filename = '';
      let mimeType = '';

      if (type === 'csv') {
        content = "Lender,Property Address,Current Balance,Monthly Payment,Interest Rate,Loan ID,Statement Date\nWells Fargo,1 Harmony St,245000,1200,4.5%,WF123456789,2025-01-01\nChase,3408 E DR MLK BLVD,189000,980,4.2%,CH987654321,2025-01-01\nQuicken,157 Crystal Ave,156000,850,4.8%,QL555666777,2025-01-01";
        filename = 'loan_statement_template.csv';
        mimeType = 'text/csv';
      } else {
        content = `WELLS FARGO MORTGAGE STATEMENT

Property Address: 1 Harmony St
Loan Number: WF123456789
Statement Date: January 1, 2025

Current Balance: $245,000.00
Monthly Payment: $1,200.00
Interest Rate: 4.5%
Next Payment Due: February 1, 2025
Next Payment Amount: $1,200.00

Principal Balance: $245,000.00
Escrow Balance: $2,500.00`;
        filename = 'loan_statement_template.txt';
        mimeType = 'text/plain';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Template downloaded",
        description: `Downloaded ${filename} template`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Could not download template",
        variant: "destructive"
      });
    }
  };

  const clearResults = () => {
    setResults(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Lender Statements
          </CardTitle>
          <CardDescription>
            Upload your monthly lender statements in PDF, CSV, Excel, or text format. 
            The system will automatically parse and update your loan data.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Drag and drop files here, or click to select
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Supports PDF, CSV, Excel, and text files (max 10MB each)
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.csv,.xlsx,.xls,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="mb-4"
            >
              Select Files
            </Button>

            {selectedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium">Selected files:</p>
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                    <div className="flex items-center gap-2">
                      <File className="h-4 w-4" />
                      <span>{file.name}</span>
                      <Badge variant="secondary">{(file.size / 1024 / 1024).toFixed(1)} MB</Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedFiles(files => files.filter((_, i) => i !== index))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {uploading && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading and processing...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          <div className="flex justify-between items-center mt-6">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadTemplate('csv')}
              >
                <Download className="h-4 w-4 mr-2" />
                CSV Template
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadTemplate('text')}
              >
                <Download className="h-4 w-4 mr-2" />
                Text Template
              </Button>
            </div>
            
            <Button
              onClick={uploadFiles}
              disabled={selectedFiles.length === 0 || uploading}
            >
              {uploading ? 'Processing...' : `Upload ${selectedFiles.length} file(s)`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {results.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                Upload Results
              </CardTitle>
              <Button variant="outline" size="sm" onClick={clearResults}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {results.summary ? (
              // Multiple files summary
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{results.summary.filesProcessed}</div>
                    <div className="text-sm text-gray-500">Files</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{results.summary.totalParsed}</div>
                    <div className="text-sm text-gray-500">Parsed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{results.summary.totalMatched}</div>
                    <div className="text-sm text-gray-500">Matched</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{results.summary.totalUpdated}</div>
                    <div className="text-sm text-gray-500">Updated</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{results.summary.totalErrors}</div>
                    <div className="text-sm text-gray-500">Errors</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{results.summary.totalWarnings}</div>
                    <div className="text-sm text-gray-500">Warnings</div>
                  </div>
                </div>
              </div>
            ) : results.results ? (
              // Single file results
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{results.results.parsed}</div>
                    <div className="text-sm text-gray-500">Parsed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{results.results.matched}</div>
                    <div className="text-sm text-gray-500">Matched</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{results.results.updated}</div>
                    <div className="text-sm text-gray-500">Updated</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{results.results.errors?.length || 0}</div>
                    <div className="text-sm text-gray-500">Errors</div>
                  </div>
                </div>

                {results.data && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Matched Loans */}
                    {results.data.matched.length > 0 && (
                      <div>
                        <h4 className="font-medium text-green-600 mb-2 flex items-center gap-2">
                          <Database className="h-4 w-4" />
                          Successfully Updated ({results.data.matched.length})
                        </h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {results.data.matched.map((loan, index) => (
                            <div key={index} className="text-sm bg-green-50 p-2 rounded">
                              <div className="font-medium">{loan.property}</div>
                              <div className="text-gray-600">
                                {loan.lender} • {formatCurrency(loan.balance)} • {formatCurrency(loan.payment)}/mo
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Unmatched Loans */}
                    {results.data.unmatched.length > 0 && (
                      <div>
                        <h4 className="font-medium text-orange-600 mb-2 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Needs Manual Review ({results.data.unmatched.length})
                        </h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {results.data.unmatched.map((loan, index) => (
                            <UnmatchedLoanCard 
                              key={index} 
                              loan={loan} 
                              onSave={() => {
                                // Refresh results after saving
                                setResults(null);
                                setSelectedFiles([]);
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : null}

            {/* Error Messages */}
            {(results.results?.errors || results.errors) && (
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">Errors occurred during processing:</div>
                  <ul className="list-disc pl-4 space-y-1">
                    {(results.results?.errors || results.errors || []).map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StatementUpload;