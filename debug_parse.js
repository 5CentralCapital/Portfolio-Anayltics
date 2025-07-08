// Test document parser with sample data
const sampleCSVData = `Lender,Property Address,Loan ID,Current Balance,Monthly Payment,Interest Rate,Next Payment Date,Statement Date
Wells Fargo,123 Main St Hartford CT,WF123456789,245000.50,2850.75,6.25,2025-08-15,2025-07-08
Chase Bank,456 Oak Ave Tampa FL,CH987654321,189500.00,1950.25,5.75,2025-08-01,2025-07-08`;

const sampleTextData = `
WELLS FARGO MORTGAGE STATEMENT
Account Number: WF123456789
Property Address: 123 Main St, Hartford, CT 06106

Current Balance: $245,000.50
Monthly Payment: $2,850.75
Interest Rate: 6.25%
Next Payment Due: August 15, 2025
Statement Date: July 8, 2025
`;

console.log('Sample CSV Data:');
console.log(sampleCSVData);
console.log('\nSample Text Data:');
console.log(sampleTextData);