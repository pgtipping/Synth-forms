import { z } from 'zod';
import { textField, ratingField, yesNoField, baseFieldMetadata, createRatingField } from '../../../types/form-fields';

// Form validation schema
export const foodTastingSchema = z.object({
  catererName: textField,
  presentation: ratingField,
  foodQuality: ratingField,
  cleanliness: ratingField,
  foodVariety: ratingField,
  recommend: yesNoField,
  assessorSignature: textField
});

// TypeScript type from schema
export type FoodTastingForm = z.infer<typeof foodTastingSchema>;

// Form field metadata
export const formFields = {
  catererName: {
    ...baseFieldMetadata.text,
    label: 'Name of Caterer'
  },
  presentation: createRatingField(
    'Presentation/Ambience',
    'Table presentation and arrangements of dishing tools and cutleries for ease in serving trainees in the shortest possible time'
  ),
  foodQuality: createRatingField(
    'Food Quality (Taste)',
    'Quality of the dishes presented'
  ),
  cleanliness: createRatingField(
    'Cleanliness',
    'General cleanliness of waiters and cutleries'
  ),
  foodVariety: createRatingField(
    'Variety of Food',
    'Sustainability of the varieties presented in view of our cost'
  ),
  recommend: {
    ...baseFieldMetadata.yesNo,
    label: 'Would you recommend this caterer?'
  },
  assessorSignature: {
    ...baseFieldMetadata.text,
    label: 'Signature of Assessor'
  }
} as const;
