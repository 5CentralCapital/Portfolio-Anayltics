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
        currentBalance: /(?:Current Balance|Outstanding Balance|Principal Balance).*?[\$]?([\d,]+\.?\d*)/i,
        monthlyPayment: /(?:Monthly Payment|Payment Amount|Regular Payment).*?[\$]?([\d,]+\.?\d*)/i,
        interestRate: /(?:Interest Rate|Annual Rate|APR).*?([\d]+\.?\d*%?)/i,
        nextPaymentDate: /(?:Next Payment Due|Payment Due Date|Due Date).*?(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
        loanId: /(?:Loan Number|Account Number|Loan ID).*?([A-Z0-9-]+)/i
      }
    },
    chase: {
      identifiers: ['Chase', 'CHASE', 'JPMorgan Chase'],
      patterns: {
        currentBalance: /(?:Current Balance|Outstanding Balance).*?[\$]?([\d,]+\.?\d*)/i,
        monthlyPayment: /(?:Monthly Payment|Payment Amount).*?[\$]?([\d,]+\.?\d*)/i,
        interestRate: /(?:Interest Rate|Rate).*?([\d]+\.?\d*%?)/i,
        nextPaymentDate: /(?:Next Payment Due|Due Date).*?(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
        loanId: /(?:Loan Number|Account).*?([A-Z0-9-]+)/i
      }
    },
    quicken: {
      identifiers: ['Quicken Loans', 'QUICKEN', 'Rocket Mortgage'],
      patterns: {
        currentBalance: /(?:Principal Balance|Current Balance).*?[\$]?([\d,]+\.?\d*)/i,
        monthlyPayment: /(?:Monthly Payment|Payment).*?[\$]?([\d,]+\.?\d*)/i,
        interestRate: /(?:Interest Rate|APR).*?([\d]+\.?\d*%?)/i,
        nextPaymentDate: /(?:Next Payment|Due Date).*?(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
        loanId: /(?:Loan Number|Loan ID).*?([A-Z0-9-]+)/i
      }
    },
    generic: {
      identifiers: ['Bank', 'Mortgage', 'Loan'],
      patterns: {
        currentBalance: /(?:Balance|Principal|Outstanding).*?[\$]?([\d,]+\.?\d*)/i,
        monthlyPayment: /(?:Payment|Monthly).*?[\$]?([\d,]+\.?\d*)/i,
        interestRate: /(?:Rate|Interest|APR).*?([\d]+\.?\d*%?)/i,
        nextPaymentDate: /(?:Due|Payment|Next).*?(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
        loanId: /(?:Number|ID|Account).*?([A-Z0-9-]+)/i
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
      
      // Try to extract text from PDF buffer
      let textContent = '';
      
      try {
        // Use dynamic import with error handling
        const pdfParse = await import('pdf-parse');
        const pdf = pdfParse.default || pdfParse;
        
        // Create options to skip test file loading
        const options = {
          // Skip loading test files
          pagerender: null,
          max: 0,
          version: 'v1.10.100'
        };
        
        const pdfData = await pdf(dataBuffer, options);
        textContent = pdfData.text;
      } catch (pdfError) {
        // If pdf-parse fails, try basic text extraction
        // Convert buffer to string and look for text patterns
        const bufferString = dataBuffer.toString('utf8', 0, Math.min(dataBuffer.length, 10000));
        
        // Look for readable text patterns
        const textMatches = bufferString.match(/[a-zA-Z0-9\s\$\.\,\-]{10,}/g);
        if (textMatches && textMatches.length > 0) {
          textContent = textMatches.join('\n');
        } else {
          throw new Error('Could not extract text from PDF. File may be encrypted or image-based.');
        }
      }
      
      if (!textContent || textContent.trim().length === 0) {
        return {
          success: false,
          errors: ['PDF appears to be empty or contains only images. Please use a text-based PDF.'],
          fileName,
          parsedCount: 0,
          warnings: ['For image-based PDFs, please use OCR software first or manually enter data using the CSV template.']
        };
      }
      
      // Parse the extracted text content
      return await this.parseTextContent(textContent, fileName);
      
    } catch (error) {
      return {
        success: false,
        errors: [`PDF parsing failed: ${error.message}`],
        fileName,
        parsedCount: 0,
        warnings: [
          'Tip: Ensure your PDF contains selectable text (not scanned images)',
          'Alternative: Copy text from PDF and save as .txt file'
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
    const patterns = this.getLenderPatterns(lenderName);
    
    const parsedData: ParsedLoanData = {
      lenderName,
      statementDate: new Date().toISOString().split('T')[0],
      currentBalance: this.extractWithPattern(text, patterns.currentBalance),
      principalBalance: this.extractWithPattern(text, patterns.currentBalance), // Fallback to current balance
      interestRate: this.extractWithPattern(text, patterns.interestRate),
      monthlyPayment: this.extractWithPattern(text, patterns.monthlyPayment),
      nextPaymentDate: this.extractWithPattern(text, patterns.nextPaymentDate),
      nextPaymentAmount: this.extractWithPattern(text, patterns.monthlyPayment), // Fallback to monthly payment
      loanId: this.extractWithPattern(text, patterns.loanId)
    };

    const errors: string[] = [];
    const warnings: string[] = [];

    if (!parsedData.currentBalance || parsedData.currentBalance <= 0) {
      errors.push('Could not extract valid current balance');
    }

    if (!parsedData.monthlyPayment || parsedData.monthlyPayment <= 0) {
      warnings.push('Could not extract monthly payment amount');
    }

    return {
      success: errors.length === 0,
      data: parsedData.currentBalance > 0 ? [parsedData] : undefined,
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