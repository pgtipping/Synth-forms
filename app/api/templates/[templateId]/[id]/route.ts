import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { Validator, ValidationError } from "../../../../lib/validation";
import { Prisma } from "@prisma/client";

type VersionHistoryEntry = {
  version: number;
  changedAt: string;
  changes: string[];
  migratedFrom?: number;
};

// GET - Fetch single template with version history
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const template = await prisma.template.findUnique({
      where: { id: params.id },
      include: {
        childVersions: {
          select: {
            id: true,
            version: true,
            status: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("Failed to fetch template:", error);
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    );
  }
}

// PUT - Update template with validation and version tracking
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Process and validate template data
    const processedData = Validator.processTemplateData(body);

    // Get current template
    const currentTemplate = await prisma.template.findUnique({
      where: { id: params.id },
    });

    if (!currentTemplate) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Parse and update version history
    const currentHistory =
      (currentTemplate.versionHistory as VersionHistoryEntry[] | null) || [];
    const newHistory = [
      ...currentHistory,
      {
        version: currentTemplate.version,
        changedAt: new Date().toISOString(),
        changes: ["Updated template content"],
      },
    ];

    // Convert form fields to JSON-compatible structure
    const formDefinitionJson = processedData.formDefinition
      ? {
          fields: processedData.formDefinition.fields.map((field) => ({
            id: field.id,
            name: field.name,
            label: field.label,
            type: field.type,
            required: field.required,
            validationRules: field.validationRules,
            dependencies: field.dependencies,
            defaultValue: field.defaultValue,
            placeholder: field.placeholder,
            options: field.options,
          })),
          layout: processedData.formDefinition.layout,
        }
      : undefined;

    // Prepare update data with proper JSON typing
    const updateData: Prisma.TemplateUpdateInput = {
      title: processedData.title,
      description: processedData.description,
      category: processedData.category,
      tags: processedData.tags,
      content: processedData.content as Prisma.InputJsonValue,
      metadata: processedData.metadata as Prisma.InputJsonValue,
      formDefinition: formDefinitionJson as Prisma.InputJsonValue,
      customizableAreas:
        processedData.customizableAreas as Prisma.InputJsonValue,
      status: processedData.status,
      versionHistory: newHistory as Prisma.InputJsonValue,
      updatedAt: new Date(),
    };

    // Update the template
    const updatedTemplate = await prisma.template.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(updatedTemplate);
  } catch (error) {
    console.error("Failed to update template:", error);

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

// DELETE - Remove template with validation
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if template exists and has no child versions
    const template = await prisma.template.findUnique({
      where: { id: params.id },
      include: {
        childVersions: {
          select: { id: true },
        },
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    if (template.childVersions.length > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete template with child versions",
          childVersions: template.childVersions,
        },
        { status: 400 }
      );
    }

    // Delete the template
    await prisma.template.delete({
      where: { id: params.id },
    });

    return NextResponse.json(
      { message: "Template deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to delete template:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
