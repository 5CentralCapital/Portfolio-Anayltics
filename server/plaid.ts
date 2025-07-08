import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

// Plaid configuration
const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox, // Use sandbox for development
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': '686d1ec7090587002223eb4c',
      'PLAID-SECRET': 'f8f7e833e2f9ea0577c21d79e7317f',
    },
  },
});

export const plaidClient = new PlaidApi(configuration);

// Helper function to create link token
export async function createLinkToken(userId: string) {
  try {
    const request = {
      user: {
        client_user_id: userId.toString(),
      },
      client_name: '5Central Capital Analytics',
      products: ['transactions'] as const,
      country_codes: ['US'] as const,
      language: 'en' as const,
      account_filters: {
        depository: {
          account_subtypes: ['checking', 'savings', 'money_market']
        }
      }
    };

    const response = await plaidClient.linkTokenCreate(request);
    return response.data;
  } catch (error) {
    console.error('Error creating link token:', error);
    throw error;
  }
}

// Helper function to exchange public token for access token
export async function exchangePublicToken(publicToken: string) {
  try {
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });
    
    return response.data;
  } catch (error) {
    console.error('Error exchanging public token:', error);
    throw error;
  }
}

// Helper function to get account balances
export async function getAccountBalances(accessToken: string) {
  try {
    const response = await plaidClient.accountsBalanceGet({
      access_token: accessToken,
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting account balances:', error);
    throw error;
  }
}

// Helper function to get transactions
export async function getTransactions(accessToken: string, startDate: string, endDate: string) {
  try {
    const response = await plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate,
      count: 100,
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting transactions:', error);
    throw error;
  }
}

// Helper function to get account information
export async function getAccountInfo(accessToken: string) {
  try {
    const response = await plaidClient.accountsGet({
      access_token: accessToken,
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting account info:', error);
    throw error;
  }
}