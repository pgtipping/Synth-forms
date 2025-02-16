"use client";

import React from "react";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { FoodTastingEvaluationTemplate } from "@/templates/food-tasting-evaluation";

interface Template {
  content: string;
  type: "HTML" | "COMPONENT";
  id: string;
}

type TemplateId = "food-tasting-evaluation";

const TEMPLATE_COMPONENTS: Record<TemplateId, React.ComponentType> = {
  "food-tasting-evaluation": FoodTastingEvaluationTemplate,
  // Add other templates here as we create them
};

export default function TemplatePage() {
  const params = useParams();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTemplate() {
      if (!params.templateId || typeof params.templateId !== "string") {
        setError("Invalid template ID");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/templates?templateId=${params.templateId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Template = await response.json();
        setTemplate(data);
      } catch (error) {
        console.error("Failed to load template:", error);
        setError(error instanceof Error ? error.message : "Failed to load template");
      } finally {
        setLoading(false);
      }
    }

    void loadTemplate();
  }, [params.templateId]);

  const handleDownload = async (format: "html" | "docx" | "pdf") => {
    if (!params.templateId || typeof params.templateId !== "string") {
      console.error("Invalid template ID");
      return;
    }

    try {
      const response = await fetch(`/api/templates/${params.templateId}/download?format=${format}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `template.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error(`Failed to download template as ${format}:`, error);
    }
  };

  if (loading) {
    return <div className="p-6">Loading template...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">Error: {error}</div>;
  }

  if (!template) {
    return <div className="p-6">Template not found</div>;
  }

  // Get the component for this template
  const TemplateComponent = template.type === "COMPONENT" && template.id in TEMPLATE_COMPONENTS
    ? TEMPLATE_COMPONENTS[template.id as TemplateId]
    : null;

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-end space-x-4 mb-6">
        <Button onClick={() => handleDownload("html")} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Download HTML
        </Button>
        <Button onClick={() => handleDownload("docx")} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Download DOCX
        </Button>
        <Button onClick={() => handleDownload("pdf")} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Download PDF
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        {template.type === "HTML" ? (
          <div dangerouslySetInnerHTML={{ __html: template.content }} />
        ) : TemplateComponent ? (
          <div className="form-preview">
            <TemplateComponent />
          </div>
        ) : (
          <div>Template component not found</div>
        )}
      </div>
    </div>
  );
}
