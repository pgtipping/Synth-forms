import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from "@/components/ui/button";

interface TemplateFiltersProps {
  onCategoryChange: (category: string | null) => void;
}

export function TemplateFilters({ onCategoryChange }: TemplateFiltersProps) {
  const categories = [
    "All Templates",
    "E-commerce Forms",
    "Business Forms",
    "Education Forms",
    "Survey Forms",
    "Event Forms",
  ];

  return (
    <div className="w-64 space-y-6">
      <div>
        <Label>SORT BY</Label>
        <Select defaultValue="popular">
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">Popular</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="alphabetical">Alphabetical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>FORM LAYOUT</Label>
        <Select defaultValue="classic">
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Layout" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="classic">Classic</SelectItem>
            <SelectItem value="modern">Modern</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <h2 className="font-semibold">Categories</h2>
        <div className="space-y-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant="ghost"
              className="w-full justify-start"
              onClick={() => onCategoryChange(category === "All Templates" ? null : category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <Label>TYPES</Label>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Order Forms</span>
            <span className="text-sm text-muted-foreground">1,711</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Registration Forms</span>
            <span className="text-sm text-muted-foreground">1,722</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Application Forms</span>
            <span className="text-sm text-muted-foreground">1,735</span>
          </div>
        </div>
      </div>
    </div>
  )
}
