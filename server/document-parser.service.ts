/**
 * Document Parser Service
 * Handles parsing of various lender statement formats (PDF, CSV, Excel)
 */

import * as XLSX from 'xlsx';
import { promises as fs } from 'fs';
import { db } from './db';
import { properties, propertyLoans } from '@shared/schema';
import { eq } from 'drizzle-orm';

export interface ParsedLoanData {
  loanId?: string;
  propertyAddress?: string;
  lenderName: string;
  statementDate: string;
  currentBalance: number;
  principalBalance: number;
  interestRate: number;
  monthlyPayment: number;
  nextPaymentDate: string;
  nextPaymentAmount: number;
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
  escrowBalance?: number;
  remainingTerm?: number;
  additionalInfo?: Record<string, any>;
}

export interface ParseResult {
  success: boolean;
  data?: ParsedLoanData[];
  errors?: string[];
  warnings?: string[];
  fileName: string;
  parsedCount: number;
}

class DocumentParserService {
  private lenderPatterns = {
    wells_fargo: {
      identifiers: ['Wells Fargo', 'WELLS FARGO', 'wells fargo'],
      patterns: {
        currentBalance: /(?:Current Balance|Outstanding Balance|Principal Balance|Balance)[\s:]*\$?([0-9,]+\.?\d*)/i,
        monthlyPayment: /(?:Monthly Payment|Payment Amount|Regular Payment|Payment)[\s:]*\$?([0-9,]+\.?\d*)/i,
        interestRate: /(?:Interest Rate|Annual Rate|APR|Rate)[\s:]*([0-9.]+)%?/i,
        nextPaymentDate: /(?:Next Payment Due|Payment Due Date|Due Date)[\s:]*([0-9\/\-]+)/i,
        loanId: /(?:Loan Number|Account Number|Loan ID)[\s:]*([A-Z0-9-]+)/i
      }
    },
    chase: {
      identifiers: ['Chase', 'CHASE', 'JPMorgan Chase'],
      patterns: {
        currentBalance: /(?:Current Balance|Outstanding Balance|Balance)[\s:]*\$?([0-9,]+\.?\d*)/i,
        monthlyPayment: /(?:Monthly Payment|Payment Amount|Payment)[\s:]*\$?([0-9,]+\.?\d*)/i,
        interestRate: /(?:Interest Rate|Rate)[\s:]*([0-9.]+)%?/i,
        nextPaymentDate: /(?:Next Payment Due|Due Date)[\s:]*([0-9\/\-]+)/i,
        loanId: /(?:Loan Number|Account)[\s:]*([A-Z0-9-]+)/i
      }
    },
    quicken: {
      identifiers: ['Quicken Loans', 'QUICKEN', 'Rocket Mortgage'],
      patterns: {
        currentBalance: /(?:Principal Balance|Current Balance|Balance)[\s:]*\$?([0-9,]+\.?\d*)/i,
        monthlyPayment: /(?:Monthly Payment|Payment)[\s:]*\$?([0-9,]+\.?\d*)/i,
        interestRate: /(?:Interest Rate|APR|Rate)[\s:]*([0-9.]+)%?/i,
        nextPaymentDate: /(?:Next Payment|Due Date)[\s:]*([0-9\/\-]+)/i,
        loanId: /(?:Loan Number|Loan ID)[\s:]*([A-Z0-9-]+)/i
      }
    },
    generic: {
      identifiers: ['Bank', 'Mortgage', 'Loan'],
      patterns: {
        currentBalance: /(?:Balance|Principal|Outstanding|Current Balance)[\s:]*\$?([0-9,]+\.?\d*)/i,
        monthlyPayment: /(?:Payment|Monthly|Monthly Payment)[\s:]*\$?([0-9,]+\.?\d*)/i,
        interestRate: /(?:Rate|Interest|APR|Interest Rate)[\s:]*([0-9.]+)%?/i,
        nextPaymentDate: /(?:Due|Payment|Next|Due Date)[\s:]*([0-9\/\-]+)/i,
        loanId: /(?:Number|ID|Account|Loan Number)[\s:]*([A-Z0-9-]+)/i
      }
    }
  };

