const fs = require('fs');

// Read the test file
const text = fs.readFileSync('test_pdf_content.txt', 'utf8');

console.log('Original text:');
console.log(text);
console.log('---');

// Test balance patterns
const balancePatterns = [
  /current\s+balance[:\s]*\$?([\d,]+\.?\d*)/i,
  /outstanding\s+balance[:\s]*\$?([\d,]+\.?\d*)/i,
  /principal\s+balance[:\s]*\$?([\d,]+\.?\d*)/i,
  /loan\s+balance[:\s]*\$?([\d,]+\.?\d*)/i,
  /balance[:\s]*\$?([\d,]+\.?\d*)/i
];

for (let i = 0; i < balancePatterns.length; i++) {
  const pattern = balancePatterns[i];
  const match = text.match(pattern);
  if (match) {
    console.log(`Pattern ${i}: ${pattern} matched:`, match[1]);
    const cleanValue = match[1].replace(/[$,]/g, '');
    const parsed = parseFloat(cleanValue);
    console.log(`  Cleaned: "${cleanValue}" -> Parsed: ${parsed}`);
    if (parsed >= 1000) {
      console.log(`  Would use this value: ${parsed}`);
      break;
    }
  } else {
    console.log(`Pattern ${i}: ${pattern} - NO MATCH`);
  }
}