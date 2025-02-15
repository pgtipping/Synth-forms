import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateSlug, validateCategoryOperation } from "@/lib/categoryUtils";
import { CreateCategoryInput, CategoryMetadata } from "@/types/category";
import { requireAdmin } from "@/lib/auth";
import { Prisma } from "@prisma/client";

// GET /api/categories
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
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

    // Add computed slug to each category
    const categoriesWithSlug = categories.map((category) => ({
      ...category,
      slug: generateSlug(category.name),
    }));

    return NextResponse.json(categoriesWithSlug);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST /api/categories
export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    const authResult = await requireAdmin(request);
    if ("status" in authResult) {
      return authResult;
    }

    const data: CreateCategoryInput = await request.json();

    // Validate input
    if (!data.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Check for existing category with same name
    const existing = await prisma.category.findFirst({
      where: { name: data.name },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Category with this name already exists" },
        { status: 400 }
      );
    }

    // Validate parent if specified
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
    }

    // Convert metadata to Prisma JSON input
    const metadata: Prisma.InputJsonValue | undefined = data.metadata
      ? JSON.parse(JSON.stringify(data.metadata))
      : undefined;

    // Create category
    const category = await prisma.category.create({
      data: {
        name: data.name,
        description: data.description,
        parentId: data.parentId,
        metadata,
        order: data.order || 0,
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
      },
    });

    // Add computed slug
    const categoryWithSlug = {
      ...category,
      slug: generateSlug(category.name),
    };

    return NextResponse.json(categoryWithSlug, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
