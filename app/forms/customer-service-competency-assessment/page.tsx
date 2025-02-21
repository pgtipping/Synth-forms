'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import {
  customerServiceCompetencySchema,
  type CustomerServiceCompetencyForm
} from './schema';
import { CustomerServiceCompetencyTemplate } from '@/templates/customer-service-competency-assessment';

export default function CustomerServiceCompetencyAssessmentForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<CustomerServiceCompetencyForm>({
    resolver: zodResolver(customerServiceCompetencySchema)
  });

  const handleFormSubmit = async (data: CustomerServiceCompetencyForm) => {
    setIsSubmitting(true);
    try {
      // Send form data to your API
      const response = await fetch('/api/forms/customer-service-competency-assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Form submission failed');
      }

      setSubmitSuccess(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      // Handle error state
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow-lg rounded-lg p-6">
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-green-700">
                Form submitted successfully! Thank you for completing the assessment.
              </p>
              <Button
                onClick={() => setSubmitSuccess(false)}
                className="mt-4"
                variant="outline"
              >
                Submit Another Assessment
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Customer Service Competency Assessment
          </h1>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
            <CustomerServiceCompetencyTemplate
              register={register}
              errors={errors}
            />

            <div className="mt-6 flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.print()}
                className="print:hidden"
              >
                Print Assessment
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="print:hidden"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
