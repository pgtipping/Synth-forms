import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const sectionSchema = z.object({
  title: z.string().min(1),
  content: z.record(z.any()),
  order: z.number().int().min(0)
});

const reorderSchema = z.object({
  sections: z.array(z.object({
    id: z.string(),
    order: z.number().int().min(0)
  }))
});

export async function GET(
  request: Request,
  { params }: { params: { templateId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sections = await prisma.templateSection.findMany({
      where: { templateId: params.templateId },
      orderBy: { order: 'asc' }
    });

    return NextResponse.json(sections);
  } catch (error) {
    console.error('Error fetching sections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sections' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { templateId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await request.json();
    const data = sectionSchema.parse(json);

    const section = await prisma.templateSection.create({
      data: {
        ...data,
        templateId: params.templateId
      }
    });

    return NextResponse.json(section);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid section data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating section:', error);
    return NextResponse.json(
      { error: 'Failed to create section' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { templateId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await request.json();
    const { sections } = reorderSchema.parse(json);

    // Use a transaction to update all sections atomically
    await prisma.$transaction(
      sections.map(({ id, order }) =>
        prisma.templateSection.update({
          where: { id },
          data: { order }
        })
      )
    );

    // Fetch and return updated sections
    const updatedSections = await prisma.templateSection.findMany({
      where: { templateId: params.templateId },
      orderBy: { order: 'asc' }
    });

    return NextResponse.json(updatedSections);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid reorder data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error reordering sections:', error);
    return NextResponse.json(
      { error: 'Failed to reorder sections' },
      { status: 500 }
    );
  }
}
