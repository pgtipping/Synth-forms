import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Loader2, AlertTriangle, Check } from 'lucide-react';
import { useToast } from '../ui/use-toast';

interface DuplicateGroup {
  hash: string;
  files: {
    path: string;
    size: number;
    lastModified: Date;
  }[];
}

export function DuplicateManager() {
  const [loading, setLoading] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [report, setReport] = useState<string>('');
  const { toast } = useToast();

  const scanForDuplicates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/templates/deduplicate');
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setDuplicates(data.duplicateGroups);
      setReport(data.report);

      toast({
        title: 'Scan Complete',
        description: `Found ${data.duplicateGroups.length} groups of duplicate templates`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to scan for duplicates',
      });
    } finally {
      setLoading(false);
    }
  };

  const cleanupDuplicates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/templates/deduplicate', {
        method: 'POST',
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      toast({
        title: 'Cleanup Complete',
        description: 'Successfully cleaned up duplicate templates',
      });

      // Reset state after cleanup
      setDuplicates([]);
      setReport('');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to clean up duplicates',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Template Duplicate Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-4">
            <Button
              onClick={scanForDuplicates}
              disabled={loading}
              variant="outline"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                'Scan for Duplicates'
              )}
            </Button>
            {duplicates.length > 0 && (
              <Button
                onClick={cleanupDuplicates}
                disabled={loading}
                variant="destructive"
              >
                Clean Up Duplicates
              </Button>
            )}
          </div>

          {duplicates.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Duplicate Templates Found</AlertTitle>
              <AlertDescription>
                Found {duplicates.length} groups of duplicate templates.
                Review the report below before cleaning up.
              </AlertDescription>
            </Alert>
          )}

          {report && (
            <Card className="mt-4">
              <CardContent className="pt-6">
                <pre className="whitespace-pre-wrap text-sm">
                  {report}
                </pre>
              </CardContent>
            </Card>
          )}

          {duplicates.length === 0 && !loading && (
            <Alert>
              <Check className="h-4 w-4" />
              <AlertTitle>No Duplicates</AlertTitle>
              <AlertDescription>
                No duplicate templates were found in the system.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
