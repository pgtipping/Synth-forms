import { FormField } from "../types/template";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function validateFileUpload(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return `File type ${
      file.type
    } is not supported. Allowed types: ${ALLOWED_FILE_TYPES.join(", ")}`;
  }

  return null;
}

export function validateField(
  field: FormField,
  value: any,
  formData: any
): string | null {
  // Check required fields
  if (
    field.required &&
    (value === null || value === undefined || value === "")
  ) {
    return `${field.label} is required`;
  }

  // Validate based on field type
  switch (field.type) {
    case "TEXT":
    case "TEXTAREA":
      if (
        field.validationRules?.minLength &&
        value.length < field.validationRules.minLength
      ) {
        return `${field.label} must be at least ${field.validationRules.minLength} characters`;
      }
      if (
        field.validationRules?.maxLength &&
        value.length > field.validationRules.maxLength
      ) {
        return `${field.label} must be less than ${field.validationRules.maxLength} characters`;
      }
      if (
        field.validationRules?.pattern &&
        !new RegExp(field.validationRules.pattern).test(value)
      ) {
        return `${field.label} format is invalid`;
      }
      break;

    case "NUMBER":
      if (isNaN(value)) {
        return `${field.label} must be a number`;
      }
      if (
        field.validationRules?.minValue &&
        value < field.validationRules.minValue
      ) {
        return `${field.label} must be greater than or equal to ${field.validationRules.minValue}`;
      }
      if (
        field.validationRules?.maxValue &&
        value > field.validationRules.maxValue
      ) {
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
        if (fileError) return fileError;
      } else if (value) {
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
  if (field.validationRules?.requiredIf) {
    const [dependentFieldId, expectedValue] =
      field.validationRules.requiredIf.split("=");
    if (formData[dependentFieldId] === expectedValue && !value) {
      return `${field.label} is required when ${dependentFieldId} is ${expectedValue}`;
    }
  }

  // Custom validation
  if (field.validationRules?.customValidator) {
    try {
      const validator = new Function(
        "value",
        "formData",
        field.validationRules.customValidator
      );
      const customError = validator(value, formData);
      if (customError) {
        return customError;
      }
    } catch (error) {
      return `Custom validation failed for ${field.label}`;
    }
  }

  return null;
}

export function processDependencies(fields: FormField[], formData: any) {
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

function evaluateCondition(value: any, condition: any): boolean {
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
