import { Template } from "./template";
import { Prisma } from "@prisma/client";

export interface Category {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  parent?: Category | null;
  children?: Category[];
  templates?: Template[];
  metadata: Prisma.JsonValue | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export type CategoryMetadata = {
  icon?: string;
  color?: string;
  isHidden?: boolean;
  customFields?: Record<string, unknown>;
  [key: string]: unknown;
};

export interface CreateCategoryInput {
  name: string;
  description?: string;
  parentId?: string;
  metadata?: CategoryMetadata;
  order?: number;
}

export interface UpdateCategoryInput extends Partial<CreateCategoryInput> {
  id: string;
}

export interface CategoryTreeNode extends Omit<Category, "children"> {
  children: CategoryTreeNode[];
  level: number;
}
