import * as fs from 'fs';
import * as path from 'path';
import { db } from './db';
import { properties, propertyRentRoll, tenantDetails } from '../shared/schema';
import { eq, and, isNotNull, desc } from 'drizzle-orm';
import { GoogleGenAI } from '@google/genai';

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface LeaseData {
  tenantName: string;
  propertyAddress: string;
  unitNumber?: string;
  leaseStartDate: string;
  leaseEndDate: string;
  monthlyRent: number;
  securityDeposit?: number;
  petDeposit?: number;
  phone?: string;
  email?: string;
  utilities?: string;
  petPolicy?: string;
  notes?: string;
  leaseTerm?: string;
  lateFee?: number;
}

export interface ProcessedLease {
  tenant: string;
  property?: string;
  address?: string;
  rent: number;
  leaseStart?: string;
  leaseEnd?: string;
  phone?: string;
  email?: string;
  unitNumber?: string;
  securityDeposit?: number;
  petDeposit?: number;
  utilities?: string;
  petPolicy?: string;
  notes?: string;
}

export interface LeaseProcessingResult {
  success: boolean;
  fileName: string;
  parsed: number;
  matched: number;
  unmatched: number;
  updated: number;
  errors: string[];
  warnings: string[];
  data: {
    matched: ProcessedLease[];
    unmatched: ProcessedLease[];
  };
}

