import { prisma } from './prisma';
import { Template, User, Category } from '@prisma/client';
import { format } from 'date-fns';
import xlsx from 'xlsx';

interface TemplateWithMetadata extends Template {
  category: Category;
  createdBy: User;
}

interface AnalyticsReport {
  templates: {
    id: string;
    title: string;
    category: string;
    createdBy: string;
    createdAt: string;
    fileType: string | null;
    size: number | null;
    version: number;
  }[];
  users: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    createdAt: string;
  }[];
  summary: {
    totalTemplates: number;
    totalUsers: number;
    averageTemplateSize: number;
    templatesByType: {
      fileType: string;
      count: number;
    }[];
  };
}

interface ExportOptions {
  startDate?: Date;
  endDate?: Date;
  includeTemplateStats?: boolean;
  includeUsageStats?: boolean;
  format: 'xlsx' | 'csv' | 'json';
}

export async function exportAnalytics(options: ExportOptions): Promise<Buffer> {
  const data: any = {};

  if (options.includeTemplateStats) {
    // Fetch template statistics
    const templates = await prisma.template.findMany({
      include: {
        category: true,
        createdBy: true
      },
      where: {
        createdAt: {
          gte: options.startDate,
          lte: options.endDate
        }
      }
    });

    data.templates = templates.map(template => ({
      id: template.id,
      title: template.title,
      category: template.category?.name || 'Uncategorized',
      createdBy: template.createdBy?.name || 'Unknown',
      createdAt: format(template.createdAt, 'yyyy-MM-dd HH:mm:ss'),
      fileType: template.fileType,
      size: template.size,
      version: template.version
    }));
  }

  if (options.includeUsageStats) {
    // Fetch form responses
    const responses = await prisma.formResponse.findMany({
      include: {
        template: {
          select: {
            title: true
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      where: {
        createdAt: {
          gte: options.startDate,
          lte: options.endDate
        }
      }
    });

    data.responses = responses.map(response => ({
      id: response.id,
      templateName: response.template.title,
      userName: response.user.name,
      userEmail: response.user.email,
      createdAt: format(response.createdAt, 'yyyy-MM-dd HH:mm:ss'),
      status: response.status
    }));

    // Calculate daily statistics
    const dailyStats = await prisma.formResponse.groupBy({
      by: ['createdAt'],
      _count: true,
      where: {
        createdAt: {
          gte: options.startDate,
          lte: options.endDate
        }
      }
    });

    data.dailyStats = dailyStats.map(stat => ({
      date: format(stat.createdAt, 'yyyy-MM-dd'),
      responseCount: stat._count
    }));
  }

  // Format the data based on the requested format
  switch (options.format) {
    case 'xlsx': {
      const workbook = xlsx.utils.book_new();
      
      if (data.templates) {
        const templateSheet = xlsx.utils.json_to_sheet(data.templates);
        xlsx.utils.book_append_sheet(workbook, templateSheet, 'Templates');
      }
      
      if (data.responses) {
        const responseSheet = xlsx.utils.json_to_sheet(data.responses);
        xlsx.utils.book_append_sheet(workbook, responseSheet, 'Form Responses');
        
        const statsSheet = xlsx.utils.json_to_sheet(data.dailyStats);
        xlsx.utils.book_append_sheet(workbook, statsSheet, 'Daily Statistics');
      }
      
      return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    }
    
    case 'csv': {
      // Convert the first available data to CSV
      const csvData = data.templates || data.responses || data.dailyStats;
      if (!csvData) throw new Error('No data to export');
      
      const sheet = xlsx.utils.json_to_sheet(csvData);
      const csv = xlsx.utils.sheet_to_csv(sheet);
      return Buffer.from(csv);
    }
    
    case 'json':
    default:
      return Buffer.from(JSON.stringify(data, null, 2));
  }
}

export async function generateAnalyticsReport(startDate: Date, endDate: Date): Promise<AnalyticsReport> {
  // Get templates with metadata
  const templates = await prisma.template.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      category: true,
      createdBy: true
    }
  });

  // Get users
  const users = await prisma.user.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }
  });

  // Calculate template statistics
  const templatesByType = templates.reduce((acc, template) => {
    const fileType = template.fileType || 'unknown';
    acc[fileType] = (acc[fileType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalSize = templates.reduce((sum, template) => sum + (template.size || 0), 0);
  const averageSize = templates.length > 0 ? totalSize / templates.length : 0;

  return {
    templates: templates.map(template => ({
      id: template.id,
      title: template.title,
      category: template.category?.name || 'Uncategorized',
      createdBy: template.createdBy?.name || 'Unknown',
      createdAt: template.createdAt.toISOString(),
      fileType: template.fileType,
      size: template.size,
      version: template.version
    })),
    users: users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString()
    })),
    summary: {
      totalTemplates: templates.length,
      totalUsers: users.length,
      averageTemplateSize: averageSize,
      templatesByType: Object.entries(templatesByType).map(([fileType, count]) => ({
        fileType,
        count
      }))
    }
  };
}
