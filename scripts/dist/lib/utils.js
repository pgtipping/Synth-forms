"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALLOWED_FILE_TYPES = exports.MAX_FILE_SIZE = void 0;
exports.cn = cn;
exports.validateFileUpload = validateFileUpload;
exports.validateField = validateField;
exports.processDependencies = processDependencies;
const clsx_1 = require("clsx");
const tailwind_merge_1 = require("tailwind-merge");
exports.MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
exports.ALLOWED_FILE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
function cn(...inputs) {
    return (0, tailwind_merge_1.twMerge)((0, clsx_1.clsx)(inputs));
}
function validateFileUpload(file) {
    if (file.size > exports.MAX_FILE_SIZE) {
        return `File size must be less than ${exports.MAX_FILE_SIZE / (1024 * 1024)}MB`;
    }
    if (!exports.ALLOWED_FILE_TYPES.includes(file.type)) {
        return `File type ${file.type} is not supported. Allowed types: ${exports.ALLOWED_FILE_TYPES.join(", ")}`;
    }
    return null;
}
function validateField(field, value, formData) {
    var _a, _b, _c, _d, _e, _f, _g;
    // Check required fields
    if (field.required &&
        (value === null || value === undefined || value === "")) {
        return `${field.label} is required`;
    }
    // Validate based on field type
    switch (field.type) {
        case "TEXT":
        case "TEXTAREA":
            if (((_a = field.validationRules) === null || _a === void 0 ? void 0 : _a.minLength) &&
                value.length < field.validationRules.minLength) {
                return `${field.label} must be at least ${field.validationRules.minLength} characters`;
            }
            if (((_b = field.validationRules) === null || _b === void 0 ? void 0 : _b.maxLength) &&
                value.length > field.validationRules.maxLength) {
                return `${field.label} must be less than ${field.validationRules.maxLength} characters`;
            }
            if (((_c = field.validationRules) === null || _c === void 0 ? void 0 : _c.pattern) &&
                !new RegExp(field.validationRules.pattern).test(value)) {
                return `${field.label} format is invalid`;
            }
            break;
        case "NUMBER":
            if (isNaN(value)) {
                return `${field.label} must be a number`;
            }
            if (((_d = field.validationRules) === null || _d === void 0 ? void 0 : _d.minValue) &&
                value < field.validationRules.minValue) {
                return `${field.label} must be greater than or equal to ${field.validationRules.minValue}`;
            }
            if (((_e = field.validationRules) === null || _e === void 0 ? void 0 : _e.maxValue) &&
                value > field.validationRules.maxValue) {
                return `${field.label} must be less than or equal to ${field.validationRules.maxValue}`;
            }
            break;
        case "EMAIL":
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                return `${field.label} must be a valid email address`;
            }
            break;
        case "DATE":
            if (isNaN(Date.parse(value))) {
                return `${field.label} must be a valid date`;
            }
            break;
        case "FILE":
            if (value instanceof File) {
                const fileError = validateFileUpload(value);
                if (fileError)
                    return fileError;
            }
            else if (value) {
                return `${field.label} must be a valid file`;
            }
            break;
        case "SELECT":
        case "RADIO":
            if (field.options && !field.options.some((opt) => opt.value === value)) {
                return `${field.label} must be one of the available options`;
            }
            break;
    }
    // Check conditional requirements
    if ((_f = field.validationRules) === null || _f === void 0 ? void 0 : _f.requiredIf) {
        const [dependentFieldId, expectedValue] = field.validationRules.requiredIf.split("=");
        if (formData[dependentFieldId] === expectedValue && !value) {
            return `${field.label} is required when ${dependentFieldId} is ${expectedValue}`;
        }
    }
    // Custom validation
    if ((_g = field.validationRules) === null || _g === void 0 ? void 0 : _g.customValidator) {
        try {
            const validator = new Function("value", "formData", field.validationRules.customValidator);
            const customError = validator(value, formData);
            if (customError) {
                return customError;
            }
        }
        catch (error) {
            return `Custom validation failed for ${field.label}`;
        }
    }
    return null;
}
function processDependencies(fields, formData) {
    const updatedFields = [...fields];
    updatedFields.forEach((field) => {
        if (field.dependencies) {
            field.dependencies.forEach((dep) => {
                const dependentField = formData[dep.fieldId];
                const conditionMet = evaluateCondition(dependentField, dep.condition);
                if (conditionMet) {
                    switch (dep.action) {
                        case "show":
                            field.hidden = false;
                            break;
                        case "hide":
                            field.hidden = true;
                            break;
                        case "enable":
                            field.disabled = false;
                            break;
                        case "disable":
                            field.disabled = true;
                            break;
                        case "require":
                            field.required = true;
                            break;
                        case "clear":
                            formData[field.id] = null;
                            break;
                    }
                }
            });
        }
    });
    return updatedFields;
}
function evaluateCondition(value, condition) {
    switch (condition.operator) {
        case "equals":
            return value == condition.value;
        case "notEquals":
            return value != condition.value;
        case "contains":
            return value.includes(condition.value);
        case "greaterThan":
            return value > condition.value;
        case "lessThan":
            return value < condition.value;
        default:
            return false;
    }
}
