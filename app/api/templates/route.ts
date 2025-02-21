import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { JobCompetencyAssessmentTemplate } from '@/templates/job-competency-assessment';

// Function to get template data from HTML and TSX files
async function getTemplatesFromFiles() {
  const templatesDir = path.join(process.cwd(), "templates");
  
  try {
    const files = fs.readdirSync(templatesDir);
    
    return files
      .filter(file => file.endsWith(".html") || file.endsWith(".tsx"))
      .map(file => {
        const id = path.basename(file, path.extname(file));
        const title = id
          .split("-")
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
        
        // Get file stats for created/updated dates
        const stats = fs.statSync(path.join(templatesDir, file));
        
        // Determine category based on filename
        let category = "HR Forms";
        if (file.includes("project")) category = "Project Management";
        else if (file.includes("training")) category = "Training & Development";
        else if (file.includes("performance")) category = "Performance Management";
        else if (file.includes("food")) category = "Food Services";
        
        // Generate tags from filename
        const tags = id.split("-").filter(tag => 
          !["form", "template", "v2"].includes(tag.toLowerCase())
        );

        // Determine template type
        const type = file.endsWith(".tsx") ? "COMPONENT" : "HTML";
        
        return {
          id,
          title,
          description: `Professional ${title.toLowerCase()} template for streamlined data collection and management.`,
          category,
          tags,
          type,
          version: file.includes("v2") ? 2 : 1,
          status: "PUBLISHED",
          previewImage: `/previews/${id}.png`,
          active: true,
          createdAt: stats.birthtime.toISOString(),
          updatedAt: stats.mtime.toISOString(),
        };
      });
  } catch (error) {
    console.error("Failed to read templates directory:", error);
    return [];
  }
}

const templates = {
  'job-competency-assessment': {
    id: 'job-competency-assessment',
    name: 'Job Competency Assessment',
    description: 'Form for evaluating employee job competencies and performance',
    component: JobCompetencyAssessmentTemplate,
  },
};

// GET - Fetch all templates with pagination and search
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const templateId = searchParams.get("templateId");

  if (templateId) {
    try {
      // First try to find a TSX template
      const tsxPath = path.join(process.cwd(), "templates", `${templateId}.tsx`);
      if (fs.existsSync(tsxPath)) {
        return NextResponse.json({ 
          id: templateId,
          type: "COMPONENT",
          content: "" // We don't need to send the content for components
        });
      }

      // Then try HTML template
      const htmlPath = path.join(process.cwd(), "templates", `${templateId}.html`);
      if (fs.existsSync(htmlPath)) {
        const content = fs.readFileSync(htmlPath, "utf-8");
        return NextResponse.json({ 
          id: templateId,
          type: "HTML",
          content 
        });
      }

      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    } catch (error) {
      console.error("Failed to read template:", error);
      return NextResponse.json(
        { error: "Failed to read template" },
        { status: 500 }
      );
    }
  }

  // List all templates
  const templatesFromFiles = await getTemplatesFromFiles();
  const allTemplates = [...templatesFromFiles, ...Object.values(templates)];
  return NextResponse.json(allTemplates);
}

// POST - Create new template
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Generate filename from title
    const filename = body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
      
    // Save template file
    const templatesDir = path.join(process.cwd(), "templates");
    
    // Create templates directory if it doesn't exist
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(templatesDir, `${filename}.html`),
      body.content
    );
    
    // Return success response
    return NextResponse.json({
      message: "Template created successfully",
      template: {
        id: filename,
        title: body.title,
        ...body,
      },
    });
  } catch (error) {
    console.error("Failed to create template:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
