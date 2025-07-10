-- Add migration tracking column to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS deal_analyzer_data_migrated BOOLEAN DEFAULT FALSE;

-- Add comment explaining the column
COMMENT ON COLUMN properties.deal_analyzer_data_migrated IS 'Tracks whether dealAnalyzerData has been migrated to normalized tables';

-- Create index for finding non-migrated properties
CREATE INDEX IF NOT EXISTS idx_properties_migration_status 
ON properties(deal_analyzer_data_migrated) 
WHERE deal_analyzer_data_migrated = FALSE;