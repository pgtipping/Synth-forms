"use client";

import { useState, useEffect } from "react";
import { Category } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { CategoryNode } from "./components/CategoryNode";
import { CategoryForm, CreateCategoryInput } from "./components/CategoryForm";
import { CategorySkeleton } from "./components/CategorySkeleton";

interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[];
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithChildren[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      const data = await response.json();
      setCategories(buildCategoryTree(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const buildCategoryTree = (
    categories: Category[]
  ): CategoryWithChildren[] => {
    const categoryMap = new Map<string, CategoryWithChildren>();
    const roots: CategoryWithChildren[] = [];

    // First pass: Create all category nodes
    categories.forEach((category) => {
      categoryMap.set(category.id, { ...category, children: [] });
    });

    // Second pass: Build the tree structure
    categories.forEach((category) => {
      const node = categoryMap.get(category.id)!;
      if (category.parentId) {
        const parent = categoryMap.get(category.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    // Sort roots by order
    return roots.sort((a, b) => a.order - b.order);
  };

  const handleCreateCategory = async (data: CreateCategoryInput) => {
    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create category");
      }

      setShowNewForm(false);
      fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleUpdateCategory = async (category: Category) => {
    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(category),
      });

      if (!response.ok) {
        throw new Error("Failed to update category");
      }

      fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete category");
      }

      fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Categories</h1>
          <Button disabled>New Category</Button>
        </div>
        <CategorySkeleton count={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500">
        Error: {error}
        <Button
          variant="outline"
          onClick={() => {
            setError(null);
            fetchCategories();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Categories</h1>
        <Button onClick={() => setShowNewForm(true)}>New Category</Button>
      </div>

      {showNewForm && (
        <div className="mb-6">
          <CategoryForm
            categories={categories}
            onSubmit={handleCreateCategory}
            onCancel={() => setShowNewForm(false)}
          />
        </div>
      )}

      <div className="space-y-2">
        {categories.map((category) => (
          <CategoryNode
            key={category.id}
            category={category}
            categories={categories}
            children={category.children}
            onUpdate={handleUpdateCategory}
            onDelete={handleDeleteCategory}
          />
        ))}
        {categories.length === 0 && !showNewForm && (
          <p className="text-muted-foreground text-center py-8">
            No categories yet. Click "New Category" to create one.
          </p>
        )}
      </div>
    </div>
  );
}
