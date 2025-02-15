import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { LocalDocumentConverter } from "@/lib/converters/local-document-converter";

export async function GET(
  request: Request,
  { params }: { params: { templateId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'html';
    
    // Get the template HTML
    const templatePath = path.join(process.cwd(), "templates", `${params.templateId}.html`);
    const template = await fs.readFile(templatePath, "utf-8");
    
    // If HTML requested, return as is
    if (format === 'html') {
      return new NextResponse(template, {
        headers: {
          "Content-Type": "text/html",
          "Content-Disposition": `attachment; filename=${params.templateId}.html`
        },
      });
    }
    
    // For other formats, convert using LocalDocumentConverter
    const converter = new LocalDocumentConverter();
    const tempPath = path.join(process.cwd(), "temp", `${params.templateId}.html`);
    await fs.writeFile(tempPath, template);
    
    const result = await converter.convert(tempPath, {
      outputFormat: format as 'pdf' | 'docx',
      preserveFormatting: true
    });
    
    // Clean up temp file
    await fs.unlink(tempPath);
    
    if (!result.success) {
      throw new Error(result.error || 'Conversion failed');
    }
    
    const contentType = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    
    return new NextResponse(result.data, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename=${params.templateId}.${format}`
      },
    });
  } catch (error) {
    console.error("Failed to download template:", error);
    return new NextResponse("Failed to download template", { status: 500 });
  }
}
