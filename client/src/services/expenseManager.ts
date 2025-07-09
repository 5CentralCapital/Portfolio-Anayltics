/**
 * Expense Management Service
 * Handles editable expenses with real-time updates and persistence
 */

export interface ExpenseItem {
  id: string;
  category: string;
  description: string;
  monthlyAmount: number;
  isPercentage: boolean;
  percentage?: number;
  isEditable: boolean;
}

export interface ExpenseCategory {
  insurance: ExpenseItem[];
  taxes: ExpenseItem[];
  maintenance: ExpenseItem[];
  management: ExpenseItem[];
  utilities: ExpenseItem[];
  other: ExpenseItem[];
}

export class ExpenseManager {
  private static readonly STORAGE_KEY_PREFIX = 'property_expenses_';
  
  /**
   * Get expenses for a property with proper fallback logic
   */
  static getPropertyExpenses(propertyId: number, dealAnalyzerData?: any): ExpenseCategory {
    // 1. Try to get user-edited expenses from localStorage
    const editedExpenses = this.getEditedExpenses(propertyId);
    if (editedExpenses) {
      console.log(`Using edited expenses for property ${propertyId}`);
      return editedExpenses;
    }
    
    // 2. Try to get expenses from Deal Analyzer data
    if (dealAnalyzerData?.expenses?.length > 0) {
      console.log(`Converting Deal Analyzer expenses for property ${propertyId}`);
      return this.convertDealAnalyzerExpenses(dealAnalyzerData.expenses);
    }
    
    // 3. Return default expense structure
    console.log(`Using default expenses for property ${propertyId}`);
    return this.getDefaultExpenses();
  }
  
  /**
   * Save user-edited expenses to localStorage
   */
  static saveEditedExpenses(propertyId: number, expenses: ExpenseCategory): void {
    const storageKey = this.STORAGE_KEY_PREFIX + propertyId;
    localStorage.setItem(storageKey, JSON.stringify(expenses));
    console.log(`Saved edited expenses for property ${propertyId}`);
    
    // Trigger a custom event to notify other components of the change
    window.dispatchEvent(new CustomEvent('expensesUpdated', { 
      detail: { propertyId, expenses } 
    }));
  }
  
