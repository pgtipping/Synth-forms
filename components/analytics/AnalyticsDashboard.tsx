import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useToast } from '../ui/use-toast';
import { Loader2 } from 'lucide-react';
import {
  AreaChart,
  Card as TremorCard,
  Title,
  BarChart,
  DonutChart,
  Grid,
  Text,
  Metric,
  Flex
} from '@tremor/react';
import { ExportAnalytics } from './ExportAnalytics';

interface TemplateStats {
  totalTemplates: number;
  activeTemplates: number;
  templatesWithWatermark: number;
  averageSize: number;
  byCategory: {
    categoryName: string;
    count: number;
  }[];
  byFileType: {
    fileType: string;
    count: number;
  }[];
}

interface UsageStats {
  totalFormResponses: number;
  activeUsers: number;
  responsesByTemplate: {
    templateName: string;
    count: number;
  }[];
  dailyResponses: {
    date: string;
    count: number;
  }[];
}

interface Analytics {
  templateStats: TemplateStats;
  usageStats: UsageStats;
}

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/analytics');
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setAnalytics(data);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to fetch analytics data'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
    // Refresh every 5 minutes
    const interval = setInterval(fetchAnalytics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!analytics) return null;

  const { templateStats, usageStats } = analytics;

  return (
    <div className="space-y-8">
      {/* Header with Export Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
        <ExportAnalytics />
      </div>

      {/* Summary Cards */}
      <Grid numItems={1} numItemsSm={2} numItemsLg={4} className="gap-6">
        <TremorCard>
          <Text>Total Templates</Text>
          <Metric>{templateStats.totalTemplates}</Metric>
        </TremorCard>
        <TremorCard>
          <Text>Active Users</Text>
          <Metric>{usageStats.activeUsers}</Metric>
        </TremorCard>
        <TremorCard>
          <Text>Total Form Responses</Text>
          <Metric>{usageStats.totalFormResponses}</Metric>
        </TremorCard>
        <TremorCard>
          <Text>Templates with Watermark</Text>
          <Metric>{templateStats.templatesWithWatermark}</Metric>
        </TremorCard>
      </Grid>

      {/* Charts */}
      <Grid numItems={1} numItemsLg={2} className="gap-6">
        {/* Daily Form Responses */}
        <TremorCard>
          <Title>Daily Form Responses</Title>
          <AreaChart
            className="mt-4 h-72"
            data={usageStats.dailyResponses}
            index="date"
            categories={["count"]}
            colors={["blue"]}
            valueFormatter={(value) => value.toString()}
          />
        </TremorCard>

        {/* Templates by Category */}
        <TremorCard>
          <Title>Templates by Category</Title>
          <DonutChart
            className="mt-4 h-72"
            data={templateStats.byCategory}
            category="count"
            index="categoryName"
            valueFormatter={(value) => value.toString()}
            colors={["slate", "violet", "indigo", "rose", "cyan", "amber"]}
          />
        </TremorCard>
      </Grid>

      <Grid numItems={1} numItemsLg={2} className="gap-6">
        {/* Most Used Templates */}
        <TremorCard>
          <Title>Most Used Templates</Title>
          <BarChart
            className="mt-4 h-72"
            data={usageStats.responsesByTemplate}
            index="templateName"
            categories={["count"]}
            colors={["blue"]}
            valueFormatter={(value) => value.toString()}
          />
        </TremorCard>

        {/* Templates by File Type */}
        <TremorCard>
          <Title>Templates by File Type</Title>
          <DonutChart
            className="mt-4 h-72"
            data={templateStats.byFileType}
            category="count"
            index="fileType"
            valueFormatter={(value) => value.toString()}
            colors={["emerald", "yellow", "rose"]}
          />
        </TremorCard>
      </Grid>
    </div>
  );
}
