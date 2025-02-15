import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formConversionService } from '@/lib/form-conversion';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import { Prisma } from '@prisma/client';

// Configure upload directory
const UPLOAD_DIR = join(process.cwd(), 'uploads');

// Ensure upload directory exists
mkdir(UPLOAD_DIR, { recursive: true }).catch(console.error);

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const fileType = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'docx', 'xlsx'].includes(fileType || '')) {
      return NextResponse.json(
        { error: 'Unsupported file type' },
        { status: 400 }
      );
    }

    // Create conversion record
    const conversion = await (prisma as any).formConversion.create({
      data: {
        status: 'pending',
        fileType: fileType!,
        originalFile: file.name,
        userId,
        progress: 0
      }
    });

    // Save file
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = join(UPLOAD_DIR, `${conversion.id}.${fileType}`);
    await writeFile(filePath, buffer);

    // Start conversion process
    formConversionService.convertForm(buffer, fileType!, conversion.id)
      .then(async (convertedForm) => {
        // Create template from converted form
        const template = await (prisma as any).template.create({
          data: {
            title: convertedForm.title,
            status: 'DRAFT',
            userId,
            categoryId: 'default', // You may want to make this configurable
            content: { template: JSON.parse(JSON.stringify(convertedForm.sections)) as Prisma.JsonValue },
            sections: {
              create: convertedForm.sections.map((section, index) => ({
                title: section.title,
                content: {
                  fields: section.fields
                },
                order: index
              }))
            }
          }
        });

        // Update conversion record
        await (prisma as any).formConversion.update({
          where: { id: conversion.id },
          data: {
            templateId: template.id,
            convertedForm: convertedForm,
            status: 'completed',
            progress: 100
          }
        });
      })
      .catch(async (error) => {
        await (prisma as any).formConversion.update({
          where: { id: conversion.id },
          data: {
            status: 'failed',
            error: error.message,
            progress: 0
          }
        });
      });

    return NextResponse.json({
      id: conversion.id,
      status: 'pending',
      message: 'Form conversion started'
    });

  } catch (error) {
    console.error('Form conversion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversionId = searchParams.get('id');

    if (!conversionId) {
      return NextResponse.json(
        { error: 'Conversion ID is required' },
        { status: 400 }
      );
    }

    const conversion = await (prisma as any).formConversion.findUnique({
      where: { id: conversionId },
      include: {
        template: true
      }
    });

    if (!conversion) {
      return NextResponse.json(
        { error: 'Conversion not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(conversion);

  } catch (error) {
    console.error('Get conversion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
