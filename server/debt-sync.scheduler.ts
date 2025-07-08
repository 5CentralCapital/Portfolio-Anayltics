/**
 * Debt Synchronization Scheduler
 * Handles automated syncing of debt data from lenders
 */

import { lenderIntegrationService } from './lender-integration.service';

export class DebtSyncScheduler {
  private syncInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Start automated debt synchronization
   */
  start(intervalHours: number = 24) {
    if (this.isRunning) {
      console.log('Debt sync scheduler is already running');
      return;
    }

    this.isRunning = true;
    console.log(`Starting debt sync scheduler with ${intervalHours} hour intervals`);

    // Run initial sync
    this.performSync();

    // Schedule recurring syncs
    this.syncInterval = setInterval(() => {
      this.performSync();
    }, intervalHours * 60 * 60 * 1000); // Convert hours to milliseconds
  }

  /**
   * Stop automated debt synchronization
   */
  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isRunning = false;
    console.log('Debt sync scheduler stopped');
  }

  /**
   * Perform manual sync
   */
  async performSync(): Promise<void> {
    console.log('Starting debt data synchronization...');
    
    try {
      const result = await lenderIntegrationService.syncAllLenders();
      
      if (result.success) {
        console.log('Debt sync completed successfully');
      } else {
        console.error('Debt sync completed with errors:', result.errors);
      }
      
      // Log results for each lender
      for (const [lenderName, response] of result.results) {
        if (response.success) {
          console.log(`✓ ${lenderName}: ${response.data?.length || 0} loans updated`);
        } else {
          console.error(`✗ ${lenderName}: ${response.error}`);
        }
      }
    } catch (error) {
      console.error('Debt sync failed:', error);
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      hasInterval: this.syncInterval !== null
    };
  }
}

export const debtSyncScheduler = new DebtSyncScheduler();