import { useState } from 'react';
import { useToast } from '../ui/use-toast';
import { Button } from '../ui/button';
import { Calendar } from '../ui/calendar';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { format } from 'date-fns';
import { Download, CalendarIcon, Loader2 } from 'lucide-react';

interface ExportOptions {
  startDate?: Date;
  endDate?: Date;
  includeTemplateStats: boolean;
  includeUsageStats: boolean;
  format: 'xlsx' | 'csv' | 'json';
}

export function ExportAnalytics() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<ExportOptions>({
    includeTemplateStats: true,
    includeUsageStats: true,
    format: 'xlsx'
  });
  const { toast } = useToast();

  const handleExport = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Export failed');
      }

      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition?.split('filename=')[1]?.replace(/"/g, '') || 'analytics-export';

      // Create a download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Analytics data exported successfully'
      });
      setOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to export analytics'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export Analytics
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Analytics Data</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Date Range */}
          <div className="grid gap-2">
            <Label>Date Range (Optional)</Label>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={!options.startDate ? 'text-muted-foreground' : ''}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {options.startDate ? format(options.startDate, 'PPP') : 'Start date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={options.startDate}
                    onSelect={(date) =>
                      setOptions((prev) => ({ ...prev, startDate: date || undefined }))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={!options.endDate ? 'text-muted-foreground' : ''}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {options.endDate ? format(options.endDate, 'PPP') : 'End date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={options.endDate}
                    onSelect={(date) =>
                      setOptions((prev) => ({ ...prev, endDate: date || undefined }))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Data Options */}
          <div className="space-y-2">
            <Label>Include Data</Label>
            <div className="flex flex-col gap-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="templateStats"
                  checked={options.includeTemplateStats}
                  onCheckedChange={(checked) =>
                    setOptions((prev) => ({
                      ...prev,
                      includeTemplateStats: checked as boolean
                    }))
                  }
                />
                <Label htmlFor="templateStats">Template Statistics</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="usageStats"
                  checked={options.includeUsageStats}
                  onCheckedChange={(checked) =>
                    setOptions((prev) => ({
                      ...prev,
                      includeUsageStats: checked as boolean
                    }))
                  }
                />
                <Label htmlFor="usageStats">Usage Statistics</Label>
              </div>
            </div>
          </div>

          {/* Export Format */}
          <div className="grid gap-2">
            <Label>Export Format</Label>
            <Select
              value={options.format}
              onValueChange={(value: 'xlsx' | 'csv' | 'json') =>
                setOptions((prev) => ({ ...prev, format: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Export Button */}
          <Button
            onClick={handleExport}
            disabled={loading || (!options.includeTemplateStats && !options.includeUsageStats)}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
