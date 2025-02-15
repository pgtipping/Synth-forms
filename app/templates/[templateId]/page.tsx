"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function TemplatePage() {
  const params = useParams();
  const [template, setTemplate] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTemplate() {
      try {
        const response = await fetch(`/api/templates/${params.templateId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();
        setTemplate(html);
      } catch (error) {
        console.error("Failed to load template:", error);
      } finally {
        setLoading(false);
      }
    }

    loadTemplate();
  }, [params.templateId]);

  const handleDownload = async (format: 'html' | 'docx' | 'pdf') => {
    try {
      const response = await fetch(`/api/templates/${params.templateId}/download?format=${format}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
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
    return <div>Loading template...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-end gap-4 mb-4">
        <Button onClick={() => handleDownload('html')} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Download HTML
        </Button>
        <Button onClick={() => handleDownload('docx')} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Download DOCX
        </Button>
        <Button onClick={() => handleDownload('pdf')} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Download PDF
        </Button>
      </div>
      <div className="preview-container border rounded-lg p-6">
        <div dangerouslySetInnerHTML={{ __html: template }} />
      </div>
    </div>
  );
}
