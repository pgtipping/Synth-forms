'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { foodTastingSchema, type FoodTastingForm, formFields } from '@/app/forms/food-tasting-evaluation/schema';
import { FormField } from '@/components/ui/form-field';

export const FoodTastingEvaluationTemplate: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FoodTastingForm>({
    resolver: zodResolver(foodTastingSchema)
  });

  const onSubmit = (data: FoodTastingForm) => {
    console.log('Form submitted:', data);
    // TODO: Implement form submission
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="container mx-auto py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-8">Food Tasting Evaluation Form</h1>

      {/* Caterer Information */}
      <section className="mb-8">
        <FormField
          label={formFields.catererName.label}
          error={errors.catererName?.message}
          {...register('catererName')}
        />
      </section>

      {/* Evaluation Criteria */}
      <section className="mb-8 space-y-6">
        <h2 className="text-xl font-semibold">Evaluation Criteria</h2>
        
        <FormField
          as="rating"
          label={formFields.presentation.label}
          helpText={formFields.presentation.helpText}
          error={errors.presentation?.message}
          {...register('presentation')}
        />

        <FormField
          as="rating"
          label={formFields.foodQuality.label}
          helpText={formFields.foodQuality.helpText}
          error={errors.foodQuality?.message}
          {...register('foodQuality')}
        />

        <FormField
          as="rating"
          label={formFields.cleanliness.label}
          helpText={formFields.cleanliness.helpText}
          error={errors.cleanliness?.message}
          {...register('cleanliness')}
        />

        <FormField
          as="rating"
          label={formFields.foodVariety.label}
          helpText={formFields.foodVariety.helpText}
          error={errors.foodVariety?.message}
          {...register('foodVariety')}
        />
      </section>

      {/* Recommendation */}
      <section className="mb-8">
        <FormField
          as="yesno"
          label={formFields.recommend.label}
          error={errors.recommend?.message}
          {...register('recommend')}
        />
      </section>

      {/* Signature */}
      <section className="mb-8">
        <FormField
          label={formFields.assessorSignature.label}
          error={errors.assessorSignature?.message}
          {...register('assessorSignature')}
        />
      </section>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Submit Evaluation
        </button>
      </div>
    </form>
  );
};

export default FoodTastingEvaluationTemplate;
