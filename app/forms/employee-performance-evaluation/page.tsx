"use client";

import React from 'react';
import { useForm } from 'react-hook-form';

export default function EmployeePerformanceEvaluation() {
  const { register, handleSubmit } = useForm();

  const onSubmit = async (data: any) => {
    console.log(data);
    // TODO: Implement form submission
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-8">Employee Performance Evaluation</h1>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Employee Information */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Employee Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Employee Name</label>
              <input 
                type="text" 
                {...register('employeeName', { required: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Position</label>
              <input 
                type="text" 
                {...register('position', { required: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Review Period</label>
              <input 
                type="text" 
                {...register('reviewPeriod', { required: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" 
              />
            </div>
          </div>
        </section>

        {/* Performance Ratings */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Performance Ratings</h2>
          <div className="space-y-6">
            {['Job Knowledge', 'Work Quality', 'Productivity', 'Communication', 'Teamwork', 'Initiative'].map((category) => (
              <div key={category} className="border p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">{category}</label>
                <div className="flex gap-4">
                  {[1, 2, 3].map((rating) => (
                    <label key={rating} className="flex items-center">
                      <input
                        type="radio"
                        {...register(category.toLowerCase().replace(/\s+/g, ''), { required: true })}
                        value={rating}
                        className="mr-2"
                      />
                      <span>{rating === 1 ? 'Needs Improvement' : rating === 2 ? 'Meets Expectations' : 'Exceeds Expectations'}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Comments and Feedback */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Comments and Feedback</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Key Strengths</label>
              <textarea
                {...register('strengths')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                rows={4}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Areas for Improvement</label>
              <textarea
                {...register('improvements')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                rows={4}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Development Plan</label>
              <textarea
                {...register('developmentPlan')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                rows={4}
              />
            </div>
          </div>
        </section>

        <div className="mt-8">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Submit Evaluation
          </button>
        </div>
      </form>
    </div>
  );
}
