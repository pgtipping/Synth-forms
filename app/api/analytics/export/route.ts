import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { exportAnalytics } from '@/lib/analytics-export';
import { createAuditLog } from '@/lib/audit';
import { AUDIT_ENTITY_TYPES } from '@/lib/audit';
import { z } from 'zod';

const exportSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  includeTemplateStats: z.boolean().default(true),
  includeUsageStats: z.boolean().default(true),
  format: z.enum(['xlsx', 'csv', 'json']).default('xlsx')
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await request.json();
    const data = exportSchema.parse(json);

    const buffer = await exportAnalytics({
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      includeTemplateStats: data.includeTemplateStats,
      includeUsageStats: data.includeUsageStats,
      format: data.format
    });

    // Log the export in audit trail
    await createAuditLog({
      action: 'TEMPLATE_EXPORT',
      userId: session.user.id,
      entityType: AUDIT_ENTITY_TYPES.TEMPLATE,
      entityId: 'analytics',
      metadata: {
        details: {
          format: data.format,
          startDate: data.startDate,
          endDate: data.endDate,
          includeTemplateStats: data.includeTemplateStats,
          includeUsageStats: data.includeUsageStats
        }
      }
    });

    // Set appropriate headers based on format
    const headers = new Headers();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `analytics-export-${timestamp}`;

    switch (data.format) {
      case 'xlsx':
        headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        headers.set('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
        break;
      case 'csv':
        headers.set('Content-Type', 'text/csv');
        headers.set('Content-Disposition', `attachment; filename="${filename}.csv"`);
        break;
      case 'json':
        headers.set('Content-Type', 'application/json');
        headers.set('Content-Disposition', `attachment; filename="${filename}.json"`);
        break;
    }

    return new NextResponse(buffer, { headers });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid export options', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error exporting analytics:', error);
    return NextResponse.json(
      { error: 'Failed to export analytics' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    // Generate the report
    const buffer = await exportAnalytics({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      includeTemplateStats: true,
      includeUsageStats: true,
      format: 'json'
    });

    // Log the export action
    await createAuditLog({
      action: 'TEMPLATE_EXPORT',
      userId: session.user.id,
      entityType: AUDIT_ENTITY_TYPES.TEMPLATE,
      entityId: 'analytics',
      metadata: {
        details: {
          startDate,
          endDate,
          reportType: 'analytics'
        }
      }
    });

    // Return the report
    return new NextResponse(buffer, { headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Analytics export error:', error);
    return NextResponse.json(
      { error: 'Failed to export analytics' },
      { status: 500 }
    );
  }
}
