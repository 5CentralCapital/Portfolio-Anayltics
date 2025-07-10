-- Add management_fee column to property_assumptions table
ALTER TABLE property_assumptions 
ADD COLUMN IF NOT EXISTS management_fee DECIMAL(5, 4) DEFAULT 0.08;

-- Update existing records with default 8% management fee
UPDATE property_assumptions 
SET management_fee = 0.08 
WHERE management_fee IS NULL;

-- Add comment to explain the column
COMMENT ON COLUMN property_assumptions.management_fee IS 'Property management fee as a decimal (0.08 = 8%)';