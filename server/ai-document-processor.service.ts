/**
 * AI-Powered Document Processing Service
 * Uses OpenAI to extract structured data from property-related documents
 */

import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface DocumentClassification {
  type: 'lease' | 'llc_document' | 'mortgage_statement' | 'insurance_policy' | 'tax_document' | 'property_deed' | 'inspection_report' | 'vendor_invoice' | 'unknown';
  confidence: number;
  subtype?: string;
}

export interface LeaseData {
  tenantNames: string[];
  propertyAddress: string;
  unitNumber?: string;
  leaseStartDate: string;
  leaseEndDate: string;
  monthlyRent: number;
  securityDeposit?: number;
  petDeposit?: number;
  leaseTerm: string;
  renewalOptions?: string;
  petPolicy?: string;
  utilities?: string[];
  parkingSpaces?: number;
  additionalFees?: { name: string; amount: number }[];
}

export interface LLCDocumentData {
  entityName: string;
  entityType: string;
  formationDate?: string;
  registeredAddress?: string;
  members: {
    name: string;
    ownershipPercentage: number;
    role: string;
    address?: string;
  }[];
  taxClassification?: string;
  registeredAgent?: string;
  purpose?: string;
}

export interface MortgageStatementData {
  lenderName: string;
  propertyAddress: string;
  loanNumber: string;
  statementDate: string;
  currentBalance: number;
  monthlyPayment: number;
  interestRate: number;
  escrowBalance?: number;
  nextPaymentDate: string;
  principalPayment?: number;
  interestPayment?: number;
  escrowPayment?: number;
  pastDueAmount?: number;
  prepaymentPenalty?: number;
  maturityDate?: string;
  originalLoanAmount?: number;
}

export interface ProcessingResult {
  success: boolean;
  documentType: string;
  extractedData: LeaseData | LLCDocumentData | MortgageStatementData | null;
  confidence: number;
  errors?: string[];
  warnings?: string[];
  suggestedActions?: string[];
}

export class AIDocumentProcessor {

  /**
   * Main entry point for document processing
   */
  async processDocument(filePath: string, fileName: string, model: string = 'gpt-4o'): Promise<ProcessingResult> {
    try {
      console.log(`Processing document: ${fileName}`);
      
      // Step 1: Classify document type
      const classification = await this.classifyDocument(filePath, fileName, model);
      console.log('Document classification:', classification);
      
      // Always try to extract data, even for unknown documents
      let extractedData: any = null;
      let errors: string[] = [];
      let warnings: string[] = [];

      if (classification.type === 'unknown' || classification.confidence < 0.5) {
        warnings.push('Document classification uncertain. Manual review recommended.');
        warnings.push(`Detected as: ${classification.subtype || 'unknown document type'}`);
      }

      // Step 2: Extract data based on document type
      switch (classification.type) {
        case 'lease':
          extractedData = await this.extractLeaseData(filePath, model);
          break;
        case 'llc_document':
          extractedData = await this.extractLLCData(filePath, model);
          break;
        case 'mortgage_statement':
          extractedData = await this.extractMortgageData(filePath, model);
          break;
        case 'insurance_policy':
        case 'tax_document':
        case 'property_deed':
        case 'inspection_report':
        case 'vendor_invoice':
        case 'unknown':
        default:
          extractedData = await this.extractGenericDocumentData(filePath, classification.type, model);
          // Boost confidence if we extracted useful data
          if (extractedData && Object.keys(extractedData).length > 1) {
            classification.confidence = Math.max(classification.confidence, 0.6);
          }
          break;
      }

      // Step 3: Validate extracted data
      const validation = this.validateExtractedData(classification.type, extractedData);
      errors.push(...validation.errors);
      warnings.push(...validation.warnings);

      return {
        success: true, // Always return success so manual review interface shows
        documentType: classification.type,
        extractedData,
        confidence: classification.confidence,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
        suggestedActions: await this.generateSuggestedActions(classification.type, extractedData, model)
      };

    } catch (error) {
      console.error('Document processing error:', error);
      return {
        success: false,
        documentType: 'error',
        extractedData: null,
        confidence: 0,
        errors: [`Processing failed: ${error.message}`]
      };
    }
  }

