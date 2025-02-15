import { validateField, processDependencies } from "./utils";
export class ValidationError extends Error {
    constructor(errors) {
        super("Validation Failed");
        this.name = "ValidationError";
        this.errors = errors;
    }
}
export class Validator {
    static validateTemplate(data) {
        const errors = [];
        // Title validation
        if (!data.title?.trim()) {
            errors.push("Template title is required");
        }
        else if (data.title.length < 3 || data.title.length > 100) {
            errors.push("Template title must be between 3 and 100 characters");
        }
        // Category validation
        if (!data.category?.trim()) {
            errors.push("Template category is required");
        }
        // Status validation
        if (data.status &&
            !["DRAFT", "PUBLISHED", "ARCHIVED"].includes(data.status)) {
            errors.push("Invalid template status");
        }
        // Version validation
        if (data.version !== undefined &&
            (!Number.isInteger(data.version) || data.version < 1)) {
            errors.push("Version must be a positive integer");
        }
        // Form definition validation
        if (data.formDefinition) {
            if (!Array.isArray(data.formDefinition.fields)) {
                errors.push("Form fields must be an array");
            }
            else {
                data.formDefinition.fields.forEach((field, index) => {
                    const fieldErrors = this.validateFormFieldDefinition(field);
                    errors.push(...fieldErrors.map((err) => `Field ${index + 1}: ${err}`));
                });
            }
        }
        // Customizable areas validation
        if (data.customizableAreas) {
            if (typeof data.customizableAreas !== "object") {
                errors.push("Customizable areas must be an object");
            }
        }
        if (errors.length > 0) {
            throw new ValidationError(errors);
        }
        return true;
    }
    static validateFormFieldDefinition(field) {
        const errors = [];
        if (!field.id)
            errors.push("Field ID is required");
        if (!field.name)
            errors.push("Field name is required");
        if (!field.label)
            errors.push("Field label is required");
        if (!field.type)
            errors.push("Field type is required");
        // Validate field type
        const validTypes = [
            "TEXT",
            "TEXTAREA",
            "NUMBER",
            "EMAIL",
            "DATE",
            "SELECT",
            "RADIO",
            "CHECKBOX",
            "FILE",
            "RICH_TEXT",
        ];
        if (!validTypes.includes(field.type)) {
            errors.push(`Invalid field type: ${field.type}`);
        }
        // Validate options for SELECT and RADIO types
        if ((field.type === "SELECT" || field.type === "RADIO") &&
            (!field.options || !Array.isArray(field.options))) {
            errors.push("Options array is required for SELECT and RADIO fields");
        }
        // Validate dependencies
        if (field.dependencies) {
            field.dependencies.forEach((dep, index) => {
                if (!dep.fieldId)
                    errors.push(`Dependency ${index + 1}: Field ID is required`);
                if (!dep.condition?.operator)
                    errors.push(`Dependency ${index + 1}: Condition operator is required`);
                if (!dep.action)
                    errors.push(`Dependency ${index + 1}: Action is required`);
            });
        }
        return errors;
    }
    static validateCustomization(data) {
        const errors = [];
        if (!data.templateId) {
            errors.push("Template ID is required");
        }
        if (!data.userId) {
            errors.push("User ID is required");
        }
        if (data.branding) {
            if (data.branding.logo && !data.branding.logo.position) {
                errors.push("Logo position is required when logo is provided");
            }
            if (data.branding.colors) {
                const { colors } = data.branding;
                if (colors.primary && !/^#[0-9A-F]{6}$/i.test(colors.primary)) {
                    errors.push("Invalid primary color format");
                }
                if (colors.secondary && !/^#[0-9A-F]{6}$/i.test(colors.secondary)) {
                    errors.push("Invalid secondary color format");
                }
                if (colors.text && !/^#[0-9A-F]{6}$/i.test(colors.text)) {
                    errors.push("Invalid text color format");
                }
            }
        }
        if (data.fieldCustomizations) {
            if (data.fieldCustomizations.required &&
                !Array.isArray(data.fieldCustomizations.required)) {
                errors.push("Required fields must be an array");
            }
            if (data.fieldCustomizations.hidden &&
                !Array.isArray(data.fieldCustomizations.hidden)) {
                errors.push("Hidden fields must be an array");
            }
        }
        if (errors.length > 0) {
            throw new ValidationError(errors);
        }
        return true;
    }
    static validateFormResponse(data) {
        const errors = [];
        if (!data.templateId) {
            errors.push("Template ID is required");
        }
        if (!data.userId) {
            errors.push("User ID is required");
        }
        if (!data.data || typeof data.data !== "object") {
            errors.push("Form response data is required and must be an object");
        }
        const validStatuses = [
            "DRAFT",
            "PENDING_REVIEW",
            "SUBMITTED",
            "ARCHIVED",
        ];
        if (data.status && !validStatuses.includes(data.status)) {
            errors.push("Invalid response status");
        }
        if (data.templateVersion !== undefined &&
            (!Number.isInteger(data.templateVersion) || data.templateVersion < 1)) {
            errors.push("Template version must be a positive integer");
        }
        if (errors.length > 0) {
            throw new ValidationError(errors);
        }
        return true;
    }
    static sanitizeInput(input) {
        if (typeof input === "string") {
            // Trim whitespace
            input = input.trim();
            // Escape HTML to prevent XSS
            input = input
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
            // Remove potentially dangerous HTML tags
            input = input.replace(/<[^>]*>/g, "");
        }
        else if (typeof input === "object" && input !== null) {
            // Recursively sanitize objects and arrays
            Object.keys(input).forEach((key) => {
                input[key] = this.sanitizeInput(input[key]);
            });
        }
        return input;
    }
    static processTemplateData(data) {
        // Create a copy of the data to avoid mutating the original
        const processedData = { ...data };
        // Sanitize string fields
        processedData.title = this.sanitizeInput(processedData.title);
        processedData.description = processedData.description
            ? this.sanitizeInput(processedData.description)
            : undefined;
        processedData.category = this.sanitizeInput(processedData.category);
        if (processedData.tags) {
            processedData.tags = processedData.tags.map((tag) => this.sanitizeInput(tag));
        }
        // Validate the processed data
        this.validateTemplate(processedData);
        return processedData;
    }
}
// Re-export field validation functions from utils
export { validateField, processDependencies };
