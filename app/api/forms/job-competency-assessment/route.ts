import { NextResponse } from 'next/server';
import { z } from 'zod';

// Import the schema from the template
import { jobCompetencySchema } from '@/templates/job-competency-assessment';

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validate the incoming data against our schema
    const validatedData = jobCompetencySchema.parse(data);

    // Here you would typically:
    // 1. Save to database
    // 2. Send notifications
    // 3. Generate PDF
    // 4. etc.

    // For now, we'll just return success
    return NextResponse.json({
      success: true,
      message: 'Form submitted successfully',
      data: validatedData,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while processing the form',
      },
      { status: 500 }
    );
  }
}
