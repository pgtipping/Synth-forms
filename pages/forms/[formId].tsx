import React from 'react';
import { GetServerSideProps } from 'next';
import { DynamicForm } from '../../components/forms/DynamicForm';
import { FormDefinition } from '../../components/forms/types';

interface FormPageProps {
  formDefinition: FormDefinition;
}

export default function FormPage({ formDefinition }: FormPageProps) {
  const handleSubmit = async (values: Record<string, any>) => {
    try {
      const response = await fetch('/api/forms/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Form submission failed');
      }

      // Handle successful submission
      alert('Form submitted successfully!');
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to submit form. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">
              {formDefinition.sections[0]?.label || 'Form'}
            </h1>
            
            <DynamicForm
              definition={formDefinition}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  try {
    // In production, this would fetch from your API
    const formDefinition = require(`../../data/forms/${params?.formId}.json`);

    return {
      props: {
        formDefinition,
      },
    };
  } catch (error) {
    return {
      notFound: true,
    };
  }
};
