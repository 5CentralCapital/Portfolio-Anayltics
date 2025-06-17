const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class DuplicateFixer {
    constructor() {
        this.dbPath = path.join(__dirname, '../data/analytics.db');
    }

    async fixAllDuplicates() {
        console.log('🔧 Starting duplicate resolution process...\n');
        
        const db = new sqlite3.Database(this.dbPath);
        
        try {
            await this.fixUserDuplicates(db);
            await this.fixMetricDuplicates(db);
            await this.fixPropertyDuplicates(db);
            await this.fixLeadDuplicates(db);
            await this.cleanupExpiredSessions(db);
            
            console.log('\n✅ All duplicates have been resolved!');
            
        } catch (error) {
            console.error('Error fixing duplicates:', error);
        } finally {
            db.close();
        }
    }

    async fixUserDuplicates(db) {
        console.log('👥 Fixing user duplicates...');
        
        return new Promise((resolve, reject) => {
            // Find duplicate emails
            db.all(`
                SELECT email, COUNT(*) as count, GROUP_CONCAT(id) as ids
                FROM users 
                GROUP BY email 
                HAVING COUNT(*) > 1
            `, (err, duplicates) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                if (duplicates.length === 0) {
                    console.log('✅ No user duplicates found');
                    resolve();
                    return;
                }
                
                let processed = 0;
                duplicates.forEach(dup => {
                    const ids = dup.ids.split(',');
                    const keepId = ids[0]; // Keep the first one
                    const removeIds = ids.slice(1);
                    
                    // Update related records to point to the kept user
                    removeIds.forEach(removeId => {
                        db.run(`UPDATE sessions SET user_id = ? WHERE user_id = ?`, [keepId, removeId]);
                        db.run(`UPDATE audit_log SET user_id = ? WHERE user_id = ?`, [keepId, removeId]);
                        db.run(`DELETE FROM users WHERE id = ?`, [removeId], (err) => {
                            if (err) console.error('Error removing duplicate user:', err);
                        });
                    });
                    
                    processed++;
                    if (processed === duplicates.length) {
                        console.log(`✅ Fixed ${duplicates.length} user duplicate(s)`);
                        resolve();
                    }
                });
            });
        });
    }

    async fixMetricDuplicates(db) {
        console.log('📊 Fixing metric duplicates...');
        
        return new Promise((resolve, reject) => {
            db.all(`
                SELECT metric_date, COUNT(*) as count, GROUP_CONCAT(id) as ids
                FROM company_metrics 
                GROUP BY metric_date 
                HAVING COUNT(*) > 1
            `, (err, duplicates) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                if (duplicates.length === 0) {
                    console.log('✅ No metric duplicates found');
                    resolve();
                    return;
                }
                
                let processed = 0;
                duplicates.forEach(dup => {
                    const ids = dup.ids.split(',');
                    const keepId = ids[0]; // Keep the first one
                    const removeIds = ids.slice(1);
                    
                    removeIds.forEach(removeId => {
                        db.run(`DELETE FROM company_metrics WHERE id = ?`, [removeId], (err) => {
                            if (err) console.error('Error removing duplicate metric:', err);
                        });
                    });
                    
                    processed++;
                    if (processed === duplicates.length) {
                        console.log(`✅ Fixed ${duplicates.length} metric duplicate(s)`);
                        resolve();
                    }
                });
            });
        });
    }

    async fixPropertyDuplicates(db) {
        console.log('🏠 Fixing property duplicates...');
        
        return new Promise((resolve, reject) => {
            db.all(`
                SELECT address, city, state, COUNT(*) as count, GROUP_CONCAT(id) as ids
                FROM properties 
                GROUP BY address, city, state 
                HAVING COUNT(*) > 1
            `, (err, duplicates) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                if (duplicates.length === 0) {
                    console.log('✅ No property duplicates found');
                    resolve();
                    return;
                }
                
                let processed = 0;
                duplicates.forEach(dup => {
                    const ids = dup.ids.split(',');
                    const keepId = ids[0]; // Keep the first one
                    const removeIds = ids.slice(1);
                    
                    removeIds.forEach(removeId => {
                        db.run(`DELETE FROM properties WHERE id = ?`, [removeId], (err) => {
                            if (err) console.error('Error removing duplicate property:', err);
                        });
                    });
                    
                    processed++;
                    if (processed === duplicates.length) {
                        console.log(`✅ Fixed ${duplicates.length} property duplicate(s)`);
                        resolve();
                    }
                });
            });
        });
    }

    async fixLeadDuplicates(db) {
        console.log('📧 Fixing lead duplicates...');
        
        return new Promise((resolve, reject) => {
            db.all(`
                SELECT email, COUNT(*) as count, GROUP_CONCAT(id) as ids, GROUP_CONCAT(created_at) as dates
                FROM investor_leads 
                GROUP BY email 
                HAVING COUNT(*) > 1
            `, (err, duplicates) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                if (duplicates.length === 0) {
                    console.log('✅ No lead duplicates found');
                    resolve();
                    return;
                }
                
                let processed = 0;
                duplicates.forEach(dup => {
                    const ids = dup.ids.split(',');
                    const dates = dup.dates.split(',');
                    
                    // Find the most recent entry
                    let mostRecentIndex = 0;
                    let mostRecentDate = new Date(dates[0]);
                    
                    dates.forEach((date, index) => {
                        const currentDate = new Date(date);
                        if (currentDate > mostRecentDate) {
                            mostRecentDate = currentDate;
                            mostRecentIndex = index;
                        }
                    });
                    
                    const keepId = ids[mostRecentIndex];
                    const removeIds = ids.filter((id, index) => index !== mostRecentIndex);
                    
                    removeIds.forEach(removeId => {
                        db.run(`DELETE FROM investor_leads WHERE id = ?`, [removeId], (err) => {
                            if (err) console.error('Error removing duplicate lead:', err);
                        });
                    });
                    
                    processed++;
                    if (processed === duplicates.length) {
                        console.log(`✅ Fixed ${duplicates.length} lead duplicate(s)`);
                        resolve();
                    }
                });
            });
        });
    }

    async cleanupExpiredSessions(db) {
        console.log('🧹 Cleaning up expired sessions...');
        
        return new Promise((resolve, reject) => {
            db.run(`DELETE FROM sessions WHERE expires_at < datetime('now')`, function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                
                console.log(`✅ Removed ${this.changes} expired session(s)`);
                resolve();
            });
        });
    }
}

// Run the fixer
if (require.main === module) {
    const fixer = new DuplicateFixer();
    fixer.fixAllDuplicates().catch(console.error);
}

module.exports = DuplicateFixer;