// Quick script to fix property dataset
const { Pool } = require('@neondatabase/serverless');
const ws = require("ws");

// Configure neon
const neonConfig = require('@neondatabase/serverless').neonConfig;
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fixPropertyDataset() {
  console.log('Starting property dataset fix...');
  
  try {
    // 1. Remove duplicate 123 Maple Street property (keep the one with deal data)
    console.log('Removing duplicate properties...');
    await pool.query(`
      DELETE FROM properties 
      WHERE address = '123 Maple Street' 
      AND deal_analyzer_data IS NULL
    `);
    
    // 2. Fix entity names to match current branding
    console.log('Updating entity names...');
    await pool.query(`
      UPDATE properties 
      SET entity = '5Central Capital', updated_at = NOW()
      WHERE entity = '5Central Capital LLC'
    `);
    
    // 3. Fix negative cash flows for rehabbing properties
    console.log('Fixing cash flow calculations...');
    await pool.query(`
      UPDATE properties 
      SET cash_flow = '0', updated_at = NOW()
      WHERE status = 'Rehabbing' AND cash_flow::numeric < 0
    `);
    
    // 4. Create property assumptions for all properties
    console.log('Creating property assumptions...');
    await pool.query(`
      INSERT INTO property_assumptions (
        property_id, unit_count, purchase_price, loan_percentage, 
        interest_rate, loan_term_years, vacancy_rate, expense_ratio,
        market_cap_rate, refinance_ltv, refinance_interest_rate,
        refinance_closing_cost_percent, dscr_threshold
      )
      SELECT 
        p.id,
        p.apartments,
        p.acquisition_price::text,
        '0.75',
        '0.07',
        30,
        '0.05',
        '0.45',
        '0.055',
        '0.75',
        '0.065',
        '0.02',
        '1.25'
      FROM properties p
      WHERE NOT EXISTS (
        SELECT 1 FROM property_assumptions pa WHERE pa.property_id = p.id
      )
    `);
    
    // 5. Create unit types for all properties
    console.log('Creating unit types...');
    await pool.query(`
      INSERT INTO property_unit_types (
        property_id, unit_type_id, name, bedrooms, bathrooms, 
        square_feet, market_rent
      )
      SELECT 
        p.id,
        'unit-1',
        CASE 
          WHEN p.apartments = 1 THEN 'Single Family'
          WHEN p.apartments > 4 THEN '2BR/1BA'
          ELSE '1BR/1BA'
        END,
        CASE WHEN p.apartments > 4 THEN 2 ELSE 1 END,
        1.0,
        CASE WHEN p.apartments > 4 THEN 900 ELSE 750 END,
        GREATEST(1000, (p.cash_flow::numeric / p.apartments / 12 * 1.25))::numeric
      FROM properties p
      WHERE NOT EXISTS (
        SELECT 1 FROM property_unit_types put WHERE put.property_id = p.id
      )
    `);
    
    // 6. Create rent roll entries
    console.log('Creating rent roll entries...');
    await pool.query(`
      INSERT INTO property_rent_roll (
        property_id, unit_type_id, unit_number, current_rent, 
        pro_forma_rent, is_vacant
      )
      SELECT 
        p.id,
        'unit-1',
        'Unit ' || generate_series(1, p.apartments),
        put.market_rent,
        put.market_rent,
        CASE WHEN p.status = 'Rehabbing' THEN true ELSE false END
      FROM properties p
      JOIN property_unit_types put ON put.property_id = p.id
      WHERE NOT EXISTS (
        SELECT 1 FROM property_rent_roll prr WHERE prr.property_id = p.id
      )
    `);
    
    // 7. Create standard operating expenses
    console.log('Creating operating expenses...');
    await pool.query(`
      INSERT INTO property_expenses (
        property_id, expense_type, expense_name, annual_amount
      )
      SELECT p.id, expense_type, expense_name, 
             (p.acquisition_price::numeric * expense_multiplier + p.apartments * per_unit_amount)::text
      FROM properties p
      CROSS JOIN (
        SELECT 'taxes' as expense_type, 'Property Taxes' as expense_name, 0.015 as expense_multiplier, 0 as per_unit_amount
        UNION ALL
        SELECT 'insurance', 'Property Insurance', 0.002, 0
        UNION ALL 
        SELECT 'maintenance', 'Repairs & Maintenance', 0, 2400
        UNION ALL
        SELECT 'utilities', 'Utilities', 0, 1200
        UNION ALL
        SELECT 'other', 'Other Operating Expenses', 0, 600
      ) expenses
      WHERE NOT EXISTS (
        SELECT 1 FROM property_expenses pe WHERE pe.property_id = p.id
      )
    `);
    
    // 8. Create exit analysis data
    console.log('Creating exit analysis data...');
    await pool.query(`
      INSERT INTO property_exit_analysis (
        property_id, hold_period_years, sale_factor, sale_costs_percent,
        annual_rent_growth, annual_expense_growth, exit_cap_rate
      )
      SELECT 
        p.id, '3.0', '0.055', '0.06', '0.03', '0.03', '0.055'
      FROM properties p
      WHERE NOT EXISTS (
        SELECT 1 FROM property_exit_analysis pea WHERE pea.property_id = p.id
      )
    `);
    
    console.log('Property dataset fix completed successfully!');
    
    // Get final counts
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_properties,
        COUNT(DISTINCT entity) as unique_entities,
        (SELECT COUNT(*) FROM property_assumptions) as properties_with_assumptions,
        (SELECT COUNT(DISTINCT property_id) FROM property_unit_types) as properties_with_units,
        (SELECT COUNT(DISTINCT property_id) FROM property_rent_roll) as properties_with_rent_roll
      FROM properties
    `);
    
    console.log('Final status:', result.rows[0]);
    
  } catch (error) {
    console.error('Error fixing property dataset:', error);
  } finally {
    await pool.end();
  }
}

fixPropertyDataset();