  /**
   * Parse uploaded document based on file type
   */
  async parseDocument(filePath: string, fileName: string): Promise<ParseResult> {
    try {
      const fileExtension = fileName.split('.').pop()?.toLowerCase();
      
      switch (fileExtension) {
        case 'pdf':
          return await this.parsePDF(filePath, fileName);
        case 'csv':
          return await this.parseCSV(filePath, fileName);
        case 'xlsx':
        case 'xls':
          return await this.parseExcel(filePath, fileName);
        case 'txt':
          return await this.parseText(filePath, fileName);
        default:
          return {
            success: false,
            errors: [`Unsupported file type: ${fileExtension}`],
            fileName,
            parsedCount: 0
          };
      }
    } catch (error) {
      return {
        success: false,
        errors: [`Failed to parse document: ${error.message}`],
        fileName,
        parsedCount: 0
      };
    }
  }

  /**
   * Parse PDF document
   */
  private async parsePDF(filePath: string, fileName: string): Promise<ParseResult> {
    try {
      // Read file buffer
      const dataBuffer = await fs.readFile(filePath);
      
      // Try to extract text from PDF
      let textContent = '';
      
      try {
        // Import pdf-parse and handle it properly
        const pdfParseModule = await import('pdf-parse');
        const pdfParse = pdfParseModule.default;
        
        // Extract text from PDF
        const pdfData = await pdfParse(dataBuffer);
        textContent = pdfData.text;
        
        if (!textContent || textContent.trim().length === 0) {
          return {
            success: false,
            errors: ['PDF appears to be empty or contains only images'],
            fileName,
            parsedCount: 0,
            warnings: [
              'This PDF may be image-based or encrypted',
              'Try using a text-based PDF or copy/paste the text into a .txt file'
            ]
          };
        }
        
        // Parse the extracted text content
        return await this.parseTextContent(textContent, fileName);
        
      } catch (pdfError) {
        // If pdf-parse fails, try basic text extraction from buffer
        const bufferText = dataBuffer.toString('utf8');
        
        // Look for readable text patterns in the buffer
        const textPatterns = [
          /BT\s+([^ET]*)\s+ET/g,  // PDF text objects
          /Tj\s*\((.*?)\)/g,       // Text show operators
          /\((.*?)\)\s*Tj/g,       // Text in parentheses
          /\$[\d,]+\.?\d*/g,       // Dollar amounts
          /\d+\.?\d*%/g,           // Percentages
          /\d{1,2}\/\d{1,2}\/\d{2,4}/g // Dates
        ];
        
        let extractedText = '';
        for (const pattern of textPatterns) {
          const matches = bufferText.match(pattern);
          if (matches) {
            extractedText += matches.join(' ') + '\n';
          }
        }
        
        if (extractedText.trim().length > 0) {
          return await this.parseTextContent(extractedText, fileName);
        }
        
        return {
          success: false,
          errors: [`PDF text extraction failed: ${pdfError.message}`],
          fileName,
          parsedCount: 0,
          warnings: [
            'This PDF may be encrypted, password-protected, or image-based',
            'Try: 1) Copy text from PDF and save as .txt file, 2) Use CSV/Excel format instead'
          ]
        };
      }
      
    } catch (error) {
      return {
        success: false,
        errors: [`PDF processing error: ${error.message}`],
        fileName,
        parsedCount: 0,
        warnings: [
          'PDF file may be corrupted or in an unsupported format',
          'Alternative: Convert to CSV or text format'
        ]
      };
    }
  }