  /**
   * Classify document type using OpenAI
   */
  private async classifyDocument(filePath: string, fileName: string, model: string = 'gpt-4o'): Promise<DocumentClassification> {
    try {
      const isImage = /\.(jpg|jpeg|png|gif|bmp|tiff)$/i.test(fileName);
      
      if (isImage) {
        return await this.classifyImageDocument(filePath, model);
      } else {
        return await this.classifyTextDocument(filePath, model);
      }
    } catch (error) {
      console.error('Classification error:', error);
      return { type: 'unknown', confidence: 0 };
    }
  }

  /**
   * Classify image documents using OpenAI Vision
   */
  private async classifyImageDocument(filePath: string, model: string = 'gpt-4o'): Promise<DocumentClassification> {
    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = imageBuffer.toString('base64');

    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this document image and classify it as one of these types:
              - lease: Residential or commercial lease agreement
              - llc_document: LLC operating agreement, articles of organization, membership agreement
              - mortgage_statement: Monthly mortgage or loan statement
              - unknown: Cannot determine or other document type

              Respond with JSON in this format:
              {
                "type": "lease|llc_document|mortgage_statement|unknown",
                "confidence": 0.0-1.0,
                "subtype": "description of specific document subtype",
                "reasoning": "brief explanation of classification"
              }`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500
    });

    const result = JSON.parse(response.choices[0].message.content);
    return {
      type: result.type,
      confidence: result.confidence,
      subtype: result.subtype
    };
  }

  /**
   * Classify text documents using AI (OpenAI or Gemini)
   */
  private async classifyTextDocument(filePath: string, model: string = 'gpt-4o'): Promise<DocumentClassification> {
    // Check if it's a Gemini model
    if (model.startsWith('gemini-')) {
      try {
        return await this.classifyTextDocumentWithGemini(filePath, model);
      } catch (error) {
        console.warn('Gemini classification failed, falling back to OpenAI:', error.message);
        // Fallback to OpenAI if Gemini fails
        return this.classifyTextDocumentWithOpenAI(filePath, 'gpt-4o');
      }
    } else {
      return this.classifyTextDocumentWithOpenAI(filePath, model);
    }
  }

  /**
   * Classify text documents using OpenAI
   */
  private async classifyTextDocumentWithOpenAI(filePath: string, model: string = 'gpt-4o'): Promise<DocumentClassification> {
    // Read first 2000 characters for classification
    const content = fs.readFileSync(filePath, 'utf-8').substring(0, 2000);

    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: `You are a document classifier for real estate property management. Classify documents as one of these types:
          - lease: Residential/commercial lease agreements, rental agreements, tenant documents
          - llc_document: LLC operating agreements, articles of organization, membership documents, corporate documents
          - mortgage_statement: Monthly mortgage/loan statements, lender statements, payment documents
          - unknown: Cannot determine or other document type
          
          Be generous with classification - if a document could reasonably be one of these types, classify it rather than marking as unknown.`
        },
        {
          role: "user",
          content: `Analyze this document content and classify it. Content preview:
          
          ${content}
          
          Respond with JSON format:
          {
            "type": "lease|llc_document|mortgage_statement|unknown",
            "confidence": 0.0-1.0,
            "subtype": "brief description of document"
          }`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
      temperature: 0.1
    });

    const result = JSON.parse(response.choices[0].message.content);
    return {
      type: result.type,
      confidence: result.confidence,
      subtype: result.subtype
    };
  }

  /**
   * Extract lease data using OpenAI
   */
  private async extractLeaseData(filePath: string, model: string = 'gpt-4o'): Promise<LeaseData> {
    const content = await this.prepareDocumentContent(filePath);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Extract lease information and return as JSON. Be precise with dates (YYYY-MM-DD format) and numbers.
          If information is not found, use null. For arrays, return empty array if no items found.`
        },
        {
          role: "user",
          content: `Extract lease data from this document:

          ${content}

          Return JSON with this structure:
          {
            "tenantNames": ["string array of all tenant names"],
            "propertyAddress": "full property address",
            "unitNumber": "unit/apartment number or null",
            "leaseStartDate": "YYYY-MM-DD",
            "leaseEndDate": "YYYY-MM-DD", 
            "monthlyRent": number,
            "securityDeposit": number or null,
            "petDeposit": number or null,
            "leaseTerm": "lease duration description",
            "renewalOptions": "renewal terms or null",
            "petPolicy": "pet policy description or null",
            "utilities": ["array of included utilities"],
            "parkingSpaces": number or null,
            "additionalFees": [{"name": "fee name", "amount": number}]
          }`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000
    });

    return JSON.parse(response.choices[0].message.content);
  }

  /**
   * Extract LLC document data using OpenAI
   */
  private async extractLLCData(filePath: string, model: string = 'gpt-4o'): Promise<LLCDocumentData> {
    const content = await this.prepareDocumentContent(filePath);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Extract LLC/entity information and return as JSON. Be precise with dates (YYYY-MM-DD format) and percentages.
          For ownership percentages, ensure they are decimal values (e.g., 0.5 for 50%).`
        },
        {
          role: "user", 
          content: `Extract LLC/entity data from this document:

          ${content}

          Return JSON with this structure:
          {
            "entityName": "full legal entity name",
            "entityType": "LLC, Corporation, Partnership, etc.",
            "formationDate": "YYYY-MM-DD or null",
            "registeredAddress": "registered address or null",
            "members": [
              {
                "name": "member name",
                "ownershipPercentage": decimal value,
                "role": "member role/title",
                "address": "member address or null"
              }
            ],
            "taxClassification": "tax election or null",
            "registeredAgent": "registered agent name or null", 
            "purpose": "business purpose or null"
          }`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000
    });

    return JSON.parse(response.choices[0].message.content);
  }

  /**
   * Extract mortgage statement data using OpenAI
   */
  private async extractMortgageData(filePath: string, model: string = 'gpt-4o'): Promise<MortgageStatementData> {
    const content = await this.prepareDocumentContent(filePath);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Extract mortgage statement information and return as JSON. Be precise with dates (YYYY-MM-DD format), 
          monetary amounts (as numbers), and interest rates (as decimal values, e.g., 0.0675 for 6.75%).`
        },
        {
          role: "user",
          content: `Extract mortgage data from this statement:

          ${content}

          Return JSON with this structure:
          {
            "lenderName": "lender/servicer name",
            "propertyAddress": "property address from statement",
            "loanNumber": "loan account number",
            "statementDate": "YYYY-MM-DD",
            "currentBalance": number,
            "monthlyPayment": number,
            "interestRate": decimal value,
            "escrowBalance": number or null,
            "nextPaymentDate": "YYYY-MM-DD",
            "principalPayment": number or null,
            "interestPayment": number or null,
            "escrowPayment": number or null,
            "pastDueAmount": number or null,
            "prepaymentPenalty": number or null,
            "maturityDate": "YYYY-MM-DD or null",
            "originalLoanAmount": number or null
          }`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 800
    });

    return JSON.parse(response.choices[0].message.content);
  }

  /**
   * Prepare document content for OpenAI processing
   */
  private async prepareDocumentContent(filePath: string): Promise<string> {
    const ext = path.extname(filePath).toLowerCase();
    
    if (ext === '.pdf') {
      try {
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(dataBuffer, {
          normalizeWhitespace: true,
          disableCombineTextItems: false
        });
        
        if (!pdfData.text || pdfData.text.trim().length < 20) {
          console.warn('PDF text extraction yielded minimal content, trying fallback parsing');
          
          // Try basic text extraction from buffer as fallback
          const bufferText = dataBuffer.toString('utf8');
          const textPatterns = [
            /\$[\d,]+\.?\d*/g,       // Dollar amounts
            /\d+\.?\d*%/g,           // Percentages
            /\d{1,2}\/\d{1,2}\/\d{2,4}/g, // Dates
            /[A-Z][a-z]+ [A-Z][a-z]+/g,   // Names
            /\d{1,5}\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Court|Ct)/g // Addresses
          ];
          
          let extractedText = '';
          for (const pattern of textPatterns) {
            const matches = bufferText.match(pattern);
            if (matches) {
              extractedText += matches.join(' ') + '\n';
            }
          }
          
          if (extractedText.trim().length > 0) {
            console.log(`PDF fallback extraction: ${extractedText.length} characters`);
            return extractedText;
          }
          
          return `PDF file with minimal extractable text. File name: ${path.basename(filePath)}`;
        }
        
        console.log(`PDF parsed successfully: ${pdfData.text.length} characters extracted`);
        return pdfData.text;
      } catch (error) {
        console.error('PDF parsing error:', error);
        return `PDF parsing failed for ${path.basename(filePath)}: ${error.message}`;
      }
    } else if (['.txt', '.csv'].includes(ext)) {
      return fs.readFileSync(filePath, 'utf-8');
    } else {
      return `File: ${path.basename(filePath)} (${ext} format)`;
    }
  }

  /**
   * Validate extracted data for completeness and accuracy
   */
  private validateExtractedData(documentType: string, data: any): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!data) {
      errors.push('No data extracted from document');
      return { isValid: false, errors, warnings };
    }

    switch (documentType) {
      case 'lease':
        if (!data.tenantNames || data.tenantNames.length === 0) {
          errors.push('No tenant names found');
        }
        if (!data.propertyAddress) {
          errors.push('Property address not found');
        }
        if (!data.monthlyRent || data.monthlyRent <= 0) {
          errors.push('Invalid monthly rent amount');
        }
        if (!data.leaseStartDate || !data.leaseEndDate) {
          warnings.push('Lease dates may be incomplete');
        }
        break;

      case 'llc_document':
        if (!data.entityName) {
          errors.push('Entity name not found');
        }
        if (!data.members || data.members.length === 0) {
          warnings.push('No members found in document');
        }
        break;

      case 'mortgage_statement':
        if (!data.lenderName) {
          errors.push('Lender name not found');
        }
        if (!data.currentBalance || data.currentBalance <= 0) {
          errors.push('Invalid current balance');
        }
        if (!data.monthlyPayment || data.monthlyPayment <= 0) {
          errors.push('Invalid monthly payment amount');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Classify text documents using Gemini
   */
  private async classifyTextDocumentWithGemini(filePath: string, model: string = 'gemini-2.5-flash'): Promise<DocumentClassification> {
    // Read first 2000 characters for classification
    const content = fs.readFileSync(filePath, 'utf-8').substring(0, 2000);

    const response = await gemini.models.generateContent({
      model: model,
      contents: [
        {
          role: "user",
          parts: [{
            text: `You are a document classifier for real estate property management. Classify documents as one of these types:
            - lease: Residential/commercial lease agreements, rental agreements, tenant documents
            - llc_document: LLC operating agreements, articles of organization, membership documents, corporate documents
            - mortgage_statement: Monthly mortgage/loan statements, lender statements, payment documents
            - unknown: Cannot determine or other document type
            
            Be generous with classification - if a document could reasonably be one of these types, classify it rather than marking as unknown.
            
            Analyze this document content and classify it. Content preview:
            
            ${content}
            
            Respond with JSON format:
            {
              "type": "lease|llc_document|mortgage_statement|unknown",
              "confidence": 0.0-1.0,
              "subtype": "brief description of document"
            }`
          }]
        }
      ],
      config: {
        responseMimeType: "application/json",
        temperature: 0.1
      }
    });

    const content_result = response.text;
    console.log('Gemini classification response:', content_result);
    
    try {
      const result = JSON.parse(content_result);
      console.log('Gemini document classification result:', result);

      return {
        type: result.type || 'unknown',
        confidence: Math.max(0, Math.min(1, result.confidence || 0)),
        subtype: result.subtype
      };
    } catch (parseError) {
      console.error('Failed to parse Gemini classification result:', parseError, 'Content:', content_result);
      return {
        type: 'unknown',
        confidence: 0,
        subtype: 'Failed to parse AI response'
      };
    }
  }

  /**
   * Generate suggested actions based on extracted data
   */
  private async generateSuggestedActions(documentType: string, data: any, model: string = 'gpt-4o'): Promise<string[]> {
    const actions: string[] = [];

    switch (documentType) {
      case 'lease':
        actions.push('Update rent roll with tenant information');
        actions.push('Set lease expiration reminder');
        if (data.securityDeposit) {
          actions.push('Record security deposit in escrow tracking');
        }
        break;

      case 'llc_document':
        actions.push('Update entity ownership records');
        actions.push('Sync member information with user accounts');
        actions.push('Update compliance tracking dates');
        break;

      case 'mortgage_statement':
        actions.push('Update loan balance in property records');
        actions.push('Sync payment schedule');
        if (data.escrowBalance) {
          actions.push('Update escrow balance tracking');
        }
        break;
    }

    return actions;
  }

  /**
   * Extract data from documents without specific templates
   */
  private async extractGenericDocumentData(filePath: string, documentType: string, model: string = 'gpt-4o'): Promise<any> {
    try {
      const content = await this.prepareDocumentContent(filePath);

      let prompt = '';
      switch (documentType) {
        case 'insurance_policy':
          prompt = `Extract insurance policy information. Return JSON with: {"insuranceCompany": "string", "policyNumber": "string", "coverageAmount": number, "annualPremium": number, "effectiveDate": "YYYY-MM-DD", "expirationDate": "YYYY-MM-DD", "coverageType": "string"}`;
          break;
        case 'vendor_invoice':
          prompt = `Extract vendor invoice information. Return JSON with: {"vendorName": "string", "invoiceNumber": "string", "invoiceAmount": number, "serviceDate": "YYYY-MM-DD", "workDescription": "string", "dueDate": "YYYY-MM-DD"}`;
          break;
        case 'tax_document':
          prompt = `Extract tax document information. Return JSON with: {"taxYear": "string", "assessedValue": number, "taxAmount": number, "dueDate": "YYYY-MM-DD", "propertyDescription": "string"}`;
          break;
        default:
          prompt = `Extract key information from this document. Return JSON with any relevant data you can identify such as dates, amounts, names, addresses, etc. Use descriptive field names.`;
      }

      // Check if it's a Gemini model
      if (model.startsWith('gemini-')) {
        try {
          return await this.extractGenericDataWithGemini(filePath, prompt, model);
        } catch (error) {
          console.warn('Gemini generic extraction failed, falling back to OpenAI:', error.message);
          // Fallback to OpenAI
        }
      }

      const response = await openai.chat.completions.create({
        model: model.startsWith('gemini-') ? 'gpt-4o' : model,
        messages: [
          {
            role: "system",
            content: prompt
          },
          {
            role: "user",
            content: content
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return result;
    } catch (error) {
      console.warn('Generic document extraction failed:', error.message);
      // Return basic structure with document content
      return {
        documentContent: await this.prepareDocumentContent(filePath),
        extractionError: error.message
      };
    }
  }

  /**
   * Extract generic data using Gemini
   */
  private async extractGenericDataWithGemini(filePath: string, prompt: string, model: string = 'gemini-2.5-flash'): Promise<any> {
    const content = await this.prepareDocumentContent(filePath);

    const response = await gemini.models.generateContent({
      model: model,
      contents: [{
        role: "user",
        parts: [{ text: `${prompt}\n\nDocument content:\n${content}` }]
      }],
      config: {
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text || '{}');
  }
}

export const aiDocumentProcessor = new AIDocumentProcessor();