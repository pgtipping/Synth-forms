import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import {
  validateField,
  processDependencies,
  validateFileUpload,
} from "../../../../lib/utils";
import { Validator, ValidationError } from "../../../../lib/validation";
import { FormField } from "../../../../types/template";
import { getSession } from "../../../../lib/auth";
import { createAuditLog } from "../../../../lib/auditLog";
import { Prisma } from "@prisma/client";
import { rateLimit, rateLimitConfigs } from "../../../../lib/rateLimit";

interface SessionData {
  userId: string;
  role: "ADMIN" | "USER";
  expires?: Date;
}

// POST - Process form submission with file uploads
export async function POST(request: Request) {
  try {
    const session = (await getSession()) as SessionData | null;
    if (!session?.userId) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    // Apply rate limiting
    const rateLimitResult = rateLimit(
      request.headers.get("x-forwarded-for") || "unknown",
      "formSubmission",
      rateLimitConfigs.formSubmission
    );

    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Handle multipart form data
    const formDataRaw = await request.formData();
    const templateId = formDataRaw.get("templateId") as string;
    const formDataJson = formDataRaw.get("formData") as string;

    if (!templateId || !formDataJson) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let formData: Record<string, any>;
    try {
      formData = JSON.parse(formDataJson);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid form data format" },
        { status: 400 }
      );
    }

    // Process file uploads
    const fileFields = formDataRaw.getAll("files") as File[];
    const fileData: Record<
      string,
      { url: string; name: string; size: number; type: string }
    > = {};

    for (const file of fileFields) {
      const fieldName = file.name;
      const fileError = validateFileUpload(file);
      if (fileError) {
        return NextResponse.json(
          {
            error: "File validation failed",
            field: fieldName,
            details: fileError,
          },
          { status: 400 }
        );
      }

      // Here you would typically upload the file to your storage service
      // For now, we'll just store metadata
      fileData[fieldName] = {
        url: `placeholder-url/${file.name}`, // Replace with actual upload logic
        name: file.name,
        size: file.size,
        type: file.type,
      };
    }

    // Merge file data with form data
    formData = {
      ...formData,
      files: fileData,
    };

    // Validate required fields
    if (!templateId || !formData) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get template definition with proper typing
    const template = await prisma.template.findUnique({
      where: { id: templateId },
      select: {
        formDefinition: true,
        version: true,
        status: true,
      },
    });

    if (!template || !template.formDefinition) {
      return NextResponse.json(
        { error: "Template not found or invalid" },
        { status: 404 }
      );
    }

    if (template.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "Cannot submit to unpublished template" },
        { status: 400 }
      );
    }

    // Type guard for formDefinition
    function isFormDefinition(obj: any): obj is {
      fields: FormField[];
      layout?: {
        sections: {
          id: string;
          title: string;
          fields: string[];
        }[];
      };
    } {
      return obj && Array.isArray(obj.fields);
    }

    if (!isFormDefinition(template.formDefinition)) {
      return NextResponse.json(
        { error: "Invalid form definition structure" },
        { status: 400 }
      );
    }

    const formDefinition = template.formDefinition;

    // Process field dependencies
    const fields = processDependencies(formDefinition.fields, formData);

    // Validate all fields
    const errors: Record<string, string> = {};
    fields.forEach((field) => {
      if (!field.hidden) {
        // Skip validation for hidden fields
        const value = formData[field.id];
        const error = validateField(field, value, formData);
        if (error) {
          errors[field.id] = error;
        }
      }
    });

    // Return validation errors if any
    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        {
          error: "Validation failed",
          errors,
          valid: false,
        },
        { status: 400 }
      );
    }

    // Prepare form response data
    const formResponseData = {
      templateId,
      data: formData as Prisma.InputJsonValue,
      status: "PENDING_REVIEW" as const,
      userId: session.userId,
      templateVersion: template.version,
      metadata: {
        submittedAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    };

    // Validate form response data
    Validator.validateFormResponse(formResponseData);

    // Create form submission record
    const submission = await prisma.formResponse.create({
      data: formResponseData,
    });

    // Get full user data for audit log
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        organization: true,
        preferences: true,
        usage: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create audit log entry with file information
    await createAuditLog({
      action: "FORM_SUBMISSION",
      entityType: "form_response",
      entityId: submission.id,
      user,
      metadata: {
        templateId,
        templateVersion: template.version,
        status: "PENDING_REVIEW",
        fileUploads:
          Object.keys(fileData).length > 0
            ? {
                count: Object.keys(fileData).length,
                totalSize: Object.values(fileData).reduce(
                  (acc, file) => acc + file.size,
                  0
                ),
                types: [
                  ...new Set(Object.values(fileData).map((file) => file.type)),
                ],
              }
            : undefined,
      },
    });

    return NextResponse.json(
      {
        ...submission,
        valid: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Form submission error:", error);

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process form submission" },
      { status: 500 }
    );
  }
}

// GET - Fetch form submissions
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get("templateId");

    const submissions = await prisma.formResponse.findMany({
      where: templateId ? { templateId } : undefined,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(submissions);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch form submissions" },
      { status: 500 }
    );
  }
}
