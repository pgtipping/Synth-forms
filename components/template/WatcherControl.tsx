import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Loader2, Power, PowerOff } from 'lucide-react';
import { useToast } from '../ui/use-toast';

interface WatcherStatus {
  status: 'RUNNING' | 'STOPPED';
  lastUpdate?: string;
}

export function WatcherControl() {
  const [status, setStatus] = useState<WatcherStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/watcher');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setStatus(data);
    } catch (error) {
      console.error('Error fetching watcher status:', error);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const controlWatcher = async (action: 'start' | 'stop') => {
    try {
      setLoading(true);
      const response = await fetch('/api/watcher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setStatus(data);
      toast({
        title: 'Success',
        description: data.message
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to control file watcher'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Template Watcher
        </CardTitle>
        {status && (
          <Badge
            variant={status.status === 'RUNNING' ? 'default' : 'secondary'}
          >
            {status.status}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">
                Auto-process new templates
              </p>
              <p className="text-sm text-muted-foreground">
                {status?.status === 'RUNNING'
                  ? 'Watching for new templates...'
                  : 'Template watcher is inactive'}
              </p>
            </div>
            <Button
              variant={status?.status === 'RUNNING' ? 'destructive' : 'default'}
              size="sm"
              onClick={() => controlWatcher(status?.status === 'RUNNING' ? 'stop' : 'start')}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : status?.status === 'RUNNING' ? (
                <>
                  <PowerOff className="mr-2 h-4 w-4" />
                  Stop
                </>
              ) : (
                <>
                  <Power className="mr-2 h-4 w-4" />
                  Start
                </>
              )}
            </Button>
          </div>
          {status?.lastUpdate && (
            <p className="text-xs text-muted-foreground">
              Last updated: {new Date(status.lastUpdate).toLocaleString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
