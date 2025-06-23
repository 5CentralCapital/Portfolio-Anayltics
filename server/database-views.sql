-- Database views for dynamic property calculations

-- View for property financial metrics (calculated on-demand)
CREATE OR REPLACE VIEW property_metrics AS
SELECT 
    p.id,
    p.address,
    p.entity,
    p.status,
    
    -- Calculated gross rental income
    COALESCE((
        SELECT SUM(
            CASE 
                WHEN rr.is_vacant = false THEN COALESCE(rr.current_rent::numeric, rr.pro_forma_rent::numeric)
                ELSE rr.pro_forma_rent::numeric
            END * 12
        )
        FROM property_rent_roll rr 
        WHERE rr.property_id = p.id
    ), 0) AS gross_rental_income,
    
    -- Calculated total annual expenses
    COALESCE((
        SELECT SUM(
            CASE 
                WHEN pe.is_percentage = true THEN 
                    (SELECT gross_rental_income) * (pe.percentage_base::numeric / 100)
                ELSE 
                    pe.annual_amount::numeric
            END
        )
        FROM property_expenses pe 
        WHERE pe.property_id = p.id
    ), 0) AS total_expenses,
    
    -- Calculated NOI
    (gross_rental_income - total_expenses) AS net_operating_income,
    
    -- Calculated total rehab cost
    COALESCE((
        SELECT SUM(rb.total_cost::numeric)
        FROM property_rehab_budget rb 
        WHERE rb.property_id = p.id
    ), 0) AS total_rehab_cost,
    
    -- Extract purchase price from deal analyzer data
    COALESCE((p.deal_analyzer_data::json->'assumptions'->>'purchasePrice')::numeric, 0) AS purchase_price,
    
    -- Calculated all-in cost
    (purchase_price + total_rehab_cost) AS all_in_cost,
    
    -- Calculated cap rate
    CASE 
        WHEN purchase_price > 0 THEN net_operating_income / purchase_price
        ELSE 0
    END AS cap_rate,
    
    -- Calculated ARV based on NOI and market cap rate
    CASE 
        WHEN COALESCE((p.deal_analyzer_data::json->'assumptions'->>'marketCapRate')::numeric, 0.055) > 0 
             AND net_operating_income > 0
        THEN net_operating_income / COALESCE((p.deal_analyzer_data::json->'assumptions'->>'marketCapRate')::numeric, 0.055)
        ELSE purchase_price
    END AS arv,
    
    -- Extract capital required from deal analyzer
    COALESCE((p.deal_analyzer_data::json->'investmentSummary'->>'capitalRequired')::numeric, 0) AS capital_required,
    
    -- Calculated equity multiple
    CASE 
        WHEN capital_required > 0 THEN (arv - all_in_cost) / capital_required
        ELSE 0
    END AS equity_multiple

FROM properties p;

-- View for portfolio-level metrics by entity
CREATE OR REPLACE VIEW entity_portfolio_metrics AS
SELECT 
    pm.entity,
    COUNT(*) as total_properties,
    SUM(pm.gross_rental_income) as total_gross_income,
    SUM(pm.total_expenses) as total_expenses,
    SUM(pm.net_operating_income) as total_noi,
    SUM(pm.arv) as total_arv,
    SUM(pm.capital_required) as total_capital_invested,
    AVG(pm.cap_rate) as average_cap_rate,
    SUM(pm.equity_multiple * pm.capital_required) / NULLIF(SUM(pm.capital_required), 0) as weighted_equity_multiple

FROM property_metrics pm
WHERE pm.entity IS NOT NULL
GROUP BY pm.entity;

-- View for user-specific portfolio metrics (filtered by entity ownership)
CREATE OR REPLACE VIEW user_portfolio_metrics AS
SELECT 
    em.user_id,
    em.entity_name,
    em.equity_percentage,
    pm.*,
    
    -- User's proportional share
    (pm.total_gross_income * em.equity_percentage / 100) as user_gross_income,
    (pm.total_noi * em.equity_percentage / 100) as user_noi,
    (pm.total_arv * em.equity_percentage / 100) as user_arv_share

FROM entity_portfolio_metrics pm
JOIN entity_memberships em ON pm.entity = em.entity_name;

-- View for property status pipeline metrics
CREATE OR REPLACE VIEW property_pipeline_metrics AS
SELECT 
    pm.status,
    COUNT(*) as property_count,
    SUM(pm.purchase_price) as total_purchase_price,
    SUM(pm.total_rehab_cost) as total_rehab_budget,
    SUM(pm.arv) as total_arv,
    SUM(pm.capital_required) as total_capital_required,
    AVG(pm.equity_multiple) as average_equity_multiple

FROM property_metrics pm
GROUP BY pm.status;

-- View for individual property performance with ratios
CREATE OR REPLACE VIEW property_performance AS
SELECT 
    pm.*,
    
    -- Performance ratios
    CASE 
        WHEN pm.purchase_price > 0 THEN pm.gross_rental_income / pm.purchase_price 
        ELSE 0 
    END as rent_to_price_ratio,
    
    CASE 
        WHEN pm.gross_rental_income > 0 THEN pm.total_expenses / pm.gross_rental_income 
        ELSE 0 
    END as expense_ratio,
    
    -- Cash flow (simplified - assumes no debt service for base calculation)
    pm.net_operating_income as cash_flow_before_debt,
    
    -- Price per unit
    CASE 
        WHEN p.apartments > 0 THEN pm.purchase_price / p.apartments
        ELSE pm.purchase_price
    END as price_per_unit

FROM property_metrics pm
JOIN properties p ON pm.id = p.id;