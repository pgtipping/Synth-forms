import { NextResponse } from 'next/server';
import { TemplateDeduplicate } from '@/lib/template-deduplication';
import path from 'path';
import { promises as fs } from 'fs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deduplicator = new TemplateDeduplicate();
    const templatesDir = path.join(process.cwd(), 'templates');
    const duplicates = await deduplicator.findDuplicates(templatesDir);
    
    // Generate report
    const report = await deduplicator.generateReport(duplicates);
    
    return NextResponse.json({
      duplicateGroups: duplicates,
      report
    });
  } catch (error) {
    console.error('Error in deduplication:', error);
    return NextResponse.json(
      { error: 'Failed to process templates' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deduplicator = new TemplateDeduplicate();
    const templatesDir = path.join(process.cwd(), 'templates');
    
    // Find duplicates
    const duplicates = await deduplicator.findDuplicates(templatesDir);
    
    // Clean up duplicates
    await deduplicator.cleanupDuplicates(duplicates);
    
    // Generate final report
    const report = await deduplicator.generateReport(duplicates);
    
    // Save report to file
    const reportsDir = path.join(process.cwd(), 'reports');
    await fs.mkdir(reportsDir, { recursive: true });
    
    const reportPath = path.join(
      reportsDir,
      `deduplication-${new Date().toISOString().replace(/:/g, '-')}.md`
    );
    
    await fs.writeFile(reportPath, report);
    
    return NextResponse.json({
      success: true,
      message: 'Deduplication completed successfully',
      reportPath
    });
  } catch (error) {
    console.error('Error in deduplication cleanup:', error);
    return NextResponse.json(
      { error: 'Failed to clean up duplicates' },
      { status: 500 }
    );
  }
}
