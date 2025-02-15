import { DocumentConverter, ConversionOptions, ConversionResult } from './types';
import { LocalDocumentConverter } from './local-converter';
import { LocalFormConverter } from './local-form-converter';
import { PDFConverter } from './pdf-converter';
import { OfficeConverter } from './office-converter';

export class ConverterFactory {
  private static instance: ConverterFactory;
  private converters: DocumentConverter[] = [];

  private constructor() {
    // Register available converters
    this.converters = [
      new LocalFormConverter(),
      new LocalDocumentConverter(),
      new PDFConverter(),
      new OfficeConverter(),
    ];
  }

  public static getInstance(): ConverterFactory {
    if (!ConverterFactory.instance) {
      ConverterFactory.instance = new ConverterFactory();
    }
    return ConverterFactory.instance;
  }

  public getConverter(fileType: string): DocumentConverter | null {
    return this.converters.find(converter => converter.supports(fileType)) || null;
  }

  public async convert(filePath: string, options?: ConversionOptions): Promise<ConversionResult> {
    const fileType = filePath.split('.').pop()?.toLowerCase() || '';
    const converter = this.getConverter(fileType);

    if (!converter) {
      return {
        success: false,
        error: `No converter available for file type: ${fileType}`
      };
    }

    try {
      return await converter.convert(filePath, options);
    } catch (error) {
      return {
        success: false,
        error: `Conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  public async cleanup(): Promise<void> {
    await Promise.all(
      this.converters
        .filter(converter => converter.cleanup)
        .map(converter => converter.cleanup?.())
    );
  }
}
