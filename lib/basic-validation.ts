export interface BasicTemplate {
  title: string;
  content: any;
  category: string;
  tags?: string[];
}

export function validateTemplate(template: BasicTemplate): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!template.title || template.title.trim().length === 0) {
    errors.push("Title is required.");
  }
  if (template.content === undefined || template.content === null) {
    errors.push("Content is required.");
  }
  if (!template.category || template.category.trim().length === 0) {
    errors.push("Category is required.");
  }
  return { valid: errors.length === 0, errors };
}
