"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Star } from 'lucide-react';
import { employeePerformanceSchema, type EmployeePerformanceForm, formFields } from './schema';

export default function EmployeePerformanceEvaluation() {
  const { register, handleSubmit, formState: { errors } } = useForm<EmployeePerformanceForm>({
    resolver: zodResolver(employeePerformanceSchema)
  });

  const onSubmit = async (data: EmployeePerformanceForm) => {
    console.log(data);
    // TODO: Implement form submission
  };

  const RatingScale = ({ name, label, description }: { 
    name: keyof EmployeePerformanceForm; 
    label: string; 
    description?: string 
  }) => (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      <div className="flex gap-4 mt-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <label key={value} className="flex flex-col items-center">
            <input
              type="radio"
              {...register(name)}
              value={value}
              className="sr-only peer"
            />
            <Star 
              className={`w-8 h-8 cursor-pointer peer-checked:text-yellow-400 peer-checked:fill-yellow-400`}
              strokeWidth={1}
            />
            <span className="text-xs mt-1">{value}</span>
          </label>
        ))}
      </div>
      {errors[name] && (
        <p className="mt-1 text-sm text-red-600">{errors[name]?.message}</p>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-8">Employee Performance Evaluation</h1>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Employee Information */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Employee Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {formFields.employeeName.label}
              </label>
              <input 
                type="text" 
                {...register('employeeName')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" 
              />
              {errors.employeeName && (
                <p className="mt-1 text-sm text-red-600">{errors.employeeName.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {formFields.position.label}
              </label>
              <input 
                type="text" 
                {...register('position')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" 
              />
              {errors.position && (
                <p className="mt-1 text-sm text-red-600">{errors.position.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {formFields.reviewPeriod.label}
              </label>
              <input 
                type="text" 
                {...register('reviewPeriod')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" 
              />
              {errors.reviewPeriod && (
                <p className="mt-1 text-sm text-red-600">{errors.reviewPeriod.message}</p>
              )}
            </div>
          </div>
        </section>

        {/* Performance Ratings */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Performance Ratings</h2>
          
          <RatingScale 
            name="jobKnowledge"
            label={formFields.jobKnowledge.label}
            description={formFields.jobKnowledge.description}
          />

          <RatingScale 
            name="workQuality"
            label={formFields.workQuality.label}
            description={formFields.workQuality.description}
          />

          <RatingScale 
            name="productivity"
            label={formFields.productivity.label}
            description={formFields.productivity.description}
          />

          <RatingScale 
            name="communication"
            label={formFields.communication.label}
            description={formFields.communication.description}
          />

          <RatingScale 
            name="teamwork"
            label={formFields.teamwork.label}
            description={formFields.teamwork.description}
          />

          <RatingScale 
            name="initiative"
            label={formFields.initiative.label}
            description={formFields.initiative.description}
          />
        </section>

        {/* Comments and Goals */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Comments and Goals</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              {formFields.comments.label}
            </label>
            <textarea 
              {...register('comments')}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" 
            />
            {errors.comments && (
              <p className="mt-1 text-sm text-red-600">{errors.comments.message}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              {formFields.goals.label}
            </label>
            <textarea 
              {...register('goals')}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" 
            />
            {errors.goals && (
              <p className="mt-1 text-sm text-red-600">{errors.goals.message}</p>
            )}
          </div>
        </section>

        {/* Signatures */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Signatures</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {formFields.employeeSignature.label}
              </label>
              <input 
                type="text" 
                {...register('employeeSignature')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" 
              />
              {errors.employeeSignature && (
                <p className="mt-1 text-sm text-red-600">{errors.employeeSignature.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {formFields.managerSignature.label}
              </label>
              <input 
                type="text" 
                {...register('managerSignature')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" 
              />
              {errors.managerSignature && (
                <p className="mt-1 text-sm text-red-600">{errors.managerSignature.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {formFields.reviewDate.label}
              </label>
              <input 
                type="date" 
                {...register('reviewDate')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" 
              />
              {errors.reviewDate && (
                <p className="mt-1 text-sm text-red-600">{errors.reviewDate.message}</p>
              )}
            </div>
          </div>
        </section>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Submit Evaluation
        </button>
      </form>
    </div>
  );
}
