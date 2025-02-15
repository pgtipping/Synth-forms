"use client";

import { useState } from "react";
import { Category } from "@prisma/client";
import { ChevronRight, Edit, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryForm } from "./CategoryForm";

interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[];
}

interface CategoryNodeProps {
  category: CategoryWithChildren;
  categories: Category[];
  children?: CategoryWithChildren[];
  onUpdate: (category: Category) => Promise<void>;
  onDelete: (categoryId: string) => Promise<void>;
  level?: number;
}

export function CategoryNode({
  category,
  categories,
  children,
  onUpdate,
  onDelete,
  level = 0,
}: CategoryNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this category?")) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(category.id);
    } catch (error) {
      console.error("Failed to delete category:", error);
      alert("Failed to delete category. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (showEditForm) {
    return (
      <div style={{ marginLeft: `${level * 1.5}rem` }}>
        <CategoryForm
          category={category}
          categories={categories}
          onSubmit={async (data) => {
            await onUpdate({ ...category, ...data });
            setShowEditForm(false);
          }}
          onCancel={() => setShowEditForm(false)}
        />
      </div>
    );
  }

  return (
    <div>
      <div
        className="flex items-center gap-2 py-2 hover:bg-accent/50 rounded-md px-2"
        style={{ marginLeft: `${level * 1.5}rem` }}
      >
        {children && children.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <ChevronRight
              className={`h-4 w-4 transition-transform ${
                isExpanded ? "rotate-90" : ""
              }`}
            />
          </Button>
        )}
        <span className="flex-1">{category.name}</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowEditForm(true)}
            className="h-8 w-8"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={isDeleting}
            className="h-8 w-8 text-destructive"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {isExpanded && children && (
        <div>
          {children.map((child) => (
            <CategoryNode
              key={child.id}
              category={child}
              categories={categories}
              children={child.children}
              onUpdate={onUpdate}
              onDelete={onDelete}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
