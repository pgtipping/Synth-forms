export interface ConversionResult {
  success: boolean;
  content?: {
    text: string;
    fields: Array<{
      name: string;
      type: string;
      value: string;
      confidence?: number;
      metadata?: Record<string, any>;
    }>;
  };
  error?: string;
  path?: string;
  isTemporary?: boolean;
}

export interface ConversionOptions {
  outputFormat?: 'pdf' | 'png' | 'html';
  deleteOriginal?: boolean;
  watermarkCheck?: boolean;
  preserveLayout?: boolean;
  ocrEnabled?: boolean;
  metadata?: Record<string, any>;
}

export interface DocumentConverter {
  convert(filePath: string, options?: ConversionOptions): Promise<ConversionResult>;
  supports(fileType: string): boolean;
  cleanup?(): Promise<void>;
}
