import React from 'react';
import { useFormTemplate } from '../hooks/useFormTemplate';
import { FormRenderer } from '../components/form/FormRenderer';

export default function FormTemplatePage() {
  const {
    formTemplate,
    loading,
    error,
    convertToFormTemplate,
  } = useFormTemplate({
    onSubmit: (data) => {
      console.log('Form submitted:', data);
    },
    onError: (error) => {
      console.error('Error:', error);
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await convertToFormTemplate(file);
    }
  };

  const handleFormSubmit = (data: any) => {
    console.log('Form data:', data);
    // Handle form submission
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">
          Error: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {!formTemplate ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h1 className="text-2xl font-bold mb-8">Upload Form Template</h1>
          <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
            <span className="px-4 py-2 border border-gray-300 rounded-md shadow-sm">
              Select File
            </span>
            <input
              type="file"
              className="sr-only"
              accept=".pdf,.docx,.html"
              onChange={handleFileUpload}
            />
          </label>
        </div>
      ) : (
        <FormRenderer
          formTemplate={formTemplate}
          onSubmit={handleFormSubmit}
          className="max-w-4xl mx-auto"
        />
      )}
    </div>
  );
}
