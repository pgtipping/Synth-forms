import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useToast } from '../ui/use-toast';
import { Loader2, GripVertical, Plus, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';

interface Section {
  id: string;
  title: string;
  content: Record<string, any>;
  order: number;
}

interface SectionManagerProps {
  templateId: string;
}

export function SectionManager({ templateId }: SectionManagerProps) {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const { toast } = useToast();

  const fetchSections = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/templates/${templateId}/sections`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSections(data);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch sections'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, [templateId]);

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order numbers
    const updatedSections = items.map((item, index) => ({
      ...item,
      order: index
    }));

    setSections(updatedSections);

    try {
      const response = await fetch(`/api/templates/${templateId}/sections`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sections: updatedSections.map(({ id, order }) => ({ id, order }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update section order');
      }

      toast({
        title: 'Success',
        description: 'Section order updated'
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update section order'
      });
      // Revert to original order
      fetchSections();
    }
  };

  const addSection = async () => {
    if (!newSectionTitle.trim()) return;

    try {
      const response = await fetch(`/api/templates/${templateId}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newSectionTitle,
          content: {},
          order: sections.length
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setSections([...sections, data]);
      setNewSectionTitle('');
      toast({
        title: 'Success',
        description: 'Section added successfully'
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add section'
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Template Sections</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Section
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Section</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input
                  placeholder="Section Title"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                />
                <Button onClick={addSection} disabled={!newSectionTitle.trim()}>
                  Add Section
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {loading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="sections">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2"
                  >
                    {sections.map((section, index) => (
                      <Draggable
                        key={section.id}
                        draggableId={section.id}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="flex items-center space-x-2 rounded-md border p-4 bg-card"
                          >
                            <div
                              {...provided.dragHandleProps}
                              className="cursor-grab"
                            >
                              <GripVertical className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium">
                                {section.title}
                              </h4>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
