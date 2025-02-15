import { NextResponse } from 'next/server';
import { FileWatcher } from '@/lib/file-watcher';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import config from '@/config/conversion-rules';

let watcher: FileWatcher | null = null;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get watcher status from database
    const status = await prisma.systemStatus.findFirst({
      where: {}
    });

    return NextResponse.json({
      status: status?.status || 'STOPPED',
      lastUpdate: status?.updatedAt
    });
  } catch (error) {
    console.error('Error getting watcher status:', error);
    return NextResponse.json(
      { error: 'Failed to get watcher status' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await request.json();

    if (action === 'start') {
      if (!watcher) {
        watcher = new FileWatcher(config.directories[0]);
        await watcher.start();

        // Update status in database
        await prisma.systemStatus.upsert({
          where: {
            id: 'FILE_WATCHER'
          },
          create: {
            type: 'FILE_WATCHER',
            status: 'RUNNING',
            message: 'File watcher started successfully'
          },
          update: {
            status: 'RUNNING',
            message: 'File watcher started successfully'
          }
        });

        return NextResponse.json({
          status: 'RUNNING',
          message: 'File watcher started successfully'
        });
      }
      return NextResponse.json({
        status: 'RUNNING',
        message: 'File watcher is already running'
      });
    }

    if (action === 'stop') {
      if (watcher) {
        await watcher.stop();
        watcher = null;

        // Update status in database
        await prisma.systemStatus.upsert({
          where: {
            id: 'FILE_WATCHER'
          },
          create: {
            type: 'FILE_WATCHER',
            status: 'STOPPED',
            message: 'File watcher stopped successfully'
          },
          update: {
            status: 'STOPPED',
            message: 'File watcher stopped successfully'
          }
        });

        return NextResponse.json({
          status: 'STOPPED',
          message: 'File watcher stopped successfully'
        });
      }
      return NextResponse.json({
        status: 'STOPPED',
        message: 'File watcher is already stopped'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error controlling watcher:', error);
    return NextResponse.json(
      { error: 'Failed to control watcher' },
      { status: 500 }
    );
  }
}
