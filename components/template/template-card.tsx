import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Template } from "@/types/template";

interface TemplateCardProps {
  template: Template;
}

export function TemplateCard({ template }: TemplateCardProps) {
  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg">
      <CardContent className="p-0">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={template.previewImage || '/placeholder.svg'}
            alt={template.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
        </div>
        <div className="p-4">
          <h3 className="font-semibold">{template.title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {template.description}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t p-4">
        <Badge variant="secondary">{template.category}</Badge>
        <Button>Use Template</Button>
      </CardFooter>
    </Card>
  );
}
