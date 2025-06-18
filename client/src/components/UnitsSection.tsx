import React from 'react';

interface UnitsSectionProps {
  dealId: number;
  units: any[];
  grossRentalIncome: number;
}

export function UnitsSection({ dealId, units, grossRentalIncome }: UnitsSectionProps) {
  return (
    <div className="bg-white p-6 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">Units & Rent Roll</h3>
      <p className="text-sm text-gray-600">
        Gross Rental Income: ${grossRentalIncome?.toLocaleString() || 0}/year
      </p>
      <p className="text-sm text-gray-500 mt-2">
        Units management coming soon...
      </p>
    </div>
  );
}