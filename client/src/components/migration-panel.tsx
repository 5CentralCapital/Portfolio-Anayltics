import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function MigrationPanel() {
  const [isLoading, setIsLoading] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const { toast } = useToast();

  const runMigration = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/migrate-deal-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setMigrationStatus('success');
        toast({
          title: "Migration Complete",
          description: "Deal Analyzer data has been migrated to normalized database tables.",
        });
      } else {
        setMigrationStatus('error');
        toast({
          title: "Migration Failed",
          description: "There was an error migrating the data. Check console for details.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setMigrationStatus('error');
      toast({
        title: "Migration Failed",
        description: "Network error during migration.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Migration: JSON to Normalized Tables
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p className="mb-3">
            Currently, Deal Analyzer data is stored in a single JSON column. This migration will:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Move data to 8 separate normalized tables</li>
            <li>Enable better query performance and indexing</li>
            <li>Provide data integrity with foreign key constraints</li>
            <li>Allow atomic updates to specific data sections</li>
            <li>Enable complex analytics and reporting queries</li>
          </ul>
        </div>

        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
          <div className="text-center">
            <Badge variant="outline">Current</Badge>
            <div className="mt-2 text-sm">JSON Column</div>
            <div className="text-xs text-muted-foreground">Single dealAnalyzerData field</div>
          </div>
          
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          
          <div className="text-center">
            <Badge variant="default">New</Badge>
            <div className="mt-2 text-sm">Normalized Tables</div>
            <div className="text-xs text-muted-foreground">8 separate tables with relations</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-blue-50 rounded">
            <div className="font-medium">property_assumptions</div>
            <div className="text-muted-foreground">Deal parameters & ratios</div>
          </div>
          <div className="p-2 bg-green-50 rounded">
            <div className="font-medium">property_rent_roll</div>
            <div className="text-muted-foreground">Unit rental data</div>
          </div>
          <div className="p-2 bg-purple-50 rounded">
            <div className="font-medium">property_expenses</div>
            <div className="text-muted-foreground">Operating expense breakdown</div>
          </div>
          <div className="p-2 bg-orange-50 rounded">
            <div className="font-medium">property_rehab_budget</div>
            <div className="text-muted-foreground">Rehab line items</div>
          </div>
          <div className="p-2 bg-indigo-50 rounded">
            <div className="font-medium">property_closing_costs</div>
            <div className="text-muted-foreground">Acquisition costs</div>
          </div>
          <div className="p-2 bg-emerald-50 rounded">
            <div className="font-medium">property_holding_costs</div>
            <div className="text-muted-foreground">Holding period costs</div>
          </div>
          <div className="p-2 bg-rose-50 rounded">
            <div className="font-medium">property_exit_analysis</div>
            <div className="text-muted-foreground">Sale scenarios</div>
          </div>
          <div className="p-2 bg-amber-50 rounded">
            <div className="font-medium">property_income_other</div>
            <div className="text-muted-foreground">Additional income sources</div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2">
            {migrationStatus === 'success' && (
              <>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">Migration completed successfully</span>
              </>
            )}
            {migrationStatus === 'error' && (
              <>
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-600">Migration failed</span>
              </>
            )}
          </div>
          
          <Button 
            onClick={runMigration}
            disabled={isLoading || migrationStatus === 'success'}
            className="ml-auto"
          >
            {isLoading ? 'Migrating...' : migrationStatus === 'success' ? 'Completed' : 'Run Migration'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}