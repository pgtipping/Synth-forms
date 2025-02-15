import { NextResponse, NextRequest } from "next/server";
import prisma from "../../../../lib/prisma";
import { requireAuth } from "../../../../lib/auth";
import { createAuditLog, AuditLogAction } from "../../../../lib/auditLog";

// POST - Create new customization
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    // Get full user data from Prisma
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

    const customizationData = await request.json();

    // Validate required fields
    if (!customizationData.templateId) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      );
    }

    // Validate customization data structure
    if (!customizationData.branding || !customizationData.fieldCustomizations) {
      return NextResponse.json(
        { error: "Invalid customization data structure" },
        { status: 400 }
      );
    }

    const customization = await prisma.customization.create({
      data: {
        templateId: customizationData.templateId,
        userId: session.userId,
        branding: customizationData.branding,
        fieldCustomizations: customizationData.fieldCustomizations,
        typography: customizationData.typography,
        lastUsed: new Date(),
      },
    });

    // Create audit log
    await createAuditLog({
      action: "CREATE" as AuditLogAction,
      entityType: "CUSTOMIZATION",
      entityId: customization.id,
      user: user,
      metadata: {
        templateId: customization.templateId,
        fieldsModified: Object.keys(customizationData.fieldCustomizations)
          .length,
      },
    });

    return NextResponse.json(customization, { status: 201 });
  } catch (error) {
    console.error("Customization creation error:", error);
    return NextResponse.json(
      { error: "Failed to create customization" },
      { status: 500 }
    );
  }
}

// GET - Fetch customizations
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    // Get full user data from Prisma
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

    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get("templateId");

    const customizations = await prisma.customization.findMany({
      where: {
        templateId: templateId || undefined,
        userId: session.userId, // Only fetch customizations for authenticated user
      },
      orderBy: { lastUsed: "desc" },
      include: {
        template: {
          select: {
            title: true,
            version: true,
          },
        },
      },
    });

    // Create audit log
    await createAuditLog({
      action: "READ" as AuditLogAction,
      entityType: "CUSTOMIZATION",
      entityId: templateId || "ALL",
      user: user,
      metadata: {
        count: customizations.length,
      },
    });

    return NextResponse.json(customizations);
  } catch (error) {
    console.error("Customization fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customizations" },
      { status: 500 }
    );
  }
}
