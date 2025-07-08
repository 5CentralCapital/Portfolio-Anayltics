/**
 * Federal Reserve API Service
 * Fetches current market interest rates for real estate investment analysis
 */

interface FedApiResponse {
  realtime_start: string;
  realtime_end: string;
  observation_start: string;
  observation_end: string;
  units: string;
  output_type: number;
  file_type: string;
  order_by: string;
  sort_order: string;
  count: number;
  offset: number;
  limit: number;
  observations: Array<{
    realtime_start: string;
    realtime_end: string;
    date: string;
    value: string;
  }>;
}

export interface MarketRates {
  mortgageRate30Year: number;
  mortgageRate15Year: number;
  treasuryRate10Year: number;
  federalFundsRate: number;
  primeRate: number;
  lastUpdated: string;
}

class FederalReserveService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.stlouisfed.org/fred/series/observations';

  constructor() {
    this.apiKey = process.env.FEDERAL_RESERVE_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('FEDERAL_RESERVE_API_KEY environment variable is required');
    }
  }

  /**
   * Fetch interest rate data from FRED API
   */
  private async fetchRate(seriesId: string): Promise<number | null> {
    try {
      const url = new URL(this.baseUrl);
      url.searchParams.set('series_id', seriesId);
      url.searchParams.set('api_key', this.apiKey);
      url.searchParams.set('file_type', 'json');
      url.searchParams.set('limit', '1');
      url.searchParams.set('sort_order', 'desc');

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        console.error(`Fed API error for ${seriesId}:`, response.status, response.statusText);
        return null;
      }

      const data: FedApiResponse = await response.json();
      
      if (data.observations && data.observations.length > 0) {
        const latestValue = data.observations[0].value;
        return latestValue === '.' ? null : parseFloat(latestValue);
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching rate for ${seriesId}:`, error);
      return null;
    }
  }

  /**
   * Get current market interest rates
   */
  async getCurrentMarketRates(): Promise<MarketRates> {
    const [
      mortgageRate30Year,
      mortgageRate15Year,
      treasuryRate10Year,
      federalFundsRate,
      primeRate
    ] = await Promise.all([
      this.fetchRate('MORTGAGE30US'),    // 30-Year Fixed Rate Mortgage Average
      this.fetchRate('MORTGAGE15US'),    // 15-Year Fixed Rate Mortgage Average
      this.fetchRate('GS10'),           // 10-Year Treasury Constant Maturity Rate
      this.fetchRate('FEDFUNDS'),       // Federal Funds Effective Rate
      this.fetchRate('DPRIME')          // Bank Prime Loan Rate
    ]);

    return {
      mortgageRate30Year: mortgageRate30Year || 0,
      mortgageRate15Year: mortgageRate15Year || 0,
      treasuryRate10Year: treasuryRate10Year || 0,
      federalFundsRate: federalFundsRate || 0,
      primeRate: primeRate || 0,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Get recommended lending rates based on current market conditions
   */
  async getRecommendedLendingRates(): Promise<{
    acquisitionRate: number;
    refinanceRate: number;
    bridgeRate: number;
    constructionRate: number;
    lastUpdated: string;
  }> {
    const marketRates = await this.getCurrentMarketRates();
    
    // Calculate recommended rates based on market conditions
    // These are typical spreads above benchmark rates for investment properties
    const acquisitionRate = marketRates.mortgageRate30Year + 1.5; // 150bp above residential
    const refinanceRate = marketRates.mortgageRate30Year + 1.25;   // 125bp above residential
    const bridgeRate = marketRates.primeRate + 2.0;               // 200bp above prime
    const constructionRate = marketRates.primeRate + 3.0;         // 300bp above prime

    return {
      acquisitionRate: Math.max(acquisitionRate, 6.0), // Minimum 6% floor
      refinanceRate: Math.max(refinanceRate, 5.5),     // Minimum 5.5% floor
      bridgeRate: Math.max(bridgeRate, 8.0),           // Minimum 8% floor
      constructionRate: Math.max(constructionRate, 9.0), // Minimum 9% floor
      lastUpdated: marketRates.lastUpdated
    };
  }
}

export const federalReserveService = new FederalReserveService();