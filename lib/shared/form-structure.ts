import { FormField, FormSection } from './types';
import { v4 as uuidv4 } from 'uuid';

export function processFormStructure(fields: FormField[]): FormSection[] {
  const sections: FormSection[] = [];
  let currentSection: FormSection | null = null;

  for (const field of fields) {
    if (!field.section) {
      // Field doesn't belong to a section, add it to root level
      if (currentSection) {
        sections.push(currentSection);
        currentSection = null;
      }
      sections.push({
        id: uuidv4(),
        title: 'Default Section',
        fields: [field],
        level: 0
      });
    } else {
      if (!currentSection || currentSection.title !== field.section) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          id: uuidv4(),
          title: field.section,
          fields: [field],
          level: detectSectionLevel(field.section)
        };
      } else {
        currentSection.fields.push(field);
      }
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}

export function detectSectionLevel(title: string): number {
  // Use heading markers to determine level
  if (title.startsWith('# ')) return 0;
  if (title.startsWith('## ')) return 1;
  if (title.startsWith('### ')) return 2;
  if (title.startsWith('#### ')) return 3;

  // Use text characteristics
  const words = title.trim().split(' ');
  if (words.length <= 2) return 0; // Short titles are likely main sections
  if (title.includes(':')) return 1; // Subsections often use colons
  if (title.length > 50) return 2; // Long titles are likely deeper subsections

  return 1; // Default to subsection level
}

export function mergeSections(sections: FormSection[]): FormSection[] {
  const merged: FormSection[] = [];
  const sectionMap = new Map<string, FormSection>();

  for (const section of sections) {
    const existing = sectionMap.get(section.title);
    if (existing) {
      // Merge fields into existing section
      existing.fields = [...existing.fields, ...section.fields];
    } else {
      sectionMap.set(section.title, section);
      merged.push(section);
    }
  }

  // Sort sections by level
  return merged.sort((a, b) => a.level - b.level);
}

export function validateFormStructure(sections: FormSection[]): boolean {
  for (const section of sections) {
    // Check required properties
    if (!section.id || !section.title || !Array.isArray(section.fields)) {
      return false;
    }

    // Validate fields
    for (const field of section.fields) {
      if ('type' in field) { // FormField
        if (!validateFormField(field as FormField)) {
          return false;
        }
      } else { // Nested FormSection
        if (!validateFormStructure([field as FormSection])) {
          return false;
        }
      }
    }
  }

  return true;
}

function validateFormField(field: FormField): boolean {
  return !!(
    field.id &&
    field.type &&
    field.label &&
    typeof field.required === 'boolean'
  );
}
