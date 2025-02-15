import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Prisma } from '@prisma/client';

interface AnalyticsResponse {
  totalTemplates: number;
  averageSize: number;
  templatesByType: {
    fileType: string;
    count: number;
  }[];
  activeUsers: number;
  recentActivity: {
    action: string;
    timestamp: string;
    user: string;
  }[];
}

export async function GET(req: NextRequest): Promise<NextResponse<AnalyticsResponse>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({
        totalTemplates: 0,
        averageSize: 0,
        templatesByType: [],
        activeUsers: 0,
        recentActivity: []
      }, { status: 401 });
    }

    // Get total templates
    const totalTemplates = await prisma.template.count();

    // Get templates by type using status field instead since fileType isn't in schema
    const templatesByStatus = await prisma.template.groupBy({
      by: [Prisma.TemplateScalarFieldEnum.status],
      _count: {
        _all: true
      }
    });

    // Get average template version as a proxy for size
    const averageVersionResult = await prisma.template.aggregate({
      _avg: {
        version: true
      }
    });

    // Get active users count (using active field from Template model)
    const activeUsers = await prisma.user.count({
      where: {
        templates: {
          some: {
            active: true
          }
        }
      }
    });

    // Get recent activity
    const recentActivity = await prisma.auditLog.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: true
      }
    });

    const response: AnalyticsResponse = {
      totalTemplates,
      averageSize: averageVersionResult._avg?.version || 0,
      templatesByType: templatesByStatus.map(t => ({
        fileType: t.status.toLowerCase(),
        count: t._count._all
      })),
      activeUsers,
      recentActivity: recentActivity.map(log => ({
        action: log.action,
        timestamp: log.createdAt.toISOString(),
        user: log.user?.name || 'System'
      }))
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({
      totalTemplates: 0,
      averageSize: 0,
      templatesByType: [],
      activeUsers: 0,
      recentActivity: []
    }, { status: 500 });
  }
}
