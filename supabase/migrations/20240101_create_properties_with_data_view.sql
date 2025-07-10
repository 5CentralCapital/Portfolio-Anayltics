-- Create an optimized view for fetching properties with all related data
CREATE OR REPLACE VIEW properties_with_data AS
SELECT 
  p.*,
  COALESCE(
    json_agg(DISTINCT jsonb_build_object(
      'id', rr.id,
      'unitTypeId', rr.unit_type_id,
      'unitNumber', rr.unit_number,
      'currentRent', rr.current_rent,
      'proFormaRent', rr.pro_forma_rent,
      'isVacant', rr.is_vacant,
      'leaseStart', rr.lease_start,
      'leaseEnd', rr.lease_end,
      'leaseEndDate', rr.lease_end_date,
      'tenantName', rr.tenant_name,
      'createdAt', rr.created_at,
      'updatedAt', rr.updated_at
    )) FILTER (WHERE rr.id IS NOT NULL), 
    '[]'::json
  ) as rent_roll_data,
  COALESCE(
    json_agg(DISTINCT jsonb_build_object(
      'id', ut.id,
      'unitTypeId', ut.unit_type_id,
      'name', ut.name,
      'bedrooms', ut.bedrooms,
      'bathrooms', ut.bathrooms,
      'squareFeet', ut.square_feet,
      'marketRent', ut.market_rent,
      'createdAt', ut.created_at,
      'updatedAt', ut.updated_at
    )) FILTER (WHERE ut.id IS NOT NULL),
    '[]'::json
  ) as unit_types_data,
  COALESCE(
    json_agg(DISTINCT jsonb_build_object(
      'id', pl.id,
      'loanName', pl.loan_name,
      'loanType', pl.loan_type,
      'originalAmount', pl.original_amount,
      'currentBalance', pl.current_balance,
      'interestRate', pl.interest_rate,
      'termYears', pl.term_years,
      'monthlyPayment', pl.monthly_payment,
      'paymentType', pl.payment_type,
      'maturityDate', pl.maturity_date,
      'isActive', pl.is_active,
      'lender', pl.lender,
      'principalBalance', pl.principal_balance,
      'remainingTerm', pl.remaining_term,
      'createdAt', pl.created_at,
      'updatedAt', pl.updated_at
    )) FILTER (WHERE pl.id IS NOT NULL),
    '[]'::json
  ) as loans_data,
  COALESCE(
    (SELECT row_to_json(pa.*) 
     FROM property_assumptions pa 
     WHERE pa.property_id = p.id 
     LIMIT 1),
    null
  ) as assumptions_data,
  COALESCE(
    json_agg(DISTINCT jsonb_build_object(
      'id', pe.id,
      'expenseType', pe.expense_type,
      'expenseName', pe.expense_name,
      'annualAmount', pe.annual_amount,
      'isPercentage', pe.is_percentage,
      'percentageBase', pe.percentage_base,
      'notes', pe.notes,
      'createdAt', pe.created_at,
      'updatedAt', pe.updated_at
    )) FILTER (WHERE pe.id IS NOT NULL),
    '[]'::json
  ) as expenses_data
FROM properties p
LEFT JOIN property_rent_roll rr ON rr.property_id = p.id
LEFT JOIN property_unit_types ut ON ut.property_id = p.id
LEFT JOIN property_loans pl ON pl.property_id = p.id
LEFT JOIN property_expenses pe ON pe.property_id = p.id
GROUP BY p.id;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_entity_memberships_user_entity 
ON entity_memberships(user_id, entity_name);

CREATE INDEX IF NOT EXISTS idx_properties_entity 
ON properties(entity);

CREATE INDEX IF NOT EXISTS idx_property_rent_roll_property 
ON property_rent_roll(property_id);

CREATE INDEX IF NOT EXISTS idx_property_unit_types_property 
ON property_unit_types(property_id);

CREATE INDEX IF NOT EXISTS idx_property_loans_property_active 
ON property_loans(property_id, is_active);

CREATE UNIQUE INDEX IF NOT EXISTS idx_property_assumptions_property 
ON property_assumptions(property_id);

CREATE INDEX IF NOT EXISTS idx_property_expenses_property 
ON property_expenses(property_id);

-- Add comment explaining the view
COMMENT ON VIEW properties_with_data IS 'Optimized view that joins properties with all related data using JSON aggregation to reduce N+1 queries';