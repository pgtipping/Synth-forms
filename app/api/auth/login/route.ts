import { withAudit } from "@/middleware/withAudit";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

type UserPreferences = {
  auth?: {
    password: string;
  };
};

async function loginHandler(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Check if already authenticated
    const session = await getServerSession(authOptions);
    if (session) {
      return NextResponse.json(
        { error: "Already authenticated" },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        preferences: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const preferences = user.preferences as UserPreferences;
    const storedPassword = preferences?.auth?.password;

    if (!storedPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, storedPassword);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}

export const POST = withAudit(loginHandler, "LOGIN");
