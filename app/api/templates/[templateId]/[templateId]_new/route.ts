import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(
  request: Request,
  { params }: { params: { templateId: string } }
) {
  try {
    const templatePath = path.join(process.cwd(), "templates", `${params.templateId}.html`);
    const template = await fs.readFile(templatePath, "utf-8");
    
    return new NextResponse(template, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    return new NextResponse("Template not found", { status: 404 });
  }
}
