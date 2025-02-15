import { AzureKeyCredential, DocumentAnalysisClient } from "@azure/ai-form-recognizer";
import pdfParse from 'pdf-parse';
import { promises as fs } from 'fs';

interface PDFConversionResult {
  success: boolean;
  content?: {
    text: string;
    fields: Array<{
      name: string;
      type: string;
      value?: string;
      bounds?: {
        x: number;
        y: number;
        height: number;
        width: number;
      };
    }>;
  };
  error?: string;
}

export async function convertPDF(filePath: string): Promise<PDFConversionResult> {
  try {
    // Read the PDF file
    const dataBuffer = await fs.readFile(filePath);
    
    // First, extract text using pdf-parse
    const pdfData = await pdfParse(dataBuffer);
    
    // Initialize Azure Form Recognizer client
    // Note: These should be in environment variables
    const endpoint = process.env.AZURE_FORM_RECOGNIZER_ENDPOINT || "";
    const apiKey = process.env.AZURE_FORM_RECOGNIZER_KEY || "";
    
    if (!endpoint || !apiKey) {
      return {
        success: false,
        error: "Azure Form Recognizer credentials not configured"
      };
    }

    const client = new DocumentAnalysisClient(
      endpoint,
      new AzureKeyCredential(apiKey)
    );

    // Analyze the document
    const poller = await client.beginAnalyzeDocument(
      "prebuilt-document",
      dataBuffer
    );
    
    const result = await poller.pollUntilDone();

    // Extract form fields
    const fields = (result as any).fields as any[];
    const extractedData = fields?.map((field: any) => ({
      name: field.name || 'unnamed_field',
      type: field.type || 'text', // Default to text type if not specified
      value: field.value?.toString(),
      bounds: field.bounds ? {
        x: field.bounds.x || 0,
        y: field.bounds.y || 0,
        height: field.bounds.height || 0,
        width: field.bounds.width || 0
      } : undefined
    })) || [];

    return {
      success: true,
      content: {
        text: pdfData.text,
        fields: extractedData
      }
    };

  } catch (error) {
    console.error('PDF conversion error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during PDF conversion'
    };
  }
}
