import { NextResponse, NextRequest } from "next/server";
import prisma from "../../../../../lib/prisma";
import { requireAuth } from "../../../../../lib/auth";
import { Validator } from "../../../../../lib/validation";
import { createAuditLog, AuditLogAction } from "../../../../../lib/auditLog";

// GET - Fetch single customization with auth
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    // Get full user data
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

    // Fetch customization with template info
    const customization = await prisma.customization.findUnique({
      include: {
        template: {
          select: {
            title: true,
            version: true,
          },
        },
      },
      where: { id: params.id },
    });

    if (!customization) {
      return NextResponse.json(
        { error: "Customization not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(customization);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch customization" },
      { status: 500 }
    );
  }
}

// PUT - Update customization with validation and auth
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    // Get full user data
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

    const updateData = await request.json();

    // Validate customization data
    Validator.validateCustomization({
      ...updateData,
      templateId: params.id,
      userId: session.userId,
    });

    // Check ownership
    const existingCustomization = await prisma.customization.findUnique({
      where: { id: params.id },
    });

    if (!existingCustomization) {
      return NextResponse.json(
        { error: "Customization not found" },
        { status: 404 }
      );
    }

    if (existingCustomization.userId !== session.userId) {
      return NextResponse.json(
        { error: "Not authorized to modify this customization" },
        { status: 403 }
      );
    }

    const updatedCustomization = await prisma.customization.update({
      include: {
        template: {
          select: {
            title: true,
            version: true,
          },
        },
      },
      where: { id: params.id },
      data: {
        branding: updateData.branding,
        fieldCustomizations: updateData.fieldCustomizations,
        typography: updateData.typography,
        lastUsed: new Date(),
      },
    });

    return NextResponse.json(updatedCustomization);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update customization" },
      { status: 500 }
    );
  }
}

// DELETE - Remove customization with auth
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    // Get full user data
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

    // Check ownership
    const customization = await prisma.customization.findUnique({
      where: { id: params.id },
    });

    if (!customization) {
      return NextResponse.json(
        { error: "Customization not found" },
        { status: 404 }
      );
    }

    if (customization.userId !== session.userId) {
      return NextResponse.json(
        { error: "Not authorized to delete this customization" },
        { status: 403 }
      );
    }

    await prisma.customization.delete({
      where: { id: params.id },
    });

    // Create audit log for deletion
    await createAuditLog({
      action: "DELETE" as AuditLogAction,
      entityType: "CUSTOMIZATION",
      entityId: params.id,
      user: user,
      metadata: {
        templateId: customization.templateId,
      },
    });

    return NextResponse.json(
      { message: "Customization deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete customization" },
      { status: 500 }
    );
  }
}
