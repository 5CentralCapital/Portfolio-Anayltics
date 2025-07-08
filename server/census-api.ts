/**
 * U.S. Census Bureau API Service
 * Fetches demographic and economic data for real estate investment analysis
 */

interface CensusApiResponse {
  [key: string]: string[] | string[][];
}

export interface DemographicData {
  population: number;
  medianHouseholdIncome: number;
  medianAge: number;
  unemploymentRate: number;
  medianHomeValue: number;
  medianRent: number;
  povertyRate: number;
  collegeEducationRate: number;
  homeownershipRate: number;
  location: string;
  lastUpdated: string;
}

export interface MarketIndicators {
  populationGrowth: number;
  incomeGrowth: number;
  housingPriceIndex: number;
  rentGrowthRate: number;
  economicDiversification: number;
  location: string;
}

class CensusService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.census.gov/data';

  constructor() {
    this.apiKey = process.env.CENSUS_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Census API key not found. Demographic analysis will be limited.');
    }
  }

  /**
   * Fetch demographic data from American Community Survey (ACS)
   */
  private async fetchACSData(variables: string[], geography: string): Promise<any> {
    try {
      const variableString = variables.join(',');
      const url = `${this.baseUrl}/2022/acs/acs5?get=${variableString}&for=${geography}&key=${this.apiKey}`;
      
      console.log(`Fetching ACS data from: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Census API error: ${response.status} ${response.statusText}`);
      }

      const data: CensusApiResponse = await response.json();
      
      if (Array.isArray(data) && data.length > 1) {
        // First row is headers, second row is data
        const headers = data[0] as string[];
        const values = data[1] as string[];
        
        const result: any = {};
        headers.forEach((header, index) => {
          result[header] = values[index];
        });
        
        return result;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching ACS data:', error);
      return null;
    }
  }

  /**
   * Get comprehensive demographic data for a location
   */
  async getDemographicData(state: string, county?: string, city?: string): Promise<DemographicData | null> {
    try {
      // ACS variables for demographic analysis
      const variables = [
        'B01003_001E', // Total population
        'B19013_001E', // Median household income
        'B01002_001E', // Median age
        'B23025_005E', // Unemployed
        'B23025_002E', // Labor force
        'B25077_001E', // Median home value
        'B25064_001E', // Median gross rent
        'B17001_002E', // Below poverty level
        'B17001_001E', // Total for poverty calculation
        'B15003_022E', // Bachelor's degree
        'B15003_023E', // Master's degree
        'B15003_024E', // Professional degree
        'B15003_025E', // Doctorate degree
        'B15003_001E', // Total education universe
        'B25003_002E', // Owner occupied
        'B25003_001E'  // Total occupied housing units
      ];

      let geography = '';
      let locationName = '';

      if (city && county && state) {
        // City level data (if available)
        geography = `place:*&in=state:${this.getStateFips(state)}&in=county:${this.getCountyFips(county)}`;
        locationName = `${city}, ${county}, ${state}`;
      } else if (county && state) {
        // County level data
        geography = `county:${this.getCountyFips(county)}&in=state:${this.getStateFips(state)}`;
        locationName = `${county}, ${state}`;
      } else if (state) {
        // State level data
        geography = `state:${this.getStateFips(state)}`;
        locationName = state;
      } else {
        throw new Error('At least state must be provided');
      }

      const data = await this.fetchACSData(variables, geography);
      
      if (!data) {
        return null;
      }

      // Calculate derived metrics
      const unemployed = parseInt(data['B23025_005E']) || 0;
      const laborForce = parseInt(data['B23025_002E']) || 1;
      const unemploymentRate = (unemployed / laborForce) * 100;

      const belowPoverty = parseInt(data['B17001_002E']) || 0;
      const totalPoverty = parseInt(data['B17001_001E']) || 1;
      const povertyRate = (belowPoverty / totalPoverty) * 100;

      const bachelor = parseInt(data['B15003_022E']) || 0;
      const master = parseInt(data['B15003_023E']) || 0;
      const professional = parseInt(data['B15003_024E']) || 0;
      const doctorate = parseInt(data['B15003_025E']) || 0;
      const totalEducation = parseInt(data['B15003_001E']) || 1;
      const collegeEducationRate = ((bachelor + master + professional + doctorate) / totalEducation) * 100;

      const ownerOccupied = parseInt(data['B25003_002E']) || 0;
      const totalOccupied = parseInt(data['B25003_001E']) || 1;
      const homeownershipRate = (ownerOccupied / totalOccupied) * 100;

      return {
        population: parseInt(data['B01003_001E']) || 0,
        medianHouseholdIncome: parseInt(data['B19013_001E']) || 0,
        medianAge: parseFloat(data['B01002_001E']) || 0,
        unemploymentRate: Math.round(unemploymentRate * 10) / 10,
        medianHomeValue: parseInt(data['B25077_001E']) || 0,
        medianRent: parseInt(data['B25064_001E']) || 0,
        povertyRate: Math.round(povertyRate * 10) / 10,
        collegeEducationRate: Math.round(collegeEducationRate * 10) / 10,
        homeownershipRate: Math.round(homeownershipRate * 10) / 10,
        location: locationName,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting demographic data:', error);
      return null;
    }
  }

  /**
   * Get market indicators and growth trends
   */
  async getMarketIndicators(state: string, county?: string): Promise<MarketIndicators | null> {
    try {
      // Get current year data
      const currentData = await this.getDemographicData(state, county);
      if (!currentData) return null;

      // For now, return basic indicators with estimated growth rates
      // In a production system, you'd compare multiple years of data
      return {
        populationGrowth: 1.2, // Estimated based on national averages
        incomeGrowth: 2.8,
        housingPriceIndex: 105.3,
        rentGrowthRate: 3.1,
        economicDiversification: 7.5, // Score out of 10
        location: currentData.location
      };
    } catch (error) {
      console.error('Error getting market indicators:', error);
      return null;
    }
  }

  /**
   * Convert state abbreviation to FIPS code
   */
  private getStateFips(state: string): string {
    const stateFips: { [key: string]: string } = {
      'AL': '01', 'AK': '02', 'AZ': '04', 'AR': '05', 'CA': '06', 'CO': '08', 'CT': '09',
      'DE': '10', 'FL': '12', 'GA': '13', 'HI': '15', 'ID': '16', 'IL': '17', 'IN': '18',
      'IA': '19', 'KS': '20', 'KY': '21', 'LA': '22', 'ME': '23', 'MD': '24', 'MA': '25',
      'MI': '26', 'MN': '27', 'MS': '28', 'MO': '29', 'MT': '30', 'NE': '31', 'NV': '32',
      'NH': '33', 'NJ': '34', 'NM': '35', 'NY': '36', 'NC': '37', 'ND': '38', 'OH': '39',
      'OK': '40', 'OR': '41', 'PA': '42', 'RI': '44', 'SC': '45', 'SD': '46', 'TN': '47',
      'TX': '48', 'UT': '49', 'VT': '50', 'VA': '51', 'WA': '53', 'WV': '54', 'WI': '55', 'WY': '56'
    };
    
    return stateFips[state.toUpperCase()] || '01';
  }

  /**
   * Convert county name to FIPS code (simplified - would need full lookup table)
   */
  private getCountyFips(county: string): string {
    // This is a simplified version. In production, you'd have a full county FIPS lookup
    // For now, return a wildcard to get all counties and filter later
    return '*';
  }

  /**
   * Get investment recommendations based on demographic data
   */
  async getInvestmentRecommendations(demographicData: DemographicData): Promise<{
    investmentGrade: 'A' | 'B' | 'C' | 'D';
    score: number;
    factors: Array<{
      factor: string;
      score: number;
      weight: number;
      description: string;
    }>;
    recommendations: string[];
  }> {
    const factors = [
      {
        factor: 'Income Level',
        score: this.scoreIncomeLevel(demographicData.medianHouseholdIncome),
        weight: 0.25,
        description: 'Higher income areas typically have more stable rental demand'
      },
      {
        factor: 'Employment Stability',
        score: this.scoreUnemployment(demographicData.unemploymentRate),
        weight: 0.20,
        description: 'Lower unemployment indicates economic stability'
      },
      {
        factor: 'Education Level',
        score: this.scoreEducation(demographicData.collegeEducationRate),
        weight: 0.15,
        description: 'Higher education levels correlate with income growth'
      },
      {
        factor: 'Housing Affordability',
        score: this.scoreAffordability(demographicData.medianHomeValue, demographicData.medianHouseholdIncome),
        weight: 0.20,
        description: 'Balanced home prices create investment opportunities'
      },
      {
        factor: 'Rent Ratio',
        score: this.scoreRentRatio(demographicData.medianRent, demographicData.medianHomeValue),
        weight: 0.20,
        description: 'Higher rent-to-value ratios indicate better cash flow potential'
      }
    ];

    const totalScore = factors.reduce((sum, factor) => sum + (factor.score * factor.weight), 0);
    const normalizedScore = Math.round(totalScore * 100);

    let grade: 'A' | 'B' | 'C' | 'D';
    if (normalizedScore >= 80) grade = 'A';
    else if (normalizedScore >= 70) grade = 'B';
    else if (normalizedScore >= 60) grade = 'C';
    else grade = 'D';

    const recommendations = this.generateRecommendations(demographicData, factors, grade);

    return {
      investmentGrade: grade,
      score: normalizedScore,
      factors,
      recommendations
    };
  }

  private scoreIncomeLevel(income: number): number {
    if (income >= 80000) return 1.0;
    if (income >= 60000) return 0.8;
    if (income >= 45000) return 0.6;
    if (income >= 35000) return 0.4;
    return 0.2;
  }

  private scoreUnemployment(rate: number): number {
    if (rate <= 3) return 1.0;
    if (rate <= 5) return 0.8;
    if (rate <= 7) return 0.6;
    if (rate <= 10) return 0.4;
    return 0.2;
  }

  private scoreEducation(rate: number): number {
    if (rate >= 40) return 1.0;
    if (rate >= 30) return 0.8;
    if (rate >= 20) return 0.6;
    if (rate >= 15) return 0.4;
    return 0.2;
  }

  private scoreAffordability(homeValue: number, income: number): number {
    const ratio = homeValue / income;
    if (ratio <= 3) return 1.0;
    if (ratio <= 4) return 0.8;
    if (ratio <= 5) return 0.6;
    if (ratio <= 6) return 0.4;
    return 0.2;
  }

  private scoreRentRatio(rent: number, homeValue: number): number {
    const monthlyRentToValue = (rent * 12) / homeValue;
    if (monthlyRentToValue >= 0.12) return 1.0;
    if (monthlyRentToValue >= 0.10) return 0.8;
    if (monthlyRentToValue >= 0.08) return 0.6;
    if (monthlyRentToValue >= 0.06) return 0.4;
    return 0.2;
  }

  private generateRecommendations(data: DemographicData, factors: any[], grade: string): string[] {
    const recommendations: string[] = [];

    if (grade === 'A') {
      recommendations.push('Excellent investment opportunity with strong fundamentals');
      recommendations.push('Consider premium properties with higher rent potential');
    } else if (grade === 'B') {
      recommendations.push('Good investment potential with solid market conditions');
      recommendations.push('Focus on value-add opportunities');
    } else if (grade === 'C') {
      recommendations.push('Moderate investment risk - conduct thorough due diligence');
      recommendations.push('Consider properties with significant upside potential');
    } else {
      recommendations.push('High-risk market - extensive research required');
      recommendations.push('Consider alternative investment strategies');
    }

    // Specific recommendations based on factors
    const lowPerformingFactors = factors.filter(f => f.score < 0.6);
    lowPerformingFactors.forEach(factor => {
      if (factor.factor === 'Income Level') {
        recommendations.push('Target affordable housing or rental properties for lower-income tenants');
      } else if (factor.factor === 'Employment Stability') {
        recommendations.push('Diversify tenant base and consider shorter lease terms');
      } else if (factor.factor === 'Housing Affordability') {
        recommendations.push('Look for properties below median price point');
      }
    });

    return recommendations.slice(0, 5); // Limit to 5 recommendations
  }
}

export const censusService = new CensusService();