"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Star } from 'lucide-react';
import { foodTastingSchema, type FoodTastingForm, formFields } from './schema';

export default function FoodTastingEvaluation() {
  const { register, handleSubmit, formState: { errors } } = useForm<FoodTastingForm>({
    resolver: zodResolver(foodTastingSchema)
  });

  const onSubmit = async (data: FoodTastingForm) => {
    console.log(data);
    // TODO: Implement form submission
  };

  const RatingScale = ({ name, label, description }: { 
    name: keyof FoodTastingForm; 
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
      <h1 className="text-2xl font-bold mb-8">Food Tasting Evaluation Form</h1>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Vendor Information */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Vendor Information</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {formFields.catererName.label}
            </label>
            <input 
              type="text" 
              {...register('catererName')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" 
            />
            {errors.catererName && (
              <p className="mt-1 text-sm text-red-600">{errors.catererName.message}</p>
            )}
          </div>
        </section>

        {/* Evaluation Criteria */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Vendor Evaluation</h2>
          <p className="mb-4 text-sm text-gray-600">
            Kindly use the scale set below to assess the vendor on each of our selection criteria.
            Mark your rating for each criteria.
          </p>

          <RatingScale 
            name="presentation"
            label={formFields.presentation.label}
            description={formFields.presentation.description}
          />

          <RatingScale 
            name="foodQuality"
            label={formFields.foodQuality.label}
            description={formFields.foodQuality.description}
          />

          <RatingScale 
            name="cleanliness"
            label={formFields.cleanliness.label}
            description={formFields.cleanliness.description}
          />

          <RatingScale 
            name="foodVariety"
            label={formFields.foodVariety.label}
            description={formFields.foodVariety.description}
          />
        </section>

        {/* Recommendation */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Recommendation</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {formFields.recommend.label}
            </label>
            <div className="flex gap-4">
              {formFields.recommend.options.map(option => (
                <label key={option.value} className="inline-flex items-center">
                  <input
                    type="radio"
                    {...register('recommend')}
                    value={option.value}
                    className="form-radio"
                  />
                  <span className="ml-2">{option.label}</span>
                </label>
              ))}
            </div>
            {errors.recommend && (
              <p className="mt-1 text-sm text-red-600">{errors.recommend.message}</p>
            )}
          </div>
        </section>

        {/* Signature */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Signature</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {formFields.assessorSignature.label}
            </label>
            <input 
              type="text" 
              {...register('assessorSignature')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" 
            />
            {errors.assessorSignature && (
              <p className="mt-1 text-sm text-red-600">{errors.assessorSignature.message}</p>
            )}
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
