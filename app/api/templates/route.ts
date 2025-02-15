import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Function to get template data from HTML files
async function getTemplatesFromFiles() {
  const templatesDir = path.join(process.cwd(), "app/templates");
  
  try {
    const files = fs.readdirSync(templatesDir);
    
    return files
      .filter(file => file.endsWith(".html"))
      .map(file => {
        const id = path.basename(file, ".html");
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
        
        // Generate tags from filename
        const tags = id.split("-").filter(tag => 
          !["form", "template", "v2"].includes(tag.toLowerCase())
        );
        
        return {
          id,
          title,
          description: `Professional ${title.toLowerCase()} template for streamlined data collection and management.`,
          category,
          tags,
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

// GET - Fetch all templates with pagination and search
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const category = searchParams.get("category");
    const query = searchParams.get("query")?.toLowerCase();

    // Get templates from files
    const templates = await getTemplatesFromFiles();
    
    // Filter templates
    let filteredTemplates = templates;
    
    if (category) {
      filteredTemplates = filteredTemplates.filter(
        (template) => template.category === category
      );
    }

    if (query) {
      filteredTemplates = filteredTemplates.filter(
        (template) =>
          template.title.toLowerCase().includes(query) ||
          template.description.toLowerCase().includes(query) ||
          template.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Calculate pagination
    const total = filteredTemplates.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedTemplates = filteredTemplates.slice(start, end);

    return NextResponse.json({
      templates: paginatedTemplates,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        perPage: limit,
      },
    });
  } catch (error) {
    console.error("Failed to fetch templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
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
    const templatesDir = path.join(process.cwd(), "app/templates");
    
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
