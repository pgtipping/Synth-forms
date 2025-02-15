import { promises as fs } from 'fs';
import axios from 'axios';
import FormData from 'form-data';
export class LocalFormConverter {
    constructor() {
        this.inferenceServiceUrl = process.env.INFERENCE_SERVICE_URL || 'http://localhost:8000';
    }
    async convert(filePath) {
        try {
            // Read the file
            const fileContent = await fs.readFile(filePath);
            // Create form data
            const formData = new FormData();
            formData.append('file', fileContent, {
                filename: filePath.split('/').pop() || 'document',
                contentType: this.getContentType(filePath),
            });
            // Send to inference service
            const response = await axios.post(`${this.inferenceServiceUrl}/predict`, formData, {
                headers: {
                    ...formData.getHeaders(),
                },
            });
            // Transform and validate fields
            const fields = response.data.fields
                .filter((field) => this.validateField(field))
                .map((field) => ({
                name: field.label || 'unnamed_field',
                type: this.inferFieldType(field),
                value: field.text,
                confidence: field.confidence
            }));
            return {
                success: true,
                content: {
                    text: fields.map(f => f.value).join(' '),
                    fields
                }
            };
        }
        catch (error) {
            console.error('Local form conversion error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error during local form conversion'
            };
        }
    }
    getContentType(filePath) {
        const extension = filePath.split('.').pop()?.toLowerCase();
        switch (extension) {
            case 'pdf':
                return 'application/pdf';
            case 'docx':
                return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            case 'xlsx':
                return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            case 'jpg':
            case 'jpeg':
                return 'image/jpeg';
            case 'png':
                return 'image/png';
            default:
                return 'application/octet-stream';
        }
    }
    inferFieldType(field) {
        const text = field.text?.toLowerCase() || '';
        const label = field.label?.toLowerCase() || '';
        // Date detection
        if (label.includes('date') ||
            /^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/.test(text) ||
            /^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(text)) {
            return 'date';
        }
        // Email detection
        if (label.includes('email') ||
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
            return 'email';
        }
        // Phone detection
        if (label.includes('phone') ||
            label.includes('tel') ||
            /^[\d\s\-+()]{7,}$/.test(text)) {
            return 'phone';
        }
        // Number detection
        if (label.includes('amount') ||
            label.includes('number') ||
            /^[\d.,]+$/.test(text)) {
            return 'number';
        }
        // Checkbox/Radio detection
        if (label.includes('check') ||
            label.includes('select') ||
            /^[☐☑✓x\s]{1,2}$/i.test(text)) {
            return 'checkbox';
        }
        // Multi-line text detection
        if (text.includes('\n') ||
            text.length > 100 ||
            label.includes('description') ||
            label.includes('comment')) {
            return 'textarea';
        }
        return 'text';
    }
    validateField(field) {
        if (!field.text || !field.label) {
            return false;
        }
        // Check confidence score if available
        if (field.confidence && field.confidence < 0.5) {
            return false;
        }
        // Validate field based on type
        const type = this.inferFieldType(field);
        switch (type) {
            case 'email':
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.text);
            case 'date':
                return !isNaN(Date.parse(field.text));
            case 'number':
                return !isNaN(parseFloat(field.text));
            default:
                return true;
        }
    }
}
