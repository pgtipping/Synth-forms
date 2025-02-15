'use client';

import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { performanceImprovementSchema, type PerformanceImprovementForm, formFields } from './schema';
import { FormField } from '@/components/FormField';

export default function PerformanceImprovementPlan() {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<PerformanceImprovementForm>({
    resolver: zodResolver(performanceImprovementSchema),
    defaultValues: {
      performanceAreas: [{ 
        area: '', 
        currentPerformance: '', 
        expectedPerformance: '', 
        actionSteps: '', 
        timeline: '',
        progress: 'not-started',
        priority: 'medium'
      }],
      progressReviews: []
    }
  });

  const { fields: performanceAreas, append: appendArea, remove: removeArea } = useFieldArray({
    control,
    name: 'performanceAreas'
  });

  const { fields: progressReviews, append: appendReview, remove: removeReview } = useFieldArray({
    control,
    name: 'progressReviews'
  });

  const onSubmit = (data: PerformanceImprovementForm) => {
    console.log(data);
    // TODO: Handle form submission
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-8">Performance Improvement Plan</h1>
      
      {/* Employee Information */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Employee Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label={formFields.employeeName.label}
            error={errors.employeeName?.message}
            {...register('employeeName')}
          />
          <FormField
            label={formFields.position.label}
            error={errors.position?.message}
            {...register('position')}
          />
          <FormField
            label={formFields.department.label}
            error={errors.department?.message}
            {...register('department')}
          />
          <FormField
            label={formFields.manager.label}
            error={errors.manager?.message}
            {...register('manager')}
          />
        </div>
      </section>

      {/* Relevant Dates */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Relevant Dates</h2>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            type="date"
            label={formFields.initiationDate.label}
            error={errors.initiationDate?.message}
            {...register('initiationDate')}
          />
          <FormField
            label={formFields.duration.label}
            error={errors.duration?.message}
            {...register('duration')}
          />
          <FormField
            type="date"
            label={formFields.startDate.label}
            error={errors.startDate?.message}
            {...register('startDate')}
          />
          <FormField
            type="date"
            label={formFields.endDate.label}
            error={errors.endDate?.message}
            {...register('endDate')}
          />
        </div>
      </section>

      {/* Performance Areas */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Performance Areas</h2>
          <button
            type="button"
            onClick={() => appendArea({ 
              area: '', 
              currentPerformance: '', 
              expectedPerformance: '', 
              actionSteps: '', 
              timeline: '',
              progress: 'not-started',
              priority: 'medium'
            })}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Area
          </button>
        </div>
        
        {performanceAreas.map((field, index) => (
          <div key={field.id} className="mb-6 p-4 border rounded">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-medium">Area {index + 1}</h3>
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => removeArea(index)}
                  className="text-red-500 hover:text-red-600"
                >
                  Remove
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              <FormField
                label={formFields.performanceAreas.itemFields.area.label}
                error={errors.performanceAreas?.[index]?.area?.message}
                {...register(`performanceAreas.${index}.area`)}
              />
              <FormField
                as="textarea"
                label={formFields.performanceAreas.itemFields.currentPerformance.label}
                error={errors.performanceAreas?.[index]?.currentPerformance?.message}
                {...register(`performanceAreas.${index}.currentPerformance`)}
              />
              <FormField
                as="textarea"
                label={formFields.performanceAreas.itemFields.expectedPerformance.label}
                error={errors.performanceAreas?.[index]?.expectedPerformance?.message}
                {...register(`performanceAreas.${index}.expectedPerformance`)}
              />
              <FormField
                as="textarea"
                label={formFields.performanceAreas.itemFields.actionSteps.label}
                error={errors.performanceAreas?.[index]?.actionSteps?.message}
                {...register(`performanceAreas.${index}.actionSteps`)}
              />
              <FormField
                label={formFields.performanceAreas.itemFields.timeline.label}
                error={errors.performanceAreas?.[index]?.timeline?.message}
                {...register(`performanceAreas.${index}.timeline`)}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  as="select"
                  label={formFields.performanceAreas.itemFields.progress.label}
                  error={errors.performanceAreas?.[index]?.progress?.message}
                  {...register(`performanceAreas.${index}.progress`)}
                >
                  <option value="not-started">Not Started</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </FormField>
                <FormField
                  as="select"
                  label={formFields.performanceAreas.itemFields.priority.label}
                  error={errors.performanceAreas?.[index]?.priority?.message}
                  {...register(`performanceAreas.${index}.priority`)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </FormField>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Support and Resources */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Support and Resources</h2>
        <div className="space-y-4">
          <FormField
            as="textarea"
            label={formFields.supportProvided.label}
            error={errors.supportProvided?.message}
            {...register('supportProvided')}
          />
          <FormField
            as="textarea"
            label={formFields.resources.label}
            error={errors.resources?.message}
            {...register('resources')}
          />
        </div>
      </section>

      {/* Progress Reviews */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Progress Reviews</h2>
          <button
            type="button"
            onClick={() => appendReview({ date: '', progress: '', nextSteps: '' })}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Review
          </button>
        </div>

        {progressReviews.map((field, index) => (
          <div key={field.id} className="mb-6 p-4 border rounded">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-medium">Review {index + 1}</h3>
              <button
                type="button"
                onClick={() => removeReview(index)}
                className="text-red-500 hover:text-red-600"
              >
                Remove
              </button>
            </div>

            <div className="space-y-4">
              <FormField
                type="date"
                label="Review Date"
                error={errors.progressReviews?.[index]?.date?.message}
                {...register(`progressReviews.${index}.date`)}
              />
              <FormField
                as="textarea"
                label="Progress"
                error={errors.progressReviews?.[index]?.progress?.message}
                {...register(`progressReviews.${index}.progress`)}
              />
              <FormField
                as="textarea"
                label="Next Steps"
                error={errors.progressReviews?.[index]?.nextSteps?.message}
                {...register(`progressReviews.${index}.nextSteps`)}
              />
            </div>
          </div>
        ))}
      </section>

      {/* Signatures */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Signatures</h2>
        <p className="mb-4">This Performance Improvement Plan must be signed by the employee, manager, and HR representative.</p>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Employee Signature"
            error={errors.employeeSignature?.message}
            {...register('employeeSignature')}
          />
          <FormField
            label="Manager Signature"
            error={errors.managerSignature?.message}
            {...register('managerSignature')}
          />
          <FormField
            label="HR Signature"
            error={errors.hrSignature?.message}
            {...register('hrSignature')}
          />
          <FormField
            type="date"
            label="Signature Date"
            error={errors.signatureDate?.message}
            {...register('signatureDate')}
          />
        </div>
      </section>

      {/* Comments */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Additional Comments</h2>
        <FormField
          as="textarea"
          label="Comments"
          error={errors.comments?.message}
          {...register('comments')}
        />
      </section>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Submit Plan
        </button>
      </div>
    </form>
  );
}
