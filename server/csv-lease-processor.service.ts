/**
 * CSV Lease Processor Service
 * Handles direct processing of lease data from CSV files
 */

import * as XLSX from 'xlsx';
import { promises as fs } from 'fs';
import { db } from './db';
import { properties, propertyRentRoll } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

export interface CSVLeaseData {
  tenantName: string;
  phone?: string;
  email?: string;
  address: string;
  unitNumber: string;
  leaseFrom: string;
  leaseTo: string;
  monthlyRent: number;
  securityDeposit?: number;
  petPolicy?: string;
  utilities?: string;
  parking?: string;
}

export interface LeaseProcessingResult {
  success: boolean;
  processedCount: number;
  errors: string[];
  warnings: string[];
  leaseData: CSVLeaseData[];
  propertyMatches: { [key: string]: number };
}

class CSVLeaseProcessorService {

  /**
   * Process CSV lease file and extract structured data
   */
  async processLeaseCSV(filePath: string, fileName: string): Promise<LeaseProcessingResult> {
    try {
      console.log(`Processing CSV lease file: ${fileName}`);
      
      const csvData = await this.parseCSVFile(filePath);
      console.log('Raw CSV data:', csvData);
      
      const leaseData = this.mapCSVToLeaseData(csvData);
      console.log('Mapped lease data:', leaseData);
      
      const propertyMatches = await this.matchPropertiesToLeases(leaseData);
      console.log('Property matches:', propertyMatches);
      
      const result: LeaseProcessingResult = {
        success: true,
        processedCount: leaseData.length,
        errors: [],
        warnings: [],
        leaseData,
        propertyMatches
      };

      console.log(`Successfully processed ${leaseData.length} lease records`);
      return result;
      
    } catch (error) {
      console.error('Error processing CSV lease file:', error);
      return {
        success: false,
        processedCount: 0,
        errors: [error.message],
        warnings: [],
        leaseData: [],
        propertyMatches: {}
      };
    }
  }

  /**
   * Parse CSV file using XLSX library
   */
  private async parseCSVFile(filePath: string): Promise<any[]> {
    const fileBuffer = await fs.readFile(filePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet);
  }

  /**
   * Map CSV data to structured lease data using the provided template
   */
  private mapCSVToLeaseData(csvData: any[]): CSVLeaseData[] {
    return csvData.map((row, index) => {
      try {
        // Map CSV columns to our lease data structure
        const leaseData: CSVLeaseData = {
          tenantName: row['Tenant name'] || row['Tenant Name'] || '',
          phone: row['Phone'] || '',
          email: row['Email'] || '',
          address: row['Address'] || '',
          unitNumber: row['Unit #'] || row['Unit'] || '',
          leaseFrom: this.parseDate(row['Lease from']) || '',
          leaseTo: this.parseDate(row['Lease to']) || '',
          monthlyRent: this.parseAmount(row['Monthly rent']) || 0,
          securityDeposit: this.parseAmount(row['Security Deposit']) || 0,
          petPolicy: row['Pet Policy'] || '',
          utilities: row['Utilities'] || '',
          parking: row['Parking'] || ''
        };

        return leaseData;
      } catch (error) {
        console.error(`Error processing row ${index + 1}:`, error);
        return null;
      }
    }).filter(Boolean);
  }