  /**
   * Parse CSV document
   */
  private async parseCSV(filePath: string, fileName: string): Promise<ParseResult> {
    try {
      const fileContent = await fs.readFile(filePath, 'utf8');
      const workbook = XLSX.read(fileContent, { type: 'string' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      return await this.parseStructuredData(data, fileName);
    } catch (error) {
      return {
        success: false,
        errors: [`CSV parsing failed: ${error.message}`],
        fileName,
        parsedCount: 0
      };
    }
  }

  /**
   * Parse Excel document
   */
  private async parseExcel(filePath: string, fileName: string): Promise<ParseResult> {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      return await this.parseStructuredData(data, fileName);
    } catch (error) {
      return {
        success: false,
        errors: [`Excel parsing failed: ${error.message}`],
        fileName,
        parsedCount: 0
      };
    }
  }

  /**
   * Parse text document
   */
  private async parseText(filePath: string, fileName: string): Promise<ParseResult> {
    try {
      const textContent = await fs.readFile(filePath, 'utf8');
      return await this.parseTextContent(textContent, fileName);
    } catch (error) {
      return {
        success: false,
        errors: [`Text parsing failed: ${error.message}`],
        fileName,
        parsedCount: 0
      };
    }
  }

  /**
   * Parse structured data (CSV/Excel)
   */
  private async parseStructuredData(data: any[], fileName: string): Promise<ParseResult> {
    const parsedData: ParsedLoanData[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        const loanData: ParsedLoanData = {
          lenderName: this.extractLenderName(JSON.stringify(row)),
          statementDate: this.extractDate(row.date || row.Date || row.DATE) || new Date().toISOString().split('T')[0],
          currentBalance: this.parseAmount(row.balance || row.Balance || row.BALANCE || row.current_balance || row['Current Balance']),
          principalBalance: this.parseAmount(row.principal || row.Principal || row.PRINCIPAL || row.principal_balance || row['Principal Balance']),
          interestRate: this.parseRate(row.rate || row.Rate || row.RATE || row.interest_rate || row['Interest Rate']),
          monthlyPayment: this.parseAmount(row.payment || row.Payment || row.PAYMENT || row.monthly_payment || row['Monthly Payment']),
          nextPaymentDate: this.extractDate(row.next_payment || row.due_date || row['Next Payment'] || row['Due Date']) || '',
          nextPaymentAmount: this.parseAmount(row.next_amount || row.due_amount || row['Next Amount'] || row['Due Amount']),
          loanId: row.loan_id || row.account || row.Account || row.ACCOUNT || row['Loan ID'] || row['Account Number'],
          propertyAddress: row.property || row.Property || row.PROPERTY || row.address || row.Address || row.ADDRESS
        };

        if (loanData.currentBalance > 0) {
          parsedData.push(loanData);
        } else {
          warnings.push(`Row ${i + 1}: Invalid balance amount`);
        }
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }

    return {
      success: parsedData.length > 0,
      data: parsedData,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      fileName,
      parsedCount: parsedData.length
    };
  }

  /**
   * Parse unstructured text content
   */
  private async parseTextContent(text: string, fileName: string): Promise<ParseResult> {
    const lenderName = this.extractLenderName(text);
    
    // Enhanced extraction with specific patterns
    let currentBalance = 0;
    let monthlyPayment = 0;
    let interestRate = 0;
    let propertyAddress = '';
    let loanId = '';
    
    // Current Balance patterns - more specific
    const balancePatterns = [
      /current\s+balance[:\s]*\$?([\d,]+\.?\d*)/i,
      /outstanding\s+balance[:\s]*\$?([\d,]+\.?\d*)/i,
      /principal\s+balance[:\s]*\$?([\d,]+\.?\d*)/i,
      /loan\s+balance[:\s]*\$?([\d,]+\.?\d*)/i,
      /balance[:\s]*\$?([\d,]+\.?\d*)/i
    ];
    
    // Monthly Payment patterns
    const paymentPatterns = [
      /monthly\s+payment[:\s]*\$?([\d,]+\.?\d*)/i,
      /payment\s+amount[:\s]*\$?([\d,]+\.?\d*)/i,
      /total\s+payment[:\s]*\$?([\d,]+\.?\d*)/i,
      /payment[:\s]*\$?([\d,]+\.?\d*)/i
    ];
    
    // Interest Rate patterns
    const ratePatterns = [
      /interest\s+rate[:\s]*([\d.]+)%?/i,
      /rate[:\s]*([\d.]+)%/i,
      /([\d.]+)%\s*interest/i
    ];
    
    // Property Address patterns
    const addressPatterns = [
      /property\s+address[:\s]*(.+?)(?:\n|$)/i,
      /subject\s+property[:\s]*(.+?)(?:\n|$)/i,
      /address[:\s]*(.+?)(?:\n|$)/i,
      /(\d+\s+[^,\n]+(?:st|street|ave|avenue|dr|drive|blvd|boulevard|rd|road|ln|lane|ct|court|pl|place)[^,\n]*(?:,\s*[^,\n]+)*)/i
    ];
    
    // Loan ID patterns
    const loanIdPatterns = [
      /loan\s+(?:number|id|#)[:\s]*([a-zA-Z0-9]+)/i,
      /account\s+(?:number|id|#)[:\s]*([a-zA-Z0-9]+)/i,
      /loan\s*#?\s*([a-zA-Z0-9]{6,})/i
    ];
    
    // Extract current balance
    for (const pattern of balancePatterns) {
      const match = text.match(pattern);
      if (match) {
        const amount = this.parseAmount(match[1]);
        if (amount >= 1000) { // Reasonable minimum for a loan balance
          currentBalance = amount;
          break;
        }
      }
    }
    
    // Extract monthly payment
    for (const pattern of paymentPatterns) {
      const match = text.match(pattern);
      if (match) {
        const amount = this.parseAmount(match[1]);
        if (amount >= 100 && amount <= 50000) { // Reasonable payment range
          monthlyPayment = amount;
          break;
        }
      }
    }
    
    // Extract interest rate
    for (const pattern of ratePatterns) {
      const match = text.match(pattern);
      if (match) {
        const rate = this.parseRate(match[1]);
        if (rate > 0 && rate <= 20) { // Reasonable interest rate range
          interestRate = rate;
          break;
        }
      }
    }
    
    // Extract property address
    for (const pattern of addressPatterns) {
      const match = text.match(pattern);
      if (match) {
        propertyAddress = match[1].trim();
        break;
      }
    }
    
    // Extract loan ID
    for (const pattern of loanIdPatterns) {
      const match = text.match(pattern);
      if (match) {
        loanId = match[1].trim();
        break;
      }
    }
    
    const parsedData: ParsedLoanData = {
      lenderName,
      statementDate: new Date().toISOString().split('T')[0],
      currentBalance,
      principalBalance: currentBalance,
      interestRate,
      monthlyPayment,
      nextPaymentDate: '',
      nextPaymentAmount: monthlyPayment,
      propertyAddress,
      loanId: loanId || 'UNKNOWN',
      lastPaymentDate: '',
      lastPaymentAmount: monthlyPayment,
      escrowBalance: 0,
      additionalInfo: {
        originalText: text.substring(0, 500),
        extractedLines: text.split('\n').length,
        fileName
      }
    };

    const errors: string[] = [];
    const warnings: string[] = [];

    if (!parsedData.currentBalance || parsedData.currentBalance <= 0) {
      errors.push('Could not extract valid current balance from the document');
    }

    if (!parsedData.monthlyPayment || parsedData.monthlyPayment <= 0) {
      warnings.push('Could not extract monthly payment amount');
    }

    if (!parsedData.propertyAddress) {
      warnings.push('Could not extract property address');
    }

    return {
      success: errors.length === 0,
      data: parsedData.currentBalance > 0 ? [parsedData] : [],
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      fileName,
      parsedCount: parsedData.currentBalance > 0 ? 1 : 0
    };
  }

  /**
   * Extract lender name from content
   */
  private extractLenderName(content: string): string {
    for (const [lenderKey, config] of Object.entries(this.lenderPatterns)) {
      for (const identifier of config.identifiers) {
        if (content.includes(identifier)) {
          return lenderKey.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
      }
    }
    return 'Unknown Lender';
  }

  /**
   * Get patterns for specific lender
   */
  private getLenderPatterns(lenderName: string) {
    const lenderKey = lenderName.toLowerCase().replace(' ', '_');
    return this.lenderPatterns[lenderKey] || this.lenderPatterns.generic;
  }

  /**
   * Extract data using regex pattern
   */
  private extractWithPattern(text: string, pattern: RegExp): any {
    const match = text.match(pattern);
    if (match && match[1]) {
      const value = match[1];
      
      // If it looks like a number, parse as amount
      if (/[\d,]+\.?\d*/.test(value)) {
        return this.parseAmount(value);
      }
      
      // If it looks like a date, parse as date
      if (/\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}/.test(value)) {
        return this.extractDate(value);
      }
      
      return value;
    }
    return null;
  }

  /**
   * Parse amount from string
   */
  private parseAmount(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const cleanValue = value.replace(/[$,]/g, '');
      const parsed = parseFloat(cleanValue);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  /**
   * Parse interest rate from string
   */
  private parseRate(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const cleanValue = value.replace(/[%]/g, '');
      const parsed = parseFloat(cleanValue);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  /**
   * Extract date from string
   */
  private extractDate(value: any): string | null {
    if (!value) return null;
    
    try {
      const date = new Date(value);
      return date.toISOString().split('T')[0];
    } catch (error) {
      return null;
    }
  }

  /**
   * Match parsed data to properties in database
   */
  async matchToProperties(parsedData: ParsedLoanData[]): Promise<{ matched: any[], unmatched: ParsedLoanData[] }> {
    const matched: any[] = [];
    const unmatched: ParsedLoanData[] = [];

    for (const loan of parsedData) {
      let property = null;

      // Try to match by loan ID first
      if (loan.loanId) {
        const existingLoan = await db.select()
          .from(propertyLoans)
          .where(eq(propertyLoans.externalLoanId, loan.loanId))
          .limit(1);

        if (existingLoan.length > 0) {
          property = await db.select()
            .from(properties)
            .where(eq(properties.id, existingLoan[0].propertyId))
            .limit(1);
        }
      }

      // Try to match by property address
      if (!property && loan.propertyAddress) {
        property = await db.select()
          .from(properties)
          .where(eq(properties.address, loan.propertyAddress))
          .limit(1);
      }

      if (property && property.length > 0) {
        matched.push({
          loan,
          property: property[0]
        });
      } else {
        unmatched.push(loan);
      }
    }

    return { matched, unmatched };
  }

  /**
   * Update database with parsed loan data
   */
  async updateLoanData(matchedData: any[]): Promise<{ updated: number, errors: string[] }> {
    let updated = 0;
    const errors: string[] = [];

    for (const { loan, property } of matchedData) {
      try {
        await db.insert(propertyLoans).values({
          propertyId: property.id,
          loanName: `${loan.lenderName} Loan`,
          loanType: 'acquisition',
          originalAmount: loan.currentBalance.toString(),
          currentBalance: loan.currentBalance.toString(),
          interestRate: loan.interestRate.toString(),
          termYears: 30, // Default, can be updated manually
          monthlyPayment: loan.monthlyPayment.toString(),
          paymentType: 'principal_and_interest',
          maturityDate: loan.nextPaymentDate || new Date().toISOString().split('T')[0],
          isActive: true,
          lender: loan.lenderName,
          externalLoanId: loan.loanId,
          principalBalance: loan.principalBalance?.toString(),
          nextPaymentDate: loan.nextPaymentDate,
          nextPaymentAmount: loan.nextPaymentAmount?.toString(),
          escrowBalance: loan.escrowBalance?.toString(),
          lastSyncDate: new Date().toISOString(),
          syncStatus: 'success'
        }).onConflictDoUpdate({
          target: [propertyLoans.propertyId, propertyLoans.externalLoanId],
          set: {
            currentBalance: loan.currentBalance.toString(),
            interestRate: loan.interestRate.toString(),
            monthlyPayment: loan.monthlyPayment.toString(),
            principalBalance: loan.principalBalance?.toString(),
            nextPaymentDate: loan.nextPaymentDate,
            nextPaymentAmount: loan.nextPaymentAmount?.toString(),
            escrowBalance: loan.escrowBalance?.toString(),
            lastSyncDate: new Date().toISOString(),
            syncStatus: 'success'
          }
        });

        updated++;
      } catch (error) {
        errors.push(`Failed to update loan for ${property.address}: ${error.message}`);
      }
    }

    return { updated, errors };
  }
}

export const documentParserService = new DocumentParserService();