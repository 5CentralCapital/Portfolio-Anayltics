const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class DatabaseAuditor {
    constructor() {
        this.dbPath = path.join(__dirname, '../data/analytics.db');
        this.auditResults = {
            duplicates: [],
            inconsistencies: [],
            integrityIssues: [],
            recommendations: []
        };
    }

    async runFullAudit() {
        console.log('🔍 Starting comprehensive database audit...\n');
        
        if (!fs.existsSync(this.dbPath)) {
            console.log('❌ Database file not found. Creating new database...');
            return this.auditResults;
        }

        const db = new sqlite3.Database(this.dbPath);
        
        try {
            await this.checkTableStructure(db);
            await this.findDuplicateRecords(db);
            await this.validateDataIntegrity(db);
            await this.checkForeignKeyConstraints(db);
            await this.validateDataFormats(db);
            await this.checkDateRanges(db);
            await this.analyzeDataConsistency(db);
            
            this.generateRecommendations();
            this.printAuditReport();
            
        } catch (error) {
            console.error('Audit error:', error);
        } finally {
            db.close();
        }
        
        return this.auditResults;
    }

    async checkTableStructure(db) {
        console.log('📋 Checking table structure...');
        
        return new Promise((resolve, reject) => {
            db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                console.log(`Found ${tables.length} tables:`, tables.map(t => t.name).join(', '));
                
                const expectedTables = [
                    'users', 'sessions', 'company_metrics', 'properties', 
                    'investor_leads', 'audit_log', 'login_attempts'
                ];
                
                const missingTables = expectedTables.filter(
                    table => !tables.find(t => t.name === table)
                );
                
                if (missingTables.length > 0) {
                    this.auditResults.integrityIssues.push({
                        type: 'MISSING_TABLES',
                        description: `Missing required tables: ${missingTables.join(', ')}`,
                        severity: 'HIGH',
                        impact: 'System functionality may be compromised'
                    });
                }
                
                resolve();
            });
        });
    }

    async findDuplicateRecords(db) {
        console.log('🔍 Searching for duplicate records...');
        
        const duplicateQueries = [
            {
                table: 'users',
                query: `SELECT email, COUNT(*) as count FROM users GROUP BY email HAVING COUNT(*) > 1`,
                field: 'email'
            },
            {
                table: 'company_metrics',
                query: `SELECT metric_date, COUNT(*) as count FROM company_metrics GROUP BY metric_date HAVING COUNT(*) > 1`,
                field: 'metric_date'
            },
            {
                table: 'properties',
                query: `SELECT address, city, state, COUNT(*) as count FROM properties GROUP BY address, city, state HAVING COUNT(*) > 1`,
                field: 'address+city+state'
            },
            {
                table: 'investor_leads',
                query: `SELECT email, COUNT(*) as count FROM investor_leads GROUP BY email HAVING COUNT(*) > 1`,
                field: 'email'
            }
        ];

        for (const dupQuery of duplicateQueries) {
            await new Promise((resolve, reject) => {
                db.all(dupQuery.query, (err, rows) => {
                    if (err) {
                        console.log(`⚠️  Could not check duplicates in ${dupQuery.table}: ${err.message}`);
                        resolve();
                        return;
                    }
                    
                    if (rows.length > 0) {
                        rows.forEach(row => {
                            this.auditResults.duplicates.push({
                                table: dupQuery.table,
                                field: dupQuery.field,
                                value: dupQuery.field.includes('+') ? 
                                    `${row.address || ''} ${row.city || ''} ${row.state || ''}`.trim() : 
                                    row[dupQuery.field.split('+')[0]],
                                count: row.count,
                                severity: 'MEDIUM'
                            });
                        });
                        console.log(`❌ Found ${rows.length} duplicate(s) in ${dupQuery.table}`);
                    } else {
                        console.log(`✅ No duplicates found in ${dupQuery.table}`);
                    }
                    resolve();
                });
            });
        }
    }

    async validateDataIntegrity(db) {
        console.log('🔒 Validating data integrity...');
        
        const integrityChecks = [
            {
                name: 'User ID uniqueness',
                query: `SELECT id, COUNT(*) as count FROM users GROUP BY id HAVING COUNT(*) > 1`
            },
            {
                name: 'Property ID uniqueness',
                query: `SELECT id, COUNT(*) as count FROM properties GROUP BY id HAVING COUNT(*) > 1`
            },
            {
                name: 'Negative financial values',
                query: `SELECT id, revenue, expenses FROM company_metrics WHERE revenue < 0 OR expenses < 0`
            },
            {
                name: 'Invalid property prices',
                query: `SELECT id, address, acquisition_price, current_value FROM properties WHERE acquisition_price <= 0 OR current_value < 0`
            }
        ];

        for (const check of integrityChecks) {
            await new Promise((resolve) => {
                db.all(check.query, (err, rows) => {
                    if (err) {
                        console.log(`⚠️  Could not run integrity check '${check.name}': ${err.message}`);
                        resolve();
                        return;
                    }
                    
                    if (rows.length > 0) {
                        this.auditResults.integrityIssues.push({
                            type: 'DATA_INTEGRITY',
                            name: check.name,
                            description: `Found ${rows.length} records with integrity issues`,
                            records: rows.slice(0, 5), // Show first 5 examples
                            severity: 'HIGH'
                        });
                        console.log(`❌ ${check.name}: ${rows.length} issues found`);
                    } else {
                        console.log(`✅ ${check.name}: No issues found`);
                    }
                    resolve();
                });
            });
        }
    }

    async checkForeignKeyConstraints(db) {
        console.log('🔗 Checking foreign key relationships...');
        
        const fkChecks = [
            {
                name: 'Sessions without valid users',
                query: `SELECT s.id, s.user_id FROM sessions s LEFT JOIN users u ON s.user_id = u.id WHERE u.id IS NULL`
            },
            {
                name: 'Audit logs without valid users',
                query: `SELECT a.id, a.user_id FROM audit_log a LEFT JOIN users u ON a.user_id = u.id WHERE a.user_id IS NOT NULL AND u.id IS NULL`
            }
        ];

        for (const check of fkChecks) {
            await new Promise((resolve) => {
                db.all(check.query, (err, rows) => {
                    if (err) {
                        console.log(`⚠️  Could not check foreign keys '${check.name}': ${err.message}`);
                        resolve();
                        return;
                    }
                    
                    if (rows.length > 0) {
                        this.auditResults.integrityIssues.push({
                            type: 'FOREIGN_KEY_VIOLATION',
                            name: check.name,
                            description: `Found ${rows.length} orphaned records`,
                            records: rows.slice(0, 5),
                            severity: 'HIGH'
                        });
                        console.log(`❌ ${check.name}: ${rows.length} violations found`);
                    } else {
                        console.log(`✅ ${check.name}: No violations found`);
                    }
                    resolve();
                });
            });
        }
    }

    async validateDataFormats(db) {
        console.log('📝 Validating data formats...');
        
        const formatChecks = [
            {
                name: 'Invalid email formats',
                query: `SELECT id, email FROM users WHERE email NOT LIKE '%@%.%'`
            },
            {
                name: 'Invalid email formats in leads',
                query: `SELECT id, email FROM investor_leads WHERE email NOT LIKE '%@%.%'`
            },
            {
                name: 'Invalid phone formats',
                query: `SELECT id, phone FROM investor_leads WHERE phone IS NOT NULL AND LENGTH(phone) < 10`
            }
        ];

        for (const check of formatChecks) {
            await new Promise((resolve) => {
                db.all(check.query, (err, rows) => {
                    if (err) {
                        console.log(`⚠️  Could not check format '${check.name}': ${err.message}`);
                        resolve();
                        return;
                    }
                    
                    if (rows.length > 0) {
                        this.auditResults.inconsistencies.push({
                            type: 'FORMAT_ERROR',
                            name: check.name,
                            description: `Found ${rows.length} records with format issues`,
                            records: rows.slice(0, 5),
                            severity: 'MEDIUM'
                        });
                        console.log(`❌ ${check.name}: ${rows.length} format issues found`);
                    } else {
                        console.log(`✅ ${check.name}: No format issues found`);
                    }
                    resolve();
                });
            });
        }
    }

    async checkDateRanges(db) {
        console.log('📅 Checking date ranges...');
        
        const dateChecks = [
            {
                name: 'Future metric dates',
                query: `SELECT id, metric_date FROM company_metrics WHERE metric_date > date('now')`
            },
            {
                name: 'Invalid acquisition dates',
                query: `SELECT id, address, acquisition_date FROM properties WHERE acquisition_date > date('now') OR acquisition_date < '2000-01-01'`
            },
            {
                name: 'Expired sessions',
                query: `SELECT id, expires_at FROM sessions WHERE expires_at < datetime('now')`
            }
        ];

        for (const check of dateChecks) {
            await new Promise((resolve) => {
                db.all(check.query, (err, rows) => {
                    if (err) {
                        console.log(`⚠️  Could not check dates '${check.name}': ${err.message}`);
                        resolve();
                        return;
                    }
                    
                    if (rows.length > 0) {
                        this.auditResults.inconsistencies.push({
                            type: 'DATE_RANGE_ERROR',
                            name: check.name,
                            description: `Found ${rows.length} records with date issues`,
                            records: rows.slice(0, 5),
                            severity: check.name.includes('Expired') ? 'LOW' : 'MEDIUM'
                        });
                        console.log(`❌ ${check.name}: ${rows.length} date issues found`);
                    } else {
                        console.log(`✅ ${check.name}: No date issues found`);
                    }
                    resolve();
                });
            });
        }
    }

    async analyzeDataConsistency(db) {
        console.log('🔄 Analyzing data consistency...');
        
        const consistencyChecks = [
            {
                name: 'Property value consistency',
                query: `SELECT id, address, acquisition_price, current_value FROM properties WHERE current_value < acquisition_price * 0.5`
            },
            {
                name: 'Profit margin calculation',
                query: `SELECT id, revenue, expenses, profit_margin FROM company_metrics WHERE ABS(profit_margin - ((revenue - expenses) / revenue * 100)) > 1`
            }
        ];

        for (const check of consistencyChecks) {
            await new Promise((resolve) => {
                db.all(check.query, (err, rows) => {
                    if (err) {
                        console.log(`⚠️  Could not check consistency '${check.name}': ${err.message}`);
                        resolve();
                        return;
                    }
                    
                    if (rows.length > 0) {
                        this.auditResults.inconsistencies.push({
                            type: 'DATA_CONSISTENCY',
                            name: check.name,
                            description: `Found ${rows.length} records with consistency issues`,
                            records: rows.slice(0, 5),
                            severity: 'MEDIUM'
                        });
                        console.log(`❌ ${check.name}: ${rows.length} consistency issues found`);
                    } else {
                        console.log(`✅ ${check.name}: No consistency issues found`);
                    }
                    resolve();
                });
            });
        }
    }

    generateRecommendations() {
        console.log('\n💡 Generating recommendations...');
        
        // Recommendations for duplicates
        if (this.auditResults.duplicates.length > 0) {
            this.auditResults.recommendations.push({
                priority: 'HIGH',
                category: 'DUPLICATES',
                action: 'Remove duplicate records',
                description: 'Merge or remove duplicate entries while preserving the most recent/complete data',
                impact: 'Improved data quality and reduced storage usage'
            });
        }

        // Recommendations for integrity issues
        if (this.auditResults.integrityIssues.length > 0) {
            this.auditResults.recommendations.push({
                priority: 'CRITICAL',
                category: 'INTEGRITY',
                action: 'Fix data integrity violations',
                description: 'Correct primary key violations, foreign key constraints, and missing tables',
                impact: 'Ensures database stability and prevents data corruption'
            });
        }

        // Recommendations for inconsistencies
        if (this.auditResults.inconsistencies.length > 0) {
            this.auditResults.recommendations.push({
                priority: 'MEDIUM',
                category: 'CONSISTENCY',
                action: 'Standardize data formats and validate calculations',
                description: 'Fix format errors, date ranges, and calculation inconsistencies',
                impact: 'Improved data reliability and reporting accuracy'
            });
        }

        // General recommendations
        this.auditResults.recommendations.push({
            priority: 'LOW',
            category: 'MAINTENANCE',
            action: 'Implement regular data validation',
            description: 'Set up automated checks and constraints to prevent future issues',
            impact: 'Proactive data quality management'
        });
    }

    printAuditReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 DATABASE AUDIT REPORT');
        console.log('='.repeat(60));
        
        console.log(`\n📈 SUMMARY:`);
        console.log(`• Duplicates found: ${this.auditResults.duplicates.length}`);
        console.log(`• Integrity issues: ${this.auditResults.integrityIssues.length}`);
        console.log(`• Inconsistencies: ${this.auditResults.inconsistencies.length}`);
        console.log(`• Recommendations: ${this.auditResults.recommendations.length}`);

        if (this.auditResults.duplicates.length > 0) {
            console.log(`\n🔍 DUPLICATES FOUND:`);
            this.auditResults.duplicates.forEach((dup, index) => {
                console.log(`${index + 1}. Table: ${dup.table}, Field: ${dup.field}, Count: ${dup.count}`);
            });
        }

        if (this.auditResults.integrityIssues.length > 0) {
            console.log(`\n⚠️  INTEGRITY ISSUES:`);
            this.auditResults.integrityIssues.forEach((issue, index) => {
                console.log(`${index + 1}. ${issue.name || issue.type}: ${issue.description} (${issue.severity})`);
            });
        }

        if (this.auditResults.inconsistencies.length > 0) {
            console.log(`\n📝 INCONSISTENCIES:`);
            this.auditResults.inconsistencies.forEach((issue, index) => {
                console.log(`${index + 1}. ${issue.name}: ${issue.description} (${issue.severity})`);
            });
        }

        console.log(`\n💡 RECOMMENDATIONS:`);
        this.auditResults.recommendations.forEach((rec, index) => {
            console.log(`${index + 1}. [${rec.priority}] ${rec.action}`);
            console.log(`   ${rec.description}`);
            console.log(`   Impact: ${rec.impact}\n`);
        });

        console.log('='.repeat(60));
        console.log('✅ Audit completed successfully!');
        console.log('='.repeat(60));
    }
}

// Run the audit
if (require.main === module) {
    const auditor = new DatabaseAuditor();
    auditor.runFullAudit().catch(console.error);
}

module.exports = DatabaseAuditor;