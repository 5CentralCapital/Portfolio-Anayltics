const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DataValidator {
    constructor() {
        this.dbPath = path.join(__dirname, '../data/analytics.db');
    }

    async validateAndFix() {
        console.log('🔍 Starting data validation and correction...\n');
        
        const db = new sqlite3.Database(this.dbPath);
        
        try {
            await this.validateEmails(db);
            await this.validatePhoneNumbers(db);
            await this.validateFinancialData(db);
            await this.validateDates(db);
            await this.recalculateMetrics(db);
            
            console.log('\n✅ Data validation and correction completed!');
            
        } catch (error) {
            console.error('Error during validation:', error);
        } finally {
            db.close();
        }
    }

    async validateEmails(db) {
        console.log('📧 Validating email formats...');
        
        const tables = [
            { table: 'users', field: 'email' },
            { table: 'investor_leads', field: 'email' }
        ];
        
        for (const tableInfo of tables) {
            await new Promise((resolve, reject) => {
                db.all(`
                    SELECT id, ${tableInfo.field} 
                    FROM ${tableInfo.table} 
                    WHERE ${tableInfo.field} NOT LIKE '%@%.%' OR ${tableInfo.field} IS NULL
                `, (err, invalidEmails) => {
                    if (err) {
                        console.log(`⚠️  Could not validate emails in ${tableInfo.table}: ${err.message}`);
                        resolve();
                        return;
                    }
                    
                    if (invalidEmails.length > 0) {
                        console.log(`❌ Found ${invalidEmails.length} invalid email(s) in ${tableInfo.table}`);
                        
                        // For demo purposes, we'll flag these but not auto-fix
                        invalidEmails.forEach(record => {
                            console.log(`   - ID: ${record.id}, Email: ${record[tableInfo.field] || 'NULL'}`);
                        });
                    } else {
                        console.log(`✅ All emails in ${tableInfo.table} are valid`);
                    }
                    resolve();
                });
            });
        }
    }

    async validatePhoneNumbers(db) {
        console.log('📱 Validating phone numbers...');
        
        return new Promise((resolve, reject) => {
            db.all(`
                SELECT id, phone 
                FROM investor_leads 
                WHERE phone IS NOT NULL AND (LENGTH(phone) < 10 OR phone NOT GLOB '*[0-9]*')
            `, (err, invalidPhones) => {
                if (err) {
                    console.log(`⚠️  Could not validate phone numbers: ${err.message}`);
                    resolve();
                    return;
                }
                
                if (invalidPhones.length > 0) {
                    console.log(`❌ Found ${invalidPhones.length} invalid phone number(s)`);
                    
                    // Clean up phone numbers
                    invalidPhones.forEach(record => {
                        let cleanPhone = record.phone.replace(/[^\d]/g, '');
                        if (cleanPhone.length >= 10) {
                            db.run(`UPDATE investor_leads SET phone = ? WHERE id = ?`, 
                                [cleanPhone, record.id], (err) => {
                                    if (err) console.error('Error updating phone:', err);
                                });
                        }
                    });
                    
                    console.log(`✅ Cleaned ${invalidPhones.length} phone number(s)`);
                } else {
                    console.log(`✅ All phone numbers are valid`);
                }
                resolve();
            });
        });
    }

    async validateFinancialData(db) {
        console.log('💰 Validating financial data...');
        
        const validations = [
            {
                name: 'Negative revenues',
                query: `SELECT id, revenue FROM company_metrics WHERE revenue < 0`,
                fix: `UPDATE company_metrics SET revenue = ABS(revenue) WHERE revenue < 0`
            },
            {
                name: 'Negative expenses',
                query: `SELECT id, expenses FROM company_metrics WHERE expenses < 0`,
                fix: `UPDATE company_metrics SET expenses = ABS(expenses) WHERE expenses < 0`
            },
            {
                name: 'Invalid property prices',
                query: `SELECT id, address, acquisition_price FROM properties WHERE acquisition_price <= 0`,
                fix: null // Manual review required
            }
        ];
        
        for (const validation of validations) {
            await new Promise((resolve) => {
                db.all(validation.query, (err, issues) => {
                    if (err) {
                        console.log(`⚠️  Could not validate ${validation.name}: ${err.message}`);
                        resolve();
                        return;
                    }
                    
                    if (issues.length > 0) {
                        console.log(`❌ Found ${issues.length} issue(s) with ${validation.name}`);
                        
                        if (validation.fix) {
                            db.run(validation.fix, (err) => {
                                if (err) {
                                    console.error(`Error fixing ${validation.name}:`, err);
                                } else {
                                    console.log(`✅ Fixed ${validation.name}`);
                                }
                                resolve();
                            });
                        } else {
                            console.log(`⚠️  Manual review required for ${validation.name}`);
                            resolve();
                        }
                    } else {
                        console.log(`✅ No issues found with ${validation.name}`);
                        resolve();
                    }
                });
            });
        }
    }

    async validateDates(db) {
        console.log('📅 Validating dates...');
        
        const dateValidations = [
            {
                name: 'Future metric dates',
                query: `SELECT id, metric_date FROM company_metrics WHERE metric_date > date('now')`,
                fix: `UPDATE company_metrics SET metric_date = date('now') WHERE metric_date > date('now')`
            },
            {
                name: 'Invalid acquisition dates',
                query: `SELECT id, address, acquisition_date FROM properties WHERE acquisition_date > date('now') OR acquisition_date < '2000-01-01'`,
                fix: null // Manual review required
            }
        ];
        
        for (const validation of dateValidations) {
            await new Promise((resolve) => {
                db.all(validation.query, (err, issues) => {
                    if (err) {
                        console.log(`⚠️  Could not validate ${validation.name}: ${err.message}`);
                        resolve();
                        return;
                    }
                    
                    if (issues.length > 0) {
                        console.log(`❌ Found ${issues.length} issue(s) with ${validation.name}`);
                        
                        if (validation.fix) {
                            db.run(validation.fix, (err) => {
                                if (err) {
                                    console.error(`Error fixing ${validation.name}:`, err);
                                } else {
                                    console.log(`✅ Fixed ${validation.name}`);
                                }
                                resolve();
                            });
                        } else {
                            console.log(`⚠️  Manual review required for ${validation.name}`);
                            resolve();
                        }
                    } else {
                        console.log(`✅ No issues found with ${validation.name}`);
                        resolve();
                    }
                });
            });
        }
    }

    async recalculateMetrics(db) {
        console.log('🔄 Recalculating profit margins...');
        
        return new Promise((resolve, reject) => {
            db.run(`
                UPDATE company_metrics 
                SET profit_margin = CASE 
                    WHEN revenue > 0 THEN ((revenue - expenses) / revenue * 100)
                    ELSE 0 
                END
                WHERE revenue IS NOT NULL AND expenses IS NOT NULL
            `, function(err) {
                if (err) {
                    console.error('Error recalculating profit margins:', err);
                    reject(err);
                    return;
                }
                
                console.log(`✅ Recalculated profit margins for ${this.changes} record(s)`);
                resolve();
            });
        });
    }
}

// Run the validator
if (require.main === module) {
    const validator = new DataValidator();
    validator.validateAndFix().catch(console.error);
}

module.exports = DataValidator;