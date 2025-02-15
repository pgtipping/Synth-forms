import { LocalDocumentConverter } from './local-converter';
import { LocalFormConverter } from './local-form-converter';
import { PDFConverter } from './pdf-converter';
import { OfficeConverter } from './office-converter';
export class ConverterFactory {
    constructor() {
        this.converters = [];
        // Register available converters
        this.converters = [
            new LocalFormConverter(),
            new LocalDocumentConverter(),
            new PDFConverter(),
            new OfficeConverter(),
        ];
    }
    static getInstance() {
        if (!ConverterFactory.instance) {
            ConverterFactory.instance = new ConverterFactory();
        }
        return ConverterFactory.instance;
    }
    getConverter(fileType) {
        return this.converters.find(converter => converter.supports(fileType)) || null;
    }
    async convert(filePath, options) {
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
        }
        catch (error) {
            return {
                success: false,
                error: `Conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
    async cleanup() {
        await Promise.all(this.converters
            .filter(converter => converter.cleanup)
            .map(converter => converter.cleanup?.()));
    }
}