  /**
   * Match lease addresses to existing properties
   */
  private async matchPropertiesToLeases(leaseData: CSVLeaseData[]): Promise<{ [key: string]: number }> {
    const propertyMatches: { [key: string]: number } = {};
    
    // Get all properties for matching
    const allProperties = await db.select().from(properties);
    console.log('Available properties for matching:', allProperties.map(p => ({ id: p.id, address: p.address })));
    
    for (const lease of leaseData) {
      console.log(`Trying to match lease address: "${lease.address}" for tenant: ${lease.tenantName}`);
      
      // Try to match by address
      const matchedProperty = allProperties.find(property => {
        const propertyAddress = property.address?.toLowerCase().trim();
        const leaseAddress = lease.address?.toLowerCase().trim();
        
        console.log(`  Comparing property "${propertyAddress}" with lease "${leaseAddress}"`);
        
        // Remove unit numbers and extra details for comparison
        const cleanPropertyAddress = propertyAddress?.replace(/\s*(#|unit|apt|apartment)\s*\d+.*$/i, '').trim();
        const cleanLeaseAddress = leaseAddress?.replace(/\s*(#|unit|apt|apartment)\s*\d+.*$/i, '').trim();
        
        console.log(`  Clean property: "${cleanPropertyAddress}" vs clean lease: "${cleanLeaseAddress}"`);
        
        const isMatch = cleanPropertyAddress && cleanLeaseAddress && 
               (cleanLeaseAddress.includes(cleanPropertyAddress) || cleanPropertyAddress.includes(cleanLeaseAddress));
        
        console.log(`  Match result: ${isMatch}`);
        return isMatch;
      });
      
      if (matchedProperty) {
        const key = `${lease.address}-${lease.unitNumber}`;
        propertyMatches[key] = matchedProperty.id;
        console.log(`✓ Matched ${lease.tenantName} to property ${matchedProperty.id} (${matchedProperty.address})`);
      } else {
        console.log(`✗ No match found for ${lease.tenantName} at "${lease.address}"`);
      }
    }
    
    console.log('Final property matches:', propertyMatches);
    return propertyMatches;
  }

  /**
   * Save lease data to database (rent roll and tenant details)
   */
  async saveLeaseDataToDatabase(
    leaseData: CSVLeaseData[], 
    propertyMatches: { [key: string]: number }
  ): Promise<{ saved: number, errors: string[] }> {
    let saved = 0;
    const errors: string[] = [];

    for (const lease of leaseData) {
      try {
        const matchKey = `${lease.address}-${lease.unitNumber}`;
        const propertyId = propertyMatches[matchKey];
        
        if (!propertyId) {
          errors.push(`No property match found for ${lease.tenantName} at ${lease.address} Unit ${lease.unitNumber}`);
          continue;
        }

        // Check if rent roll entry exists
        console.log(`Looking for unit ${lease.unitNumber} in property ${propertyId}`);
        const existingRentRoll = await db.select()
          .from(propertyRentRoll)
          .where(and(
            eq(propertyRentRoll.propertyId, propertyId),
            eq(propertyRentRoll.unitNumber, lease.unitNumber.toString())
          ))
          .limit(1);
        
        console.log(`Found ${existingRentRoll.length} existing rent roll entries`);  

        if (existingRentRoll.length > 0) {
          // Update existing rent roll with real lease data
          console.log(`Updating existing rent roll for unit ${lease.unitNumber}`);
          await db.update(propertyRentRoll)
            .set({
              currentRent: lease.monthlyRent.toString(),
              tenantName: lease.tenantName,
              isVacant: false,
              leaseStart: lease.leaseFrom ? new Date(lease.leaseFrom) : null,
              leaseEnd: lease.leaseTo ? new Date(lease.leaseTo) : null,
              updatedAt: new Date()
            })
            .where(eq(propertyRentRoll.id, existingRentRoll[0].id));
          console.log(`✓ Updated rent roll for ${lease.tenantName} in unit ${lease.unitNumber}`);
        } else {
          // Create new rent roll entry
          await db.insert(propertyRentRoll).values({
            propertyId,
            unitNumber: lease.unitNumber.toString(),
            currentRent: lease.monthlyRent.toString(),
            proFormaRent: lease.monthlyRent.toString(),
            tenantName: lease.tenantName,
            isVacant: false,
            leaseStart: lease.leaseFrom ? new Date(lease.leaseFrom) : null,
            leaseEnd: lease.leaseTo ? new Date(lease.leaseTo) : null,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }

        // Note: Detailed tenant information will be stored when tenant modal is accessed
        // For now, we just store basic info in the rent roll

        saved++;
        console.log(`Saved lease data for ${lease.tenantName} - Unit ${lease.unitNumber}`);
        
      } catch (error) {
        console.error(`Error saving lease data for ${lease.tenantName}:`, error);
        errors.push(`Failed to save ${lease.tenantName}: ${error.message}`);
      }
    }

    return { saved, errors };
  }

  /**
   * Parse date string to proper format
   */
  private parseDate(dateValue: any): string | null {
    if (!dateValue) return null;
    
    try {
      console.log(`Parsing date: ${dateValue} (type: ${typeof dateValue})`);
      
      // Handle Excel serial numbers and various date formats
      let date: Date;
      
      if (typeof dateValue === 'number') {
        // Excel date serial number (days since 1900-01-01, but Excel has a leap year bug)
        const excelEpoch = new Date(1900, 0, 1);
        const days = dateValue - 2; // Adjust for Excel's 1900 leap year bug
        date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
        console.log(`Excel date ${dateValue} converted to: ${date}`);
      } else if (typeof dateValue === 'string') {
        // Handle M/D/YYYY format and other string formats
        let dateStr = dateValue.toString().trim();
        
        if (dateStr.includes('/') && dateStr.split('/').length === 3) {
          const parts = dateStr.split('/');
          const month = parseInt(parts[0]) - 1; // Month is 0-indexed in Date constructor
          const day = parseInt(parts[1]);
          const year = parseInt(parts[2]);
          date = new Date(year, month, day);
          console.log(`Date string "${dateStr}" parsed as: ${date}`);
        } else {
          date = new Date(dateStr);
        }
      } else {
        date = new Date(dateValue);
      }
      
      if (isNaN(date.getTime())) {
        console.warn(`Could not parse date: ${dateValue}`);
        return null;
      }
      
      const result = date.toISOString().split('T')[0];
      console.log(`Final date result: ${result}`);
      return result;
    } catch (error) {
      console.error(`Error parsing date ${dateValue}:`, error);
      return null;
    }
  }

  /**
   * Parse monetary amount from string
   */
  private parseAmount(value: any): number {
    if (!value) return 0;
    
    // Remove commas, dollar signs, and other formatting
    const cleanValue = value.toString()
      .replace(/[$,\s]/g, '')
      .replace(/[()]/g, ''); // Remove parentheses
    
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? 0 : parsed;
  }
}

export const csvLeaseProcessor = new CSVLeaseProcessorService();