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
      identifiers: ['Bank', 'Mortgage', 'Loan', 'Financial', 'Credit'],
      patterns: {
        currentBalance: /(?:Balance|Principal|Outstanding|Current Balance|Total Balance|Remaining Balance|Loan Balance|Unpaid Balance)[\s:$]*([0-9,]+\.?\d*)/i,
        monthlyPayment: /(?:Payment|Monthly|Monthly Payment|Principal & Interest|P&I|Regular Payment)[\s:$]*([0-9,]+\.?\d*)/i,
        interestRate: /(?:Rate|Interest|APR|Interest Rate|Annual Rate|Note Rate)[\s:]*([0-9.]+)%?/i,
        nextPaymentDate: /(?:Due|Payment|Next|Due Date|Next Payment Due|Payment Due)[\s:]*([0-9\/\-\s]+)/i,
        loanId: /(?:Number|ID|Account|Loan Number|Account Number|Loan ID|Reference)[\s:]*([A-Z0-9-]+)/i
      }
    },
    // Enhanced patterns for various formats
    enhanced: {
      identifiers: [''],
      patterns: {
        // Multiple balance patterns to catch different formats
        currentBalance: [
          /(?:Current|Outstanding|Principal|Unpaid|Remaining|Total)\s*(?:Balance|Amount)[\s:$]*([0-9,]+\.?\d*)/i,
          /Balance[\s:$]*([0-9,]+\.?\d*)/i,
          /\$\s*([0-9,]+\.?\d*)\s*(?:Balance|Outstanding|Principal)/i,
          /([0-9,]+\.?\d*)\s*(?:Balance|Outstanding|Principal)/i
        ],
        // Multiple payment patterns
        monthlyPayment: [
          /(?:Monthly|Regular|Scheduled)\s*Payment[\s:$]*([0-9,]+\.?\d*)/i,
          /Payment[\s:$]*([0-9,]+\.?\d*)/i,
          /P&I[\s:$]*([0-9,]+\.?\d*)/i
        ]
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
   * Parse mortgage statement format (Field/Value pairs) - Enhanced to handle multiple loans
   */
  private parseMortgageStatementFormat(data: any[], fileName: string): ParsedLoanData[] {
    const loans: ParsedLoanData[] = [];
    
    // Find all loan numbers first to determine loan boundaries
    const loanNumbers: string[] = [];
    for (const row of data) {
      if (row.Field === 'Loan Number' && row.Value) {
        loanNumbers.push(row.Value.toString());
      }
    }
    
    console.log('Found loan numbers:', loanNumbers);
    
    // Group data by loan number
    const loanGroups: { [key: string]: any } = {};
    let currentLoanNumber = '';
    let currentLoanIndex = -1;
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (row.Field && row.Value !== undefined) {
        // Check if this is a new loan number
        if (row.Field === 'Loan Number' && row.Value) {
          currentLoanNumber = row.Value.toString();
          currentLoanIndex = loanNumbers.indexOf(currentLoanNumber);
          if (!loanGroups[currentLoanNumber]) {
            loanGroups[currentLoanNumber] = {};
          }
        }
        
        // Add field to current loan group (only if we have a current loan)
        if (currentLoanNumber && loanGroups[currentLoanNumber]) {
          loanGroups[currentLoanNumber][row.Field] = row.Value;
        }
      }
    }
    
    console.log('Loan groups:', Object.keys(loanGroups));

    // Process each loan group
    for (const loanNumber in loanGroups) {
      const statementData = loanGroups[loanNumber];
      const interestRate = this.parseRate(statementData['Interest Rate']) || 0;
      const monthlyPayment = this.parseAmount(statementData['Regular Monthly Payment']) || 0;
      
      console.log(`Processing loan ${loanNumber}:`, {
        lender: statementData['Lender Name'],
        balance: this.parseAmount(statementData['Outstanding Principal Balance']),
        address: statementData['Property Address'],
        interestRate: interestRate,
        monthlyPayment: monthlyPayment,
        rawInterestRate: statementData['Interest Rate'],
        rawMonthlyPayment: statementData['Regular Monthly Payment']
      });
      
      const loanData: ParsedLoanData = {
        loanId: statementData['Loan Number'] || statementData['Account Number'] || '',
        lenderName: statementData['Lender Name'] || this.extractLenderName(fileName) || 'Unknown Lender',
        propertyAddress: statementData['Property Address'] || undefined,
      statementDate: this.extractDate(statementData['Statement Date']) || new Date().toISOString().split('T')[0],
      
      // Current balance - try multiple field names
      currentBalance: this.parseAmount(
        statementData['Outstanding Principal Balance'] || 
        statementData['Current Balance'] || 
        statementData['Principal Balance'] ||
        statementData['Balance'] || 0
      ),
      
      principalBalance: this.parseAmount(
        statementData['Outstanding Principal Balance'] || 
        statementData['Principal Balance'] || 0
      ),
      
      interestRate: this.parseRate(
        statementData['Interest Rate'] || 
        statementData['Rate'] || 0
      ),
      
      monthlyPayment: this.parseAmount(
        statementData['Regular Monthly Payment'] || 
        statementData['Monthly Payment'] || 
        statementData['Payment Amount'] || 0
      ),
      
      nextPaymentDate: this.extractDate(
        statementData['Payment Due Date'] || 
        statementData['Due Date'] || 
        statementData['Next Payment Date']
      ) || '',
      
      nextPaymentAmount: this.parseAmount(
        statementData['Amount Due'] || 
        statementData['Total Amount Due'] || 
        statementData['Payment Due'] || 0
      ),
      
      lastPaymentDate: this.extractDate(
        statementData['Last Payment Date']
      ),
      
      lastPaymentAmount: this.parseAmount(
        statementData['Last Payment Amount']
      ),
      
      escrowBalance: this.parseAmount(
        statementData['Escrow Balance'] || 
        statementData['Escrow Account Balance'] || 0
      ),
      
      remainingTerm: parseInt(
        statementData['Remaining Term (Months)'] || 
        statementData['Remaining Term'] || '0'
      ) || undefined,
      
        // Additional mortgage-specific fields
        additionalInfo: {
          fileName,
          prepaymentPenalty: statementData['Prepayment Penalty'],
          deferredBalance: this.parseAmount(statementData['Deferred Balance'] || 0),
          replacementReserveBalance: this.parseAmount(statementData['Replacement Reserve Balance'] || 0),
          pastDueAmount: this.parseAmount(statementData['Past Due Amount'] || 0),
          unappliedFunds: this.parseAmount(statementData['Unapplied Funds'] || 0),
          lateFeeAfterDate: this.extractDate(statementData['Late Fee After Date']),
          maxLateFee: this.parseAmount(statementData['Max Late Fee'] || 0),
          totalAmountDue: this.parseAmount(statementData['Total Amount Due'] || 0),
          originalLoanAmount: this.parseAmount(statementData['Original Loan Amount'] || 0),
          loanType: statementData['Loan Type'],
          maturityDate: this.extractDate(statementData['Maturity Date']),
          rawData: statementData
        }
      };
      
      loans.push(loanData);
    }

    return loans;
  }

  /**
   * Parse structured data (CSV/Excel)
   */
  private async parseStructuredData(data: any[], fileName: string): Promise<ParseResult> {
    const parsedData: ParsedLoanData[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if this is a mortgage statement format (Field/Value pairs)
    if (data.length > 0 && data[0].Field && data[0].Value !== undefined) {
      try {
        const loanDataArray = this.parseMortgageStatementFormat(data, fileName);
        
        // Process each loan
        for (const loanData of loanDataArray) {
          // Validate required fields
          if (!loanData.currentBalance || loanData.currentBalance <= 0) {
            warnings.push(`Loan ${loanData.loanId}: Missing or invalid current balance`);
          }
          if (!loanData.monthlyPayment || loanData.monthlyPayment <= 0) {
            warnings.push(`Loan ${loanData.loanId}: Missing or invalid monthly payment`);
          }
          if (!loanData.loanId) {
            warnings.push('Missing loan number/ID');
          }

          if (loanData.currentBalance > 0) {
            parsedData.push(loanData);
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
      } catch (error) {
        errors.push(`Mortgage statement parsing error: ${error.message}`);
      }
    }

    // Handle standard tabular format
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        const loanData: ParsedLoanData = {
          lenderName: this.extractLenderName(JSON.stringify(row)),
          statementDate: this.extractDate(row.date || row.Date || row.DATE || row['Statement Date']) || new Date().toISOString().split('T')[0],
          currentBalance: this.parseAmount(row.balance || row.Balance || row.BALANCE || row.current_balance || row['Current Balance'] || row['Outstanding Principal Balance']),
          principalBalance: this.parseAmount(row.principal || row.Principal || row.PRINCIPAL || row.principal_balance || row['Principal Balance']),
          interestRate: this.parseRate(row.rate || row.Rate || row.RATE || row.interest_rate || row['Interest Rate']),
          monthlyPayment: this.parseAmount(row.payment || row.Payment || row.PAYMENT || row.monthly_payment || row['Monthly Payment'] || row['Regular Monthly Payment']),
          nextPaymentDate: this.extractDate(row.next_payment || row.due_date || row['Next Payment'] || row['Due Date'] || row['Payment Due Date']) || '',
          nextPaymentAmount: this.parseAmount(row.next_amount || row.due_amount || row['Next Amount'] || row['Due Amount'] || row['Amount Due']),
          loanId: row.loan_id || row.account || row.Account || row.ACCOUNT || row['Loan ID'] || row['Account Number'] || row['Loan Number'],
          propertyAddress: row.property || row.Property || row.PROPERTY || row.address || row.Address || row.ADDRESS,
          escrowBalance: this.parseAmount(row.escrow || row.Escrow || row['Escrow Balance']),
          additionalInfo: {
            fileName,
            rowIndex: i,
            rawData: row
          }
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
    
    // Fallback: Try to find any large dollar amounts as potential balance
    if (currentBalance === 0) {
      const allNumbers = text.match(/\$?[\d,]+\.?\d*/g);
      if (allNumbers) {
        for (const numStr of allNumbers) {
          const amount = this.parseAmount(numStr);
          if (amount >= 10000 && amount <= 10000000) { // Reasonable loan balance range
            currentBalance = amount;
            break;
          }
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

    // Enhanced debugging information
    const debugInfo = {
      lenderDetected: lenderName,
      balanceFound: currentBalance,
      paymentFound: monthlyPayment,
      rateFound: interestRate,
      addressFound: propertyAddress || 'None',
      loanIdFound: loanId || 'None',
      textLength: text.length,
      hasNumbers: (text.match(/\d/g) || []).length > 0,
      hasDollarSigns: text.includes('$'),
      allNumbers: text.match(/[\d,]+\.?\d*/g) || [],
      firstFewLines: text.split('\n').slice(0, 5).join(' | ')
    };

    if (!parsedData.currentBalance || parsedData.currentBalance <= 0) {
      errors.push(`Could not extract valid current balance. Debug: ${JSON.stringify(debugInfo)}`);
    }

    if (!parsedData.monthlyPayment || parsedData.monthlyPayment <= 0) {
      warnings.push('Could not extract monthly payment amount');
    }

    if (!parsedData.propertyAddress) {
      warnings.push('Could not extract property address');
    }

    // Add debug info to additional info
    parsedData.additionalInfo = {
      ...parsedData.additionalInfo,
      debugInfo
    };

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
   * Parse amount from string - Enhanced to handle various financial formats
   */
  private parseAmount(value: any): number {
    if (typeof value === 'number') return Math.abs(value);
    if (typeof value === 'string') {
      // Remove common currency symbols and spaces
      let cleanValue = value.replace(/[$,\s]/g, '');
      
      // Handle parentheses for negative amounts (accounting format)
      let isNegative = false;
      if (cleanValue.includes('(') && cleanValue.includes(')')) {
        isNegative = true;
        cleanValue = cleanValue.replace(/[()]/g, '');
      }
      
      // Handle negative signs
      if (cleanValue.startsWith('-')) {
        isNegative = true;
        cleanValue = cleanValue.substring(1);
      }
      
      // Handle various decimal formats
      cleanValue = cleanValue.replace(/[^\d.]/g, '');
      
      const parsed = parseFloat(cleanValue);
      if (isNaN(parsed)) return 0;
      
      // Return absolute value for loan balances (always positive)
      return Math.abs(parsed);
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
      // Handle Excel serial dates (numbers like 45814)
      if (typeof value === 'number' && value > 25000 && value < 100000) {
        // Excel epoch is 1900-01-01, but Excel incorrectly treats 1900 as a leap year
        const excelEpoch = new Date(1900, 0, 1);
        const date = new Date(excelEpoch.getTime() + (value - 2) * 24 * 60 * 60 * 1000);
        return date.toISOString().split('T')[0];
      }
      
      // Handle regular date strings
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return null;
      }
      return date.toISOString().split('T')[0];
    } catch (error) {
      return null;
    }
  }

  /**
   * Parse date string/value and return proper Date object for database
   */
  private parseDate(value: any): Date | null {
    if (!value) return null;
    
    try {
      // Handle Excel serial dates (numbers like 45814)
      if (typeof value === 'number' && value > 25000 && value < 100000) {
        // Excel epoch is 1900-01-01, but Excel incorrectly treats 1900 as a leap year
        const excelEpoch = new Date(1900, 0, 1);
        const date = new Date(excelEpoch.getTime() + (value - 2) * 24 * 60 * 60 * 1000);
        return date;
      }
      
      // Handle regular date strings
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return null;
      }
      return date;
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

      // Try to match by property address with flexible matching
      if (!property && loan.propertyAddress) {
        // First try exact match
        property = await db.select()
          .from(properties)
          .where(eq(properties.address, loan.propertyAddress))
          .limit(1);
        
        // If no exact match, try fuzzy matching
        if (!property || property.length === 0) {
          const allProperties = await db.select().from(properties);
          
          // Normalize addresses for comparison
          const normalizeAddress = (addr: string) => {
            return addr.toLowerCase()
              .replace(/\s+/g, ' ')
              .replace(/\b(street|st|avenue|ave|drive|dr|boulevard|blvd|road|rd|lane|ln|court|ct|place|pl)\b/g, (match) => {
                const abbrevs: { [key: string]: string } = {
                  'street': 'st', 'avenue': 'ave', 'drive': 'dr', 'boulevard': 'blvd',
                  'road': 'rd', 'lane': 'ln', 'court': 'ct', 'place': 'pl'
                };
                return abbrevs[match.toLowerCase()] || match.toLowerCase();
              })
              .replace(/[^\w\s]/g, '')
              .trim();
          };
          
          const normalizedLoanAddress = normalizeAddress(loan.propertyAddress);
          
          for (const prop of allProperties) {
            const normalizedPropAddress = normalizeAddress(prop.address);
            if (normalizedPropAddress === normalizedLoanAddress || 
                normalizedPropAddress.includes(normalizedLoanAddress) ||
                normalizedLoanAddress.includes(normalizedPropAddress)) {
              property = [prop];
              console.log(`Fuzzy matched: "${loan.propertyAddress}" → "${prop.address}"`);
              break;
            }
          }
        }
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
        // Check if loan already exists for this property
        const existingLoan = await db.select()
          .from(propertyLoans)
          .where(and(
            eq(propertyLoans.propertyId, property.id),
            eq(propertyLoans.externalLoanId, loan.loanId)
          ))
          .limit(1);

        if (existingLoan.length > 0) {
          // Update existing loan
          await db.update(propertyLoans)
            .set({
              currentBalance: loan.currentBalance.toString(),
              interestRate: loan.interestRate.toString(),
              monthlyPayment: loan.monthlyPayment.toString(),
              principalBalance: loan.principalBalance?.toString(),
              nextPaymentDate: this.parseDate(loan.nextPaymentDate),
              nextPaymentAmount: loan.nextPaymentAmount?.toString(),
              escrowBalance: loan.escrowBalance?.toString(),
              lastSyncDate: new Date(),
              syncStatus: 'success'
            })
            .where(eq(propertyLoans.id, existingLoan[0].id));
        } else {
          // Create new loan
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
            maturityDate: this.parseDate(loan.nextPaymentDate) || new Date(Date.now() + 30 * 365 * 24 * 60 * 60 * 1000),
            isActive: true,
            lender: loan.lenderName,
            externalLoanId: loan.loanId,
            principalBalance: loan.principalBalance?.toString(),
            nextPaymentDate: this.parseDate(loan.nextPaymentDate),
            nextPaymentAmount: loan.nextPaymentAmount?.toString(),
            escrowBalance: loan.escrowBalance?.toString(),
            lastSyncDate: new Date(),
            syncStatus: 'success'
          });
        }

        updated++;
      } catch (error) {
        errors.push(`Failed to update loan for ${property.address}: ${error.message}`);
      }
    }

    return { updated, errors };
  }
}

export const documentParserService = new DocumentParserService();