  /**
   * Get user-edited expenses from localStorage
   */
  static getEditedExpenses(propertyId: number): ExpenseCategory | null {
    const storageKey = this.STORAGE_KEY_PREFIX + propertyId;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error(`Error parsing stored expenses for property ${propertyId}:`, e);
      }
    }
    return null;
  }
  
  /**
   * Check if property has user-edited expenses
   */
  static hasEditedExpenses(propertyId: number): boolean {
    return this.getEditedExpenses(propertyId) !== null;
  }
  
  /**
   * Clear edited expenses for a property
   */
  static clearEditedExpenses(propertyId: number): void {
    const storageKey = this.STORAGE_KEY_PREFIX + propertyId;
    localStorage.removeItem(storageKey);
    console.log(`Cleared edited expenses for property ${propertyId}`);
    
    // Trigger update event
    window.dispatchEvent(new CustomEvent('expensesUpdated', { 
      detail: { propertyId, expenses: null } 
    }));
  }
  
  /**
   * Add a new expense item to a category
   */
  static addExpenseItem(
    propertyId: number, 
    category: keyof ExpenseCategory, 
    item: Omit<ExpenseItem, 'id'>
  ): void {
    const expenses = this.getPropertyExpenses(propertyId);
    const newItem: ExpenseItem = {
      ...item,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    };
    
    expenses[category].push(newItem);
    this.saveEditedExpenses(propertyId, expenses);
  }
  
  /**
   * Update an existing expense item
   */
  static updateExpenseItem(
    propertyId: number, 
    category: keyof ExpenseCategory, 
    itemId: string, 
    updates: Partial<ExpenseItem>
  ): void {
    const expenses = this.getPropertyExpenses(propertyId);
    const itemIndex = expenses[category].findIndex(item => item.id === itemId);
    
    if (itemIndex !== -1) {
      expenses[category][itemIndex] = { 
        ...expenses[category][itemIndex], 
        ...updates 
      };
      this.saveEditedExpenses(propertyId, expenses);
    }
  }
  
  /**
   * Remove an expense item
   */
  static removeExpenseItem(
    propertyId: number, 
    category: keyof ExpenseCategory, 
    itemId: string
  ): void {
    const expenses = this.getPropertyExpenses(propertyId);
    expenses[category] = expenses[category].filter(item => item.id !== itemId);
    this.saveEditedExpenses(propertyId, expenses);
  }
  
  /**
   * Calculate total monthly expenses from expense structure
   */
  static calculateTotalMonthlyExpenses(expenses: ExpenseCategory, effectiveGrossIncome: number = 0): number {
    let total = 0;
    
    Object.values(expenses).forEach(categoryItems => {
      categoryItems.forEach(item => {
        if (item.isPercentage && item.percentage) {
          total += (effectiveGrossIncome / 12) * (item.percentage / 100);
        } else {
          total += item.monthlyAmount;
        }
      });
    });
    
    return total;
  }
  
  /**
   * Convert Deal Analyzer expenses to our expense structure
   */
  private static convertDealAnalyzerExpenses(dealAnalyzerExpenses: any[]): ExpenseCategory {
    const expenses: ExpenseCategory = {
      insurance: [],
      taxes: [],
      maintenance: [],
      management: [],
      utilities: [],
      other: []
    };
    
    dealAnalyzerExpenses.forEach((expense, index) => {
      const category = this.categorizeExpense(expense.category || expense.description || 'Other');
      const item: ExpenseItem = {
        id: `da_${index}`,
        category: expense.category || 'Other',
        description: expense.description || expense.category || 'Expense',
        monthlyAmount: parseFloat(expense.monthlyAmount || '0'),
        isPercentage: expense.isPercentage || false,
        percentage: expense.percentage ? parseFloat(expense.percentage) : undefined,
        isEditable: true
      };
      
      expenses[category].push(item);
    });
    
    return expenses;
  }
  
  /**
   * Get default expense structure
   */
  private static getDefaultExpenses(): ExpenseCategory {
    return {
      insurance: [
        {
          id: 'default_insurance',
          category: 'Insurance',
          description: 'Property Insurance',
          monthlyAmount: 0,
          isPercentage: true,
          percentage: 1.5, // 1.5% of EGI
          isEditable: true
        }
      ],
      taxes: [
        {
          id: 'default_taxes',
          category: 'Taxes',
          description: 'Property Taxes',
          monthlyAmount: 0,
          isPercentage: true,
          percentage: 3.0, // 3% of EGI
          isEditable: true
        }
      ],
      maintenance: [
        {
          id: 'default_maintenance',
          category: 'Maintenance',
          description: 'Maintenance & Repairs',
          monthlyAmount: 0,
          isPercentage: true,
          percentage: 5.0, // 5% of EGI
          isEditable: true
        }
      ],
      management: [
        {
          id: 'default_management',
          category: 'Management',
          description: 'Property Management',
          monthlyAmount: 0,
          isPercentage: true,
          percentage: 8.0, // 8% of EGI
          isEditable: true
        }
      ],
      utilities: [
        {
          id: 'default_utilities',
          category: 'Utilities',
          description: 'Utilities',
          monthlyAmount: 0,
          isPercentage: true,
          percentage: 2.0, // 2% of EGI
          isEditable: true
        }
      ],
      other: []
    };
  }
  
  /**
   * Categorize an expense based on its name/description
   */
  private static categorizeExpense(name: string): keyof ExpenseCategory {
    const lowercaseName = name.toLowerCase();
    
    if (lowercaseName.includes('insurance')) return 'insurance';
    if (lowercaseName.includes('tax')) return 'taxes';
    if (lowercaseName.includes('maintenance') || lowercaseName.includes('repair')) return 'maintenance';
    if (lowercaseName.includes('management') || lowercaseName.includes('manage')) return 'management';
    if (lowercaseName.includes('utilities') || lowercaseName.includes('utility')) return 'utilities';
    
    return 'other';
  }
}