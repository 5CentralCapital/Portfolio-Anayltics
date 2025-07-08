import React from 'react';
import { Download, FileText, Table } from 'lucide-react';

const CSVTemplateDownload: React.FC = () => {
  const downloadTemplate = (templateType: 'mortgage' | 'tabular') => {
    const templates = {
      mortgage: {
        filename: 'mortgage_statement_template.csv',
        content: `Field,Value
Loan Number,
Lender Name,
Property Address,
Statement Date,
Payment Due Date,
Amount Due,
Late Fee After Date,
Max Late Fee,
Outstanding Principal Balance,
Interest Rate,
Prepayment Penalty,
Deferred Balance,
Escrow Balance,
Replacement Reserve Balance,
Regular Monthly Payment,
Past Due Amount,
Unapplied Funds,
Total Amount Due,
Last Payment Date,
Last Payment Amount,
Remaining Term (Months),
Original Loan Amount,
Loan Type,
Maturity Date,`
      },
      tabular: {
        filename: 'loan_data_template.csv',
        content: `Loan Number,Lender Name,Property Address,Statement Date,Current Balance,Interest Rate,Monthly Payment,Payment Due Date,Amount Due,Escrow Balance,Last Payment Date,Last Payment Amount,Loan Type,Original Amount,Remaining Term
2005083711,Wells Fargo,123 Main St Hartford CT 06106,2025-06-07,487440.18,8.499,4672.97,2025-07-01,9345.94,7109.30,2025-06-01,4672.97,Acquisition,500000,300`
      }
    };

    const template = templates[templateType];
    const blob = new Blob([template.content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = template.filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800 mb-6">
      <div className="flex items-start space-x-3">
        <FileText className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
            CSV Template Downloads
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-400 mb-4">
            Download pre-formatted CSV templates for uploading loan data. Choose the format that matches your data source.
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-gray-600">
              <div className="flex items-center space-x-2 mb-2">
                <Table className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-gray-900 dark:text-white">Mortgage Statement Format</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Field/Value pair format - ideal for copying data from mortgage statements
              </p>
              <button
                onClick={() => downloadTemplate('mortgage')}
                className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Download Template</span>
              </button>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Fields: Loan Number, Outstanding Principal Balance, Interest Rate, Regular Monthly Payment, etc.
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-gray-600">
              <div className="flex items-center space-x-2 mb-2">
                <Table className="h-4 w-4 text-green-600" />
                <span className="font-medium text-gray-900 dark:text-white">Tabular Format</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Standard spreadsheet format - for multiple loans or bulk uploads
              </p>
              <button
                onClick={() => downloadTemplate('tabular')}
                className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Download Template</span>
              </button>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Columns: Loan Number, Lender Name, Current Balance, Interest Rate, Monthly Payment, etc.
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-xs text-blue-600 dark:text-blue-400">
            <strong>Tip:</strong> Both formats support all standard mortgage statement fields including escrow balances, past due amounts, and payment dates.
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSVTemplateDownload;