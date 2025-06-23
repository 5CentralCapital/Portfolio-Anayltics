-- Database triggers for automatic calculation updates

-- Function to recalculate property metrics
CREATE OR REPLACE FUNCTION recalculate_property_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update gross rental income when rent roll changes
    UPDATE properties 
    SET gross_rental_income = (
        SELECT COALESCE(SUM(
            CASE 
                WHEN pr.is_occupied THEN pr.current_rent * 12
                ELSE pr.market_rent * 12
            END
        ), 0)
        FROM property_rent_roll pr 
        WHERE pr.property_id = NEW.property_id
    ),
    updated_at = NOW()
    WHERE id = NEW.property_id;
    
    -- Update NOI when expenses change
    UPDATE properties 
    SET net_operating_income = GREATEST(0, 
        COALESCE(gross_rental_income, 0) - (
            SELECT COALESCE(SUM(
                CASE 
                    WHEN pe.is_percent_of_rent THEN 
                        COALESCE(gross_rental_income, 0) * COALESCE(pe.percentage, 0)
                    ELSE 
                        COALESCE(pe.monthly_amount, 0) * 12
                END
            ), 0)
            FROM property_expenses pe 
            WHERE pe.property_id = NEW.property_id
        )
    ),
    updated_at = NOW()
    WHERE id = NEW.property_id;
    
    -- Update ARV based on NOI and market cap rate
    UPDATE properties 
    SET arv = CASE 
        WHEN COALESCE(market_cap_rate, 0) > 0 AND COALESCE(net_operating_income, 0) > 0 
        THEN net_operating_income / market_cap_rate
        ELSE purchase_price
    END,
    updated_at = NOW()
    WHERE id = NEW.property_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for rent roll changes
DROP TRIGGER IF EXISTS trigger_rent_roll_update ON property_rent_roll;
CREATE TRIGGER trigger_rent_roll_update
    AFTER INSERT OR UPDATE OR DELETE ON property_rent_roll
    FOR EACH ROW
    EXECUTE FUNCTION recalculate_property_metrics();

-- Trigger for expense changes  
DROP TRIGGER IF EXISTS trigger_expenses_update ON property_expenses;
CREATE TRIGGER trigger_expenses_update
    AFTER INSERT OR UPDATE OR DELETE ON property_expenses
    FOR EACH ROW
    EXECUTE FUNCTION recalculate_property_metrics();

-- Trigger for rehab budget changes
DROP TRIGGER IF EXISTS trigger_rehab_update ON property_rehab_budget;
CREATE TRIGGER trigger_rehab_update
    AFTER INSERT OR UPDATE OR DELETE ON property_rehab_budget
    FOR EACH ROW
    EXECUTE FUNCTION recalculate_property_metrics();

-- Function to update portfolio metrics when individual properties change
CREATE OR REPLACE FUNCTION update_portfolio_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update entity-level aggregations
    -- This would update summary tables or cached values
    -- for portfolio-level KPIs
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for property metric changes
DROP TRIGGER IF EXISTS trigger_portfolio_update ON properties;
CREATE TRIGGER trigger_portfolio_update
    AFTER UPDATE OF gross_rental_income, net_operating_income, arv ON properties
    FOR EACH ROW
    EXECUTE FUNCTION update_portfolio_metrics();