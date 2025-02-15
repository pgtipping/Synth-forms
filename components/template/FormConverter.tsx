import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../ui/use-toast';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Loader2, Upload, FileType, CheckCircle, XCircle } from 'lucide-react';

interface ConversionStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentStep?: string;
  error?: string;
  template?: {
    id: string;
    title: string;
    status: string;
  };
}

export function FormConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [converting, setConverting] = useState(false);
  const [conversionStatus, setConversionStatus] = useState<ConversionStatus | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  // Handle file selection
  const handleFileSelect = (selectedFile: File) => {
    const fileType = selectedFile.name.split('.').pop()?.toLowerCase();
    
    if (!['pdf', 'docx', 'xlsx'].includes(fileType || '')) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please upload a PDF, DOCX, or Excel file'
      });
      return;
    }

    setFile(selectedFile);
  };

  // Handle file drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!file) return;

    try {
      setConverting(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/templates/convert', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start conversion');
      }

      setConversionStatus({
        id: data.id,
        status: 'pending',
        progress: 0
      });

      toast({
        title: 'Conversion started',
        description: 'Your form is being processed'
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to convert form'
      });
    } finally {
      setConverting(false);
    }
  };

  // Poll conversion status
  useEffect(() => {
    if (!conversionStatus?.id || conversionStatus.status === 'completed' || conversionStatus.status === 'failed') {
      return;
    }

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/templates/convert?id=${conversionStatus.id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch status');
        }

        setConversionStatus(data);

        if (data.status === 'completed' && data.template) {
          toast({
            title: 'Conversion completed',
            description: 'Your form has been converted successfully'
          });
          router.push(`/templates/${data.template.id}`);
        } else if (data.status === 'failed') {
          toast({
            variant: 'destructive',
            title: 'Conversion failed',
            description: data.error || 'Failed to convert form'
          });
        }
      } catch (error) {
        console.error('Error polling status:', error);
      }
    };

    const interval = setInterval(pollStatus, 2000);
    return () => clearInterval(interval);
  }, [conversionStatus?.id, conversionStatus?.status, router]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Convert Form</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* File Upload */}
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center
              ${dragging ? 'border-primary bg-primary/10' : 'border-border'}
              ${!file ? 'cursor-pointer' : ''}
            `}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => {
              if (!file) {
                document.getElementById('file-upload')?.click();
              }
            }}
          >
            <Input
              id="file-upload"
              type="file"
              className="hidden"
              accept=".pdf,.docx,.xlsx"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0];
                if (selectedFile) {
                  handleFileSelect(selectedFile);
                }
              }}
            />

            {file ? (
              <div className="flex items-center justify-center space-x-4">
                <FileType className="h-8 w-8 text-primary" />
                <div className="text-left">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setConversionStatus(null);
                  }}
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    Drop your form here or click to upload
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Supports PDF, DOCX, and Excel files
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Conversion Status */}
          {conversionStatus && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                {conversionStatus.status === 'completed' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : conversionStatus.status === 'failed' ? (
                  <XCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <Loader2 className="h-5 w-5 animate-spin" />
                )}
                <span className="font-medium capitalize">
                  {conversionStatus.status}
                </span>
              </div>

              {conversionStatus.currentStep && (
                <p className="text-sm text-muted-foreground">
                  {conversionStatus.currentStep}
                </p>
              )}

              {conversionStatus.status === 'processing' && (
                <Progress value={conversionStatus.progress} />
              )}

              {conversionStatus.error && (
                <p className="text-sm text-red-500">{conversionStatus.error}</p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!file || converting || conversionStatus?.status === 'processing'}
          >
            {converting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Converting...
              </>
            ) : (
              'Convert Form'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