export class LeaseProcessingService {
  /**
   * Process uploaded lease documents
   */
  async processLeaseFiles(files: Express.Multer.File[]): Promise<LeaseProcessingResult> {
    const results: LeaseProcessingResult = {
      success: true,
      fileName: files.map(f => f.filename).join(', '),
      parsed: 0,
      matched: 0,
      unmatched: 0,
      updated: 0,
      errors: [],
      warnings: [],
      data: {
        matched: [],
        unmatched: []
      }
    };

    try {
      // Get all properties for matching
      const allProperties = await db.select().from(properties);

      for (const file of files) {
        try {
          const leaseData = await this.extractLeaseData(file.path, file.filename);
          results.parsed++;

          // Try to match to property
          const matchedProperty = this.findMatchingProperty(leaseData, allProperties);
          
          const processedLease: ProcessedLease = {
            tenant: leaseData.tenantName,
            property: matchedProperty?.address,
            address: leaseData.propertyAddress,
            rent: leaseData.monthlyRent,
            leaseStart: leaseData.leaseStartDate,
            leaseEnd: leaseData.leaseEndDate,
            phone: leaseData.phone,
            email: leaseData.email,
            unitNumber: leaseData.unitNumber,
            securityDeposit: leaseData.securityDeposit,
            petDeposit: leaseData.petDeposit,
            utilities: leaseData.utilities,
            petPolicy: leaseData.petPolicy,
            notes: leaseData.notes
          };

          if (matchedProperty) {
            // Automatically add to property rent roll
            await this.addToRentRoll(matchedProperty.id, leaseData);
            results.matched++;
            results.updated++;
            results.data.matched.push(processedLease);
          } else {
            results.unmatched++;
            results.data.unmatched.push(processedLease);
            results.warnings.push(`Could not match "${leaseData.tenantName}" to any property`);
          }

        } catch (error) {
          console.error(`Error processing file ${file.filename}:`, error);
          results.errors.push(`Failed to process ${file.filename}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

    } catch (error) {
      console.error('Error in lease processing:', error);
      results.success = false;
      results.errors.push(`Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return results;
  }

  /**
   * Extract lease data from document using AI
   */
  private async extractLeaseData(filePath: string, fileName: string): Promise<LeaseData> {
    try {
      let documentContent = '';
      
      if (fileName.toLowerCase().endsWith('.pdf')) {
        // For now, we'll implement a basic PDF text extraction
        // In production, you'd use a proper PDF parsing library
        documentContent = await this.extractPDFText(filePath);
      } else {
        documentContent = fs.readFileSync(filePath, 'utf-8');
      }

      const prompt = `Extract lease information from this document. Return JSON with the following structure:
{
  "tenantName": "Full tenant name",
  "propertyAddress": "Complete property address", 
  "unitNumber": "Unit number if specified",
  "leaseStartDate": "YYYY-MM-DD",
  "leaseEndDate": "YYYY-MM-DD",
  "monthlyRent": 0.00,
  "securityDeposit": 0.00,
  "petDeposit": 0.00,
  "phone": "Phone number",
  "email": "Email address",
  "utilities": "Utilities description",
  "petPolicy": "Pet policy details",
  "notes": "Additional lease terms or notes",
  "leaseTerm": "Lease term description",
  "lateFee": 0.00
}

Document content:
${documentContent}`;

      const systemPrompt = `You are an expert at extracting structured data from lease agreements. 
Extract lease information from the provided document and return JSON with the exact structure specified.
Always return valid JSON only, no additional text.`;

      const response = await gemini.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              tenantName: { type: "string" },
              propertyAddress: { type: "string" },
              unitNumber: { type: "string" },
              leaseStartDate: { type: "string" },
              leaseEndDate: { type: "string" },
              monthlyRent: { type: "number" },
              securityDeposit: { type: "number" },
              petDeposit: { type: "number" },
              phone: { type: "string" },
              email: { type: "string" },
              utilities: { type: "string" },
              petPolicy: { type: "string" },
              notes: { type: "string" },
              leaseTerm: { type: "string" },
              lateFee: { type: "number" }
            },
            required: ["tenantName", "propertyAddress", "monthlyRent"]
          }
        },
        contents: prompt
      });

      const extractedData = JSON.parse(response.text || '{}');
      
      // Validate and clean the data
      return {
        tenantName: extractedData.tenantName || 'Unknown Tenant',
        propertyAddress: extractedData.propertyAddress || '',
        unitNumber: extractedData.unitNumber || undefined,
        leaseStartDate: this.parseDate(extractedData.leaseStartDate) || '',
        leaseEndDate: this.parseDate(extractedData.leaseEndDate) || '',
        monthlyRent: parseFloat(extractedData.monthlyRent) || 0,
        securityDeposit: parseFloat(extractedData.securityDeposit) || undefined,
        petDeposit: parseFloat(extractedData.petDeposit) || undefined,
        phone: extractedData.phone || undefined,
        email: extractedData.email || undefined,
        utilities: extractedData.utilities || undefined,
        petPolicy: extractedData.petPolicy || undefined,
        notes: extractedData.notes || undefined,
        leaseTerm: extractedData.leaseTerm || undefined,
        lateFee: parseFloat(extractedData.lateFee) || undefined
      };

    } catch (error) {
      console.error('Error extracting lease data:', error);
      throw new Error(`Failed to extract lease data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Basic PDF text extraction - in production use proper PDF library
   */
  private async extractPDFText(filePath: string): Promise<string> {
    try {
      // This is a simplified approach - in production you'd use pdf-parse or similar
      const buffer = fs.readFileSync(filePath);
      // For now, return a placeholder - you'd implement actual PDF parsing here
      return buffer.toString('utf-8');
    } catch (error) {
      throw new Error('PDF parsing not fully implemented');
    }
  }

  /**
   * Find matching property based on address
   */
  private findMatchingProperty(leaseData: LeaseData, properties: any[]): any | null {
    if (!leaseData.propertyAddress) return null;

    const address = leaseData.propertyAddress.toLowerCase();
    
    return properties.find(property => {
      const propAddress = property.address.toLowerCase();
      
      // Exact match
      if (address === propAddress) return true;
      
      // Partial matches
      const addressParts = address.split(' ');
      const propParts = propAddress.split(' ');
      
      // Check if main street/number matches
      const addressNumbers = addressParts.filter(part => /^\d+/.test(part));
      const propNumbers = propParts.filter(part => /^\d+/.test(part));
      
      if (addressNumbers.length > 0 && propNumbers.length > 0) {
        const hasMatchingNumber = addressNumbers.some(num => 
          propNumbers.some(propNum => propNum.includes(num) || num.includes(propNum))
        );
        
        if (hasMatchingNumber) {
          // Also check for street name match
          const hasMatchingStreet = addressParts.some(part => 
            propParts.some(propPart => 
              part.length > 3 && propPart.length > 3 && 
              (part.includes(propPart) || propPart.includes(part))
            )
          );
          
          if (hasMatchingStreet) return true;
        }
      }
      
      return false;
    });
  }

  /**
   * Add lease data to property rent roll
   */
  private async addToRentRoll(propertyId: number, leaseData: LeaseData): Promise<void> {
    try {
      // Check if tenant already exists
      const existingTenant = await db.select()
        .from(propertyRentRoll)
        .where(and(
          eq(propertyRentRoll.propertyId, propertyId),
          eq(propertyRentRoll.tenantName, leaseData.tenantName)
        ))
        .limit(1);

      if (existingTenant.length > 0) {
        // Update existing tenant
        await db.update(propertyRentRoll)
          .set({
            unitNumber: leaseData.unitNumber || existingTenant[0].unitNumber,
            currentRent: leaseData.monthlyRent.toString(),
            proFormaRent: leaseData.monthlyRent.toString(),
            leaseFrom: leaseData.leaseStartDate || existingTenant[0].leaseFrom,
            leaseTo: leaseData.leaseEndDate || existingTenant[0].leaseTo,
            isRealData: true,
            updatedAt: new Date()
          })
          .where(eq(propertyRentRoll.id, existingTenant[0].id));
      } else {
        // Create new tenant record
        await db.insert(propertyRentRoll).values({
          propertyId,
          tenantName: leaseData.tenantName,
          unitNumber: leaseData.unitNumber || `Unit ${Math.floor(Math.random() * 100)}`,
          unitType: 'Studio', // Default
          currentRent: leaseData.monthlyRent.toString(),
          proFormaRent: leaseData.monthlyRent.toString(),
          leaseFrom: leaseData.leaseStartDate,
          leaseTo: leaseData.leaseEndDate,
          isRealData: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      // Add detailed tenant information
      await this.createTenantDetails(propertyId, leaseData);

    } catch (error) {
      console.error('Error adding to rent roll:', error);
      throw error;
    }
  }

  /**
   * Create detailed tenant record
   */
  private async createTenantDetails(propertyId: number, leaseData: LeaseData): Promise<void> {
    try {
      // Check if tenant details already exist
      const existingDetails = await db.select()
        .from(tenantDetails)
        .where(and(
          eq(tenantDetails.propertyId, propertyId),
          eq(tenantDetails.tenantName, leaseData.tenantName)
        ))
        .limit(1);

      const detailsData = {
        propertyId,
        tenantName: leaseData.tenantName,
        unitNumber: leaseData.unitNumber,
        phoneNumber: leaseData.phone,
        emailAddress: leaseData.email,
        leaseStartDate: leaseData.leaseStartDate,
        leaseEndDate: leaseData.leaseEndDate,
        monthlyRent: leaseData.monthlyRent.toString(),
        securityDeposit: leaseData.securityDeposit?.toString(),
        petDeposit: leaseData.petDeposit?.toString(),
        utilities: leaseData.utilities,
        petPolicy: leaseData.petPolicy,
        additionalNotes: leaseData.notes,
        leaseTerm: leaseData.leaseTerm,
        lateFee: leaseData.lateFee?.toString(),
        updatedAt: new Date()
      };

      if (existingDetails.length > 0) {
        // Update existing details
        await db.update(tenantDetails)
          .set(detailsData)
          .where(eq(tenantDetails.id, existingDetails[0].id));
      } else {
        // Create new details record
        await db.insert(tenantDetails).values({
          ...detailsData,
          createdAt: new Date()
        });
      }

    } catch (error) {
      console.error('Error creating tenant details:', error);
      throw error;
    }
  }

  /**
   * Handle manual review save
   */
  async saveManualReview(reviewData: {
    originalLease: ProcessedLease;
    editedLease: ProcessedLease & { propertyId: number };
    propertyId: number;
    manualReview: boolean;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const { editedLease, propertyId } = reviewData;

      // Convert to LeaseData format
      const leaseData: LeaseData = {
        tenantName: editedLease.tenant,
        propertyAddress: editedLease.address || '',
        unitNumber: editedLease.unitNumber,
        leaseStartDate: editedLease.leaseStart || '',
        leaseEndDate: editedLease.leaseEnd || '',
        monthlyRent: editedLease.rent,
        securityDeposit: editedLease.securityDeposit,
        petDeposit: editedLease.petDeposit,
        phone: editedLease.phone,
        email: editedLease.email,
        utilities: editedLease.utilities,
        petPolicy: editedLease.petPolicy,
        notes: editedLease.notes
      };

      await this.addToRentRoll(propertyId, leaseData);

      return {
        success: true,
        message: 'Lease data saved successfully to property rent roll'
      };

    } catch (error) {
      console.error('Error saving manual review:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save lease data'
      };
    }
  }

  /**
   * Parse date string to YYYY-MM-DD format
   */
  private parseDate(dateStr: string): string | null {
    if (!dateStr) return null;
    
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;
      
      return date.toISOString().split('T')[0];
    } catch {
      return null;
    }
  }
}

export const leaseProcessingService = new LeaseProcessingService();