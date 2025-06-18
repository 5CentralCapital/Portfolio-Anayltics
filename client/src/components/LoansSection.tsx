import React from 'react';

interface LoansSectionProps {
  dealId: number;
  loans: any[];
  kpis: any;
}

export function LoansSection({ dealId, loans, kpis }: LoansSectionProps) {
  return (
    <div className="bg-white p-6 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">Debt & Financing</h3>
      <p className="text-sm text-gray-600 mb-2">
        Monthly Debt Service: ${kpis.monthlyDebtService?.toLocaleString() || 0}
      </p>
      <p className="text-sm text-gray-600">
        Annual Debt Service: ${kpis.annualDebtService?.toLocaleString() || 0}
      </p>
      <p className="text-sm text-gray-500 mt-2">
        Loan management coming soon...
      </p>
    </div>
  );
}