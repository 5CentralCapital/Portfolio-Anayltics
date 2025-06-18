import React from 'react';

interface ExpensesSectionProps {
  dealId: number;
  expenses: any[];
  closingCosts: any[];
  holdingCosts: any[];
  otherIncome: any[];
}

export function ExpensesSection({ dealId, expenses, closingCosts, holdingCosts, otherIncome }: ExpensesSectionProps) {
  return (
    <div className="bg-white p-6 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">Expenses & Other Income</h3>
      <p className="text-sm text-gray-500">
        Expenses management coming soon...
      </p>
    </div>
  );
}