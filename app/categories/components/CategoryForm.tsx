"use client";

import { useState } from "react";
import { Category, Prisma } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CategoryFormProps {
  category?: Category;
  categories: Category[];
  onSubmit: (data: CreateCategoryInput) => Promise<void>;
  onCancel: () => void;
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
  parentId?: string;
  order?: number;
  metadata?: Prisma.JsonValue;
}

interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[];
}

function isDescendantOf(
  potentialDescendant: Category,
  potentialAncestor: Category,
  categories: Category[]
): boolean {
  if (potentialDescendant.id === potentialAncestor.id) return true;

  let current = categories.find((c) => c.id === potentialDescendant.parentId);
  while (current) {
    if (current.id === potentialAncestor.id) return true;
    current = categories.find((c) => c.id === current?.parentId);
  }

  return false;
}

export function CategoryForm({
  category,
  categories,
  onSubmit,
  onCancel,
}: CategoryFormProps) {
  const [formData, setFormData] = useState<CreateCategoryInput>({
    name: category?.name || "",
    description: category?.description || "",
    parentId: category?.parentId || undefined,
    order: category?.order || 0,
    metadata: category?.metadata || {},
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter out the current category and its descendants from available parent options
  const availableParents = categories.filter((c) => {
    if (!category) return true;
    if (c.id === category.id) return false;
    // Filter out descendants to prevent circular dependencies
    return !isDescendantOf(c, category, categories);
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description || ""}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="parent">Parent Category</Label>
        <Select
          value={formData.parentId || ""}
          onValueChange={(value) =>
            setFormData({ ...formData, parentId: value })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a parent category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">None</SelectItem>
            {availableParents.map((parent) => (
              <SelectItem key={parent.id} value={parent.id}>
                {parent.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="order">Display Order</Label>
        <Input
          id="order"
          type="number"
          value={formData.order}
          onChange={(e) =>
            setFormData({ ...formData, order: parseInt(e.target.value, 10) })
          }
          required
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving..."
            : category
            ? "Update Category"
            : "Create Category"}
        </Button>
      </div>
    </form>
  );
}
