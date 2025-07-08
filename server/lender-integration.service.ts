/**
 * Lender Integration Service
 * Handles API integrations with various lenders to pull live debt data
 */

import { db } from './db';
import { properties, propertyLoans } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

export interface LenderCredentials {
  lenderName: string;
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  baseUrl?: string;
  environment: 'sandbox' | 'production';
}

export interface LiveLoanData {
  loanId: string;
  propertyId: number;
  lenderName: string;
  currentBalance: number;
  nextPaymentDate: string;
  nextPaymentAmount: number;
  interestRate: number;
  monthlyPayment: number;
  remainingTerm: number;
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
  escrowBalance?: number;
  principalBalance: number;
  interestBalance: number;
  lastUpdated: string;
}

export interface LenderApiResponse {
  success: boolean;
  data?: LiveLoanData[];
  error?: string;
  rateLimitReset?: number;
}

class LenderIntegrationService {
  private credentials: Map<string, LenderCredentials> = new Map();

  constructor() {
    this.loadCredentials();
  }

  /**
   * Load lender credentials from environment variables
   */
  private loadCredentials() {
    // Example lender configurations
    const lenderConfigs = [
      {
        lenderName: 'quicken_loans',
        apiKey: process.env.QUICKEN_LOANS_API_KEY,
        baseUrl: 'https://api.quickenloans.com/v1',
        environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
      },
      {
        lenderName: 'wells_fargo',
        clientId: process.env.WELLS_FARGO_CLIENT_ID,
        clientSecret: process.env.WELLS_FARGO_CLIENT_SECRET,
        baseUrl: 'https://api.wellsfargo.com/commercial/v1',
        environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
      },
      {
        lenderName: 'chase_bank',
        apiKey: process.env.CHASE_API_KEY,
        baseUrl: 'https://api.chase.com/business/v1',
        environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
      },
      {
        lenderName: 'local_bank',
        apiKey: process.env.LOCAL_BANK_API_KEY,
        baseUrl: process.env.LOCAL_BANK_API_URL,
        environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
      }
    ];

    lenderConfigs.forEach(config => {
      if (config.apiKey || (config.clientId && config.clientSecret)) {
        this.credentials.set(config.lenderName, config as LenderCredentials);
      }
    });
  }

  /**
   * Fetch live loan data from all configured lenders
   */
  async fetchAllLiveData(): Promise<Map<string, LenderApiResponse>> {
    const results = new Map<string, LenderApiResponse>();
    
    for (const [lenderName, credentials] of this.credentials) {
      try {
        const response = await this.fetchLenderData(lenderName, credentials);
        results.set(lenderName, response);
      } catch (error) {
        results.set(lenderName, {
          success: false,
          error: `Failed to fetch data from ${lenderName}: ${error.message}`
        });
      }
    }

    return results;
  }

  /**
   * Fetch data from a specific lender
   */
  private async fetchLenderData(lenderName: string, credentials: LenderCredentials): Promise<LenderApiResponse> {
    switch (lenderName) {
      case 'quicken_loans':
        return this.fetchQuickenLoansData(credentials);
      case 'wells_fargo':
        return this.fetchWellsFargoData(credentials);
      case 'chase_bank':
        return this.fetchChaseData(credentials);
      case 'local_bank':
        return this.fetchLocalBankData(credentials);
      default:
        throw new Error(`Unsupported lender: ${lenderName}`);
    }
  }

