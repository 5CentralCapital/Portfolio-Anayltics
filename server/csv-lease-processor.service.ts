/**
 * CSV Lease Processor Service
 * Handles direct processing of lease data from CSV files
 */

import * as XLSX from 'xlsx';
import { promises as fs } from 'fs';
import { db } from './db';
import { properties, propertyRentRoll, tenantDetails } from '@shared/schema';
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
      const leaseData = this.mapCSVToLeaseData(csvData);
      const propertyMatches = await this.matchPropertiesToLeases(leaseData);
      
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
    
    for (const lease of leaseData) {
      // Try to match by address
      const matchedProperty = allProperties.find(property => {
        const propertyAddress = property.address?.toLowerCase().trim();
        const leaseAddress = lease.address?.toLowerCase().trim();
        
        // Remove unit numbers and extra details for comparison
        const cleanPropertyAddress = propertyAddress?.replace(/\s*(#|unit|apt|apartment)\s*\d+.*$/i, '').trim();
        const cleanLeaseAddress = leaseAddress?.replace(/\s*(#|unit|apt|apartment)\s*\d+.*$/i, '').trim();
        
        return cleanPropertyAddress && cleanLeaseAddress && 
               (cleanLeaseAddress.includes(cleanPropertyAddress) || cleanPropertyAddress.includes(cleanLeaseAddress));
      });
      
      if (matchedProperty) {
        const key = `${lease.address}-${lease.unitNumber}`;
        propertyMatches[key] = matchedProperty.id;
      }
    }
    
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
        const existingRentRoll = await db.select()
          .from(propertyRentRoll)
          .where(and(
            eq(propertyRentRoll.propertyId, propertyId),
            eq(propertyRentRoll.unitNumber, lease.unitNumber)
          ))
          .limit(1);

        if (existingRentRoll.length > 0) {
          // Update existing rent roll with real lease data
          await db.update(propertyRentRoll)
            .set({
              currentRent: lease.monthlyRent.toString(),
              tenantName: lease.tenantName,
              isVacant: false,
              leaseStart: new Date(lease.leaseFrom),
              leaseEnd: new Date(lease.leaseTo),
              updatedAt: new Date()
            })
            .where(eq(propertyRentRoll.id, existingRentRoll[0].id));
        } else {
          // Create new rent roll entry
          await db.insert(propertyRentRoll).values({
            propertyId,
            unitNumber: lease.unitNumber,
            currentRent: lease.monthlyRent.toString(),
            proFormaRent: lease.monthlyRent.toString(),
            tenantName: lease.tenantName,
            isVacant: false,
            leaseStart: new Date(lease.leaseFrom),
            leaseEnd: new Date(lease.leaseTo),
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }

        // Save detailed tenant information
        const tenantDetailData = {
          propertyId,
          unitNumber: lease.unitNumber,
          tenantName: lease.tenantName,
          phone: lease.phone || null,
          email: lease.email || null,
          leaseStartDate: new Date(lease.leaseFrom),
          leaseEndDate: new Date(lease.leaseTo),
          monthlyRent: lease.monthlyRent,
          securityDeposit: lease.securityDeposit || 0,
          petPolicy: lease.petPolicy || null,
          utilitiesResponsibility: lease.utilities || null,
          parkingSpaces: lease.parking ? 1 : 0,
          leaseNotes: `Imported from CSV: ${lease.petPolicy ? 'Pet Policy: ' + lease.petPolicy : ''} ${lease.utilities ? 'Utilities: ' + lease.utilities : ''}`.trim(),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Check if tenant details already exist
        const existingTenant = await db.select()
          .from(tenantDetails)
          .where(and(
            eq(tenantDetails.propertyId, propertyId),
            eq(tenantDetails.unitNumber, lease.unitNumber)
          ))
          .limit(1);

        if (existingTenant.length > 0) {
          await db.update(tenantDetails)
            .set(tenantDetailData)
            .where(eq(tenantDetails.id, existingTenant[0].id));
        } else {
          await db.insert(tenantDetails).values(tenantDetailData);
        }

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
      // Handle various date formats
      let dateStr = dateValue.toString().trim();
      
      // Handle M/D/YYYY format
      if (dateStr.includes('/') && dateStr.split('/').length === 3) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          const month = parts[0].padStart(2, '0');
          const day = parts[1].padStart(2, '0');
          const year = parts[2];
          dateStr = `${year}-${month}-${day}`;
        }
      }
      
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return null;
      }
      
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error parsing date:', dateValue, error);
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