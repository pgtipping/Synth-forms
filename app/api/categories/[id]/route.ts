import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateSlug, validateCategoryOperation } from "@/lib/categoryUtils";
import { UpdateCategoryInput } from "@/types/category";
import { requireAdmin } from "@/lib/auth";
import { Prisma } from "@prisma/client";

// GET /api/categories/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const category = await prisma.category.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        description: true,
        parentId: true,
        order: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
          },
        },
        templates: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Add computed slug
    return NextResponse.json({
      ...category,
      slug: generateSlug(category.name),
    });
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { error: "Failed to fetch category" },
      { status: 500 }
    );
  }
}

// PUT /api/categories/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const authResult = await requireAdmin(request);
    if ("status" in authResult) {
      return authResult as NextResponse;
    }

    const data: UpdateCategoryInput = await request.json();

    // Validate input
    if (
      !data.name &&
      !data.description &&
      !data.parentId &&
      !data.metadata &&
      data.order === undefined
    ) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Check if category exists
    const existing = await prisma.category.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // If updating name, check for duplicates
    if (data.name) {
      const nameExists = await prisma.category.findFirst({
        where: {
          name: data.name,
          id: { not: params.id },
        },
      });

      if (nameExists) {
        return NextResponse.json(
          { error: "Category with this name already exists" },
          { status: 400 }
        );
      }
    }

    // If updating parent, validate it
    if (data.parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: data.parentId },
      });

      if (!parent) {
        return NextResponse.json(
          { error: "Parent category not found" },
          { status: 400 }
        );
      }

      // Check for circular reference
      const validation = validateCategoryOperation([existing, parent], {
        type: "update",
        categoryId: params.id,
        parentId: data.parentId,
      });

      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error || "Invalid operation" },
          { status: 400 }
        );
      }
    }

    // Convert metadata to Prisma JSON input
    const metadata: Prisma.InputJsonValue | undefined = data.metadata
      ? JSON.parse(JSON.stringify(data.metadata))
      : undefined;

    // Update category
    const category = await prisma.category.update({
      where: { id: params.id },
      data: {
        name: data.name,
        description: data.description,
        parentId: data.parentId,
        metadata,
        order: data.order,
      },
      select: {
        id: true,
        name: true,
        description: true,
        parentId: true,
        order: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
          },
        },
        templates: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Add computed slug
    return NextResponse.json({
      ...category,
      slug: generateSlug(category.name),
    });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const authResult = await requireAdmin(request);
    if ("status" in authResult) {
      return authResult as NextResponse;
    }

    // Check if category exists and has templates
    const category = await prisma.category.findUnique({
      where: { id: params.id },
      select: {
        templates: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Check if category has templates
    if (category.templates.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete category with existing templates" },
        { status: 400 }
      );
    }

    // Delete category
    await prisma.category.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 }
        );
      }
    }

    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