  /**
   * Quicken Loans API integration
   */
  private async fetchQuickenLoansData(credentials: LenderCredentials): Promise<LenderApiResponse> {
    const response = await fetch(`${credentials.baseUrl}/loans`, {
      headers: {
        'Authorization': `Bearer ${credentials.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      data: data.loans.map((loan: any) => ({
        loanId: loan.id,
        propertyId: this.mapLoanToProperty(loan.propertyAddress),
        lenderName: 'quicken_loans',
        currentBalance: loan.currentBalance,
        nextPaymentDate: loan.nextPaymentDate,
        nextPaymentAmount: loan.nextPaymentAmount,
        interestRate: loan.interestRate,
        monthlyPayment: loan.monthlyPayment,
        remainingTerm: loan.remainingTermMonths,
        lastPaymentDate: loan.lastPaymentDate,
        lastPaymentAmount: loan.lastPaymentAmount,
        escrowBalance: loan.escrowBalance,
        principalBalance: loan.principalBalance,
        interestBalance: loan.currentBalance - loan.principalBalance,
        lastUpdated: new Date().toISOString()
      }))
    };
  }

  /**
   * Wells Fargo API integration
   */
  private async fetchWellsFargoData(credentials: LenderCredentials): Promise<LenderApiResponse> {
    // First, get OAuth token
    const tokenResponse = await fetch(`${credentials.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString('base64')}`
      },
      body: 'grant_type=client_credentials&scope=commercial_loans'
    });

    if (!tokenResponse.ok) {
      throw new Error(`OAuth failed: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    
    // Fetch loan data
    const loansResponse = await fetch(`${credentials.baseUrl}/loans`, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/json'
      }
    });

    if (!loansResponse.ok) {
      throw new Error(`HTTP ${loansResponse.status}: ${loansResponse.statusText}`);
    }

    const loansData = await loansResponse.json();
    
    return {
      success: true,
      data: loansData.accounts.map((account: any) => ({
        loanId: account.accountId,
        propertyId: this.mapLoanToProperty(account.collateralAddress),
        lenderName: 'wells_fargo',
        currentBalance: account.currentBalance,
        nextPaymentDate: account.nextPaymentDueDate,
        nextPaymentAmount: account.nextPaymentAmount,
        interestRate: account.interestRate,
        monthlyPayment: account.regularPaymentAmount,
        remainingTerm: account.remainingTermMonths,
        principalBalance: account.principalBalance,
        interestBalance: account.currentBalance - account.principalBalance,
        lastUpdated: new Date().toISOString()
      }))
    };
  }

  /**
   * Chase Bank API integration
   */
  private async fetchChaseData(credentials: LenderCredentials): Promise<LenderApiResponse> {
    const response = await fetch(`${credentials.baseUrl}/commercial-loans`, {
      headers: {
        'Authorization': `Bearer ${credentials.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      data: data.loans.map((loan: any) => ({
        loanId: loan.loanNumber,
        propertyId: this.mapLoanToProperty(loan.propertyAddress),
        lenderName: 'chase_bank',
        currentBalance: loan.outstandingBalance,
        nextPaymentDate: loan.nextDueDate,
        nextPaymentAmount: loan.paymentAmount,
        interestRate: loan.currentRate,
        monthlyPayment: loan.monthlyPayment,
        remainingTerm: loan.remainingMonths,
        principalBalance: loan.principalBalance,
        interestBalance: loan.outstandingBalance - loan.principalBalance,
        lastUpdated: new Date().toISOString()
      }))
    };
  }

  /**
   * Local/Regional Bank API integration
   */
  private async fetchLocalBankData(credentials: LenderCredentials): Promise<LenderApiResponse> {
    const response = await fetch(`${credentials.baseUrl}/loans`, {
      headers: {
        'X-API-Key': credentials.apiKey,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      data: data.map((loan: any) => ({
        loanId: loan.id,
        propertyId: this.mapLoanToProperty(loan.property_address),
        lenderName: 'local_bank',
        currentBalance: loan.balance,
        nextPaymentDate: loan.next_payment_date,
        nextPaymentAmount: loan.payment_amount,
        interestRate: loan.interest_rate,
        monthlyPayment: loan.monthly_payment,
        remainingTerm: loan.remaining_term,
        principalBalance: loan.principal_balance,
        interestBalance: loan.balance - loan.principal_balance,
        lastUpdated: new Date().toISOString()
      }))
    };
  }

  /**
   * Map loan property address to internal property ID
   */
  private async mapLoanToProperty(address: string): Promise<number> {
    // This would need to be implemented based on your address matching logic
    // For now, return a placeholder
    const property = await db.select()
      .from(properties)
      .where(eq(properties.address, address))
      .limit(1);
    
    return property[0]?.id || 0;
  }

  /**
   * Update database with live loan data
   */
  async updateLoanData(liveData: LiveLoanData[]): Promise<void> {
    for (const loan of liveData) {
      if (loan.propertyId === 0) continue; // Skip if property not found
      
      // Update or create loan record
      await db.insert(propertyLoans).values({
        propertyId: loan.propertyId,
        loanName: `${loan.lenderName} Loan`,
        loanType: 'acquisition',
        originalAmount: loan.currentBalance.toString(),
        currentBalance: loan.currentBalance.toString(),
        interestRate: loan.interestRate.toString(),
        termYears: Math.ceil(loan.remainingTerm / 12),
        monthlyPayment: loan.monthlyPayment.toString(),
        paymentType: 'principal_and_interest',
        maturityDate: loan.nextPaymentDate,
        isActive: true,
        lender: loan.lenderName,
        externalLoanId: loan.loanId,
        principalBalance: loan.principalBalance.toString(),
        nextPaymentDate: loan.nextPaymentDate,
        nextPaymentAmount: loan.nextPaymentAmount.toString(),
        lastPaymentDate: loan.lastPaymentDate,
        lastPaymentAmount: loan.lastPaymentAmount?.toString(),
        escrowBalance: loan.escrowBalance?.toString(),
        remainingTerm: loan.remainingTerm,
        lastSyncDate: new Date().toISOString(),
        syncStatus: 'success'
      }).onConflictDoUpdate({
        target: [propertyLoans.propertyId, propertyLoans.externalLoanId],
        set: {
          currentBalance: loan.currentBalance.toString(),
          interestRate: loan.interestRate.toString(),
          monthlyPayment: loan.monthlyPayment.toString(),
          principalBalance: loan.principalBalance.toString(),
          nextPaymentDate: loan.nextPaymentDate,
          nextPaymentAmount: loan.nextPaymentAmount.toString(),
          lastPaymentDate: loan.lastPaymentDate,
          lastPaymentAmount: loan.lastPaymentAmount?.toString(),
          escrowBalance: loan.escrowBalance?.toString(),
          remainingTerm: loan.remainingTerm,
          lastSyncDate: new Date().toISOString(),
          syncStatus: 'success',
          syncError: null
        }
      });
    }
  }

  /**
   * Sync all lender data and update database
   */
  async syncAllLenders(): Promise<{ success: boolean; results: Map<string, LenderApiResponse>; errors: string[] }> {
    const results = await this.fetchAllLiveData();
    const errors: string[] = [];
    
    for (const [lenderName, response] of results) {
      if (response.success && response.data) {
        try {
          await this.updateLoanData(response.data);
        } catch (error) {
          errors.push(`Failed to update ${lenderName} data: ${error.message}`);
        }
      } else {
        errors.push(response.error || `Unknown error for ${lenderName}`);
      }
    }

    return {
      success: errors.length === 0,
      results,
      errors
    };
  }
}

export const lenderIntegrationService = new LenderIntegrationService();