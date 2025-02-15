import { Category, CategoryTreeNode } from "../types/category";

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function buildCategoryTree(categories: Category[]): CategoryTreeNode[] {
  const categoryMap = new Map<string, CategoryTreeNode>();
  const roots: CategoryTreeNode[] = [];

  // First pass: Create nodes
  categories.forEach((category) => {
    categoryMap.set(category.id, {
      ...category,
      children: [],
      level: 0,
    });
  });

  // Second pass: Build tree
  categories.forEach((category) => {
    const node = categoryMap.get(category.id)!;

    if (category.parentId) {
      const parent = categoryMap.get(category.parentId);
      if (parent) {
        node.level = parent.level + 1;
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  // Sort by order within each level
  const sortNodes = (nodes: CategoryTreeNode[]) => {
    nodes.sort((a, b) => a.order - b.order);
    nodes.forEach((node) => sortNodes(node.children));
  };

  sortNodes(roots);
  return roots;
}

export function flattenCategoryTree(
  tree: CategoryTreeNode[]
): CategoryTreeNode[] {
  const result: CategoryTreeNode[] = [];

  function traverse(node: CategoryTreeNode) {
    result.push(node);
    node.children.forEach(traverse);
  }

  tree.forEach(traverse);
  return result;
}

export function validateCategoryOperation(
  categories: Category[],
  operation: {
    type: "create" | "update" | "delete";
    categoryId?: string;
    parentId?: string;
  }
): { valid: boolean; error?: string } {
  // Check for circular references when updating parent
  if (
    operation.type === "update" &&
    operation.categoryId &&
    operation.parentId
  ) {
    let currentId = operation.parentId;
    while (currentId) {
      if (currentId === operation.categoryId) {
        return { valid: false, error: "Circular reference detected" };
      }
      const parent = categories.find((c) => c.id === currentId);
      currentId = parent?.parentId;
    }
  }

  // Check for existing templates when deleting
  if (operation.type === "delete" && operation.categoryId) {
    const category = categories.find((c) => c.id === operation.categoryId);
    if (category?.templates && category.templates.length > 0) {
      return {
        valid: false,
        error: "Cannot delete category with existing templates",
      };
    }
  }

  return { valid: true };
}

export function getAncestors(
  categories: Category[],
  categoryId: string
): Category[] {
  const result: Category[] = [];
  let currentId = categoryId;

  while (currentId) {
    const category = categories.find((c) => c.id === currentId);
    if (category?.parentId) {
      result.unshift(category);
      currentId = category.parentId;
    } else {
      if (category) {
        result.unshift(category);
      }
      break;
    }
  }

  return result;
}

export function getDescendants(
  categories: Category[],
  categoryId: string
): Category[] {
  const result: Category[] = [];

  function collect(id: string) {
    const children = categories.filter((c) => c.parentId === id);
    children.forEach((child) => {
      result.push(child);
      collect(child.id);
    });
  }

  collect(categoryId);
  return result;
}
