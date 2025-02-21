import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField } from '@/components/ui/form-field';

// Define the schema for the form
const jobCompetencySchema = z.object({
  // Employee Information
  employeeId: z.string().min(1, 'Employee ID is required'),
  employeeName: z.string().min(1, 'Employee name is required'),
  position: z.string().min(1, 'Position is required'),
  department: z.string().min(1, 'Department is required'),
  evaluationDate: z.string().min(1, 'Evaluation date is required'),
  evaluator: z.string().min(1, 'Evaluator name is required'),

  // Core Competencies
  jobKnowledge: z.object({
    rating: z.number().min(1).max(5),
    evidence: z.string().min(1, 'Evidence is required'),
    developmentNeeds: z.string().optional()
  }),
  technicalSkills: z.object({
    rating: z.number().min(1).max(5),
    evidence: z.string().min(1, 'Evidence is required'),
    developmentNeeds: z.string().optional()
  }),
  problemSolving: z.object({
    rating: z.number().min(1).max(5),
    evidence: z.string().min(1, 'Evidence is required'),
    developmentNeeds: z.string().optional()
  }),
  communication: z.object({
    rating: z.number().min(1).max(5),
    evidence: z.string().min(1, 'Evidence is required'),
    developmentNeeds: z.string().optional()
  }),
  teamwork: z.object({
    rating: z.number().min(1).max(5),
    evidence: z.string().min(1, 'Evidence is required'),
    developmentNeeds: z.string().optional()
  }),

  // Leadership Competencies (if applicable)
  leadershipCompetencies: z.object({
    isApplicable: z.boolean(),
    visionAndStrategy: z.object({
      rating: z.number().min(1).max(5),
      evidence: z.string(),
      developmentNeeds: z.string()
    }).optional(),
    peopleManagement: z.object({
      rating: z.number().min(1).max(5),
      evidence: z.string(),
      developmentNeeds: z.string()
    }).optional(),
    changeManagement: z.object({
      rating: z.number().min(1).max(5),
      evidence: z.string(),
      developmentNeeds: z.string()
    }).optional()
  }),

  // Overall Assessment
  overallRating: z.number().min(1).max(5),
  keyStrengths: z.string().min(1, 'Key strengths are required'),
  developmentAreas: z.string().min(1, 'Development areas are required'),
  actionPlan: z.string().min(1, 'Action plan is required'),
  timeline: z.string().min(1, 'Timeline is required'),

  // Comments and Acknowledgment
  evaluatorComments: z.string().min(1, 'Evaluator comments are required'),
  employeeComments: z.string().optional(),
  employeeAcknowledgment: z.boolean(),
  acknowledgmentDate: z.string().optional()
});

// Type inference
type JobCompetencyForm = z.infer<typeof jobCompetencySchema>;

// Form metadata with enhanced help text
const formFields = {
  employeeId: {
    label: 'Employee ID',
    helpText: 'Unique identifier for the employee'
  },
  employeeName: {
    label: 'Employee Name',
    helpText: 'Full name of the employee being evaluated'
  },
  position: {
    label: 'Position',
    helpText: 'Current job title or role'
  },
  department: {
    label: 'Department',
    helpText: 'Department or division name'
  },
  evaluationDate: {
    label: 'Evaluation Date',
    helpText: 'Date of competency assessment'
  },
  evaluator: {
    label: 'Evaluator Name',
    helpText: 'Name of the person conducting the assessment'
  },
  // Core Competencies
  'jobKnowledge.rating': {
    label: 'Job Knowledge',
    helpText: 'Understanding and application of job-related knowledge',
    ratingLabels: {
      1: 'Needs significant improvement',
      2: 'Developing',
      3: 'Meets expectations',
      4: 'Exceeds expectations',
      5: 'Outstanding'
    }
  },
  'jobKnowledge.evidence': {
    label: 'Evidence/Examples',
    helpText: 'Provide specific examples demonstrating job knowledge'
  },
  'jobKnowledge.developmentNeeds': {
    label: 'Development Needs',
    helpText: 'Areas where improvement is needed'
  },
  // Add similar fields for other competencies...
  
  // Overall Assessment
  overallRating: {
    label: 'Overall Performance Rating',
    helpText: 'Overall assessment of employee competency',
    ratingLabels: {
      1: 'Unsatisfactory',
      2: 'Needs Improvement',
      3: 'Meets Expectations',
      4: 'Exceeds Expectations',
      5: 'Outstanding'
    }
  },
  keyStrengths: {
    label: 'Key Strengths',
    helpText: 'Major strengths and accomplishments demonstrated'
  },
  developmentAreas: {
    label: 'Areas for Development',
    helpText: 'Key areas requiring improvement or development'
  },
  actionPlan: {
    label: 'Development Action Plan',
    helpText: 'Specific actions to be taken for improvement'
  },
  timeline: {
    label: 'Timeline',
    helpText: 'Expected timeline for completing development actions'
  },
  evaluatorComments: {
    label: 'Evaluator Comments',
    helpText: 'Additional comments or observations from the evaluator'
  },
  employeeComments: {
    label: 'Employee Comments',
    helpText: 'Optional comments or feedback from the employee'
  },
  employeeAcknowledgment: {
    label: 'Employee Acknowledgment',
    helpText: 'I acknowledge that I have reviewed this assessment with my evaluator'
  },
  acknowledgmentDate: {
    label: 'Acknowledgment Date',
    helpText: 'Date when employee acknowledged the assessment'
  }
};

export function JobCompetencyAssessmentTemplate({ 
  onSubmit 
}: { 
  onSubmit?: (data: JobCompetencyForm) => void 
}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<JobCompetencyForm>({
    resolver: zodResolver(jobCompetencySchema)
  });

  const isLeadershipApplicable = watch('leadershipCompetencies.isApplicable');

  const handleFormSubmit = (data: JobCompetencyForm) => {
    if (onSubmit) {
      onSubmit(data);
    } else {
      console.log('Form submitted:', data);
    }
  };

  const renderCompetencySection = (
    name: string,
    label: string,
    helpText: string
  ) => (
    <div className="space-y-4 border p-4 rounded-md">
      <h3 className="font-semibold text-lg">{label}</h3>
      <FormField
        as="rating"
        label="Rating"
        error={errors[name]?.rating?.message}
        helpText={helpText}
        {...register(`${name}.rating`, { valueAsNumber: true })}
      />
      <FormField
        as="textarea"
        label="Evidence/Examples"
        error={errors[name]?.evidence?.message}
        helpText="Provide specific examples"
        {...register(`${name}.evidence`)}
      />
      <FormField
        as="textarea"
        label="Development Needs"
        error={errors[name]?.developmentNeeds?.message}
        helpText="Areas for improvement"
        {...register(`${name}.developmentNeeds`)}
      />
    </div>
  );

  return (
    <form 
      id="job-competency-form"
      onSubmit={handleSubmit(handleFormSubmit)} 
      className="space-y-8"
    >
      {/* Employee Information */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold border-b pb-2">Employee Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label={formFields.employeeId.label}
            error={errors.employeeId?.message}
            helpText={formFields.employeeId.helpText}
            {...register('employeeId')}
          />
          <FormField
            label={formFields.employeeName.label}
            error={errors.employeeName?.message}
            helpText={formFields.employeeName.helpText}
            {...register('employeeName')}
          />
          <FormField
            label={formFields.position.label}
            error={errors.position?.message}
            helpText={formFields.position.helpText}
            {...register('position')}
          />
          <FormField
            label={formFields.department.label}
            error={errors.department?.message}
            helpText={formFields.department.helpText}
            {...register('department')}
          />
          <FormField
            type="date"
            label={formFields.evaluationDate.label}
            error={errors.evaluationDate?.message}
            helpText={formFields.evaluationDate.helpText}
            {...register('evaluationDate')}
          />
          <FormField
            label={formFields.evaluator.label}
            error={errors.evaluator?.message}
            helpText={formFields.evaluator.helpText}
            {...register('evaluator')}
          />
        </div>
      </div>

      {/* Core Competencies */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold border-b pb-2">Core Competencies</h2>
        {renderCompetencySection(
          'jobKnowledge',
          'Job Knowledge',
          'Understanding and application of job-related knowledge'
        )}
        {renderCompetencySection(
          'technicalSkills',
          'Technical Skills',
          'Proficiency in required technical skills'
        )}
        {renderCompetencySection(
          'problemSolving',
          'Problem Solving',
          'Ability to analyze and resolve issues'
        )}
        {renderCompetencySection(
          'communication',
          'Communication',
          'Effectiveness in verbal and written communication'
        )}
        {renderCompetencySection(
          'teamwork',
          'Teamwork',
          'Ability to work collaboratively with others'
        )}
      </div>

      {/* Leadership Competencies */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold border-b pb-2">Leadership Competencies</h2>
        <FormField
          as="checkbox"
          label="Applicable for Leadership Role"
          {...register('leadershipCompetencies.isApplicable')}
        />
        
        {isLeadershipApplicable && (
          <div className="space-y-6 pl-4">
            {renderCompetencySection(
              'leadershipCompetencies.visionAndStrategy',
              'Vision and Strategy',
              'Ability to set and communicate organizational direction'
            )}
            {renderCompetencySection(
              'leadershipCompetencies.peopleManagement',
              'People Management',
              'Ability to lead and develop team members'
            )}
            {renderCompetencySection(
              'leadershipCompetencies.changeManagement',
              'Change Management',
              'Ability to lead and manage change effectively'
            )}
          </div>
        )}
      </div>

      {/* Overall Assessment */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold border-b pb-2">Overall Assessment</h2>
        <FormField
          as="rating"
          label={formFields.overallRating.label}
          error={errors.overallRating?.message}
          helpText={formFields.overallRating.helpText}
          {...register('overallRating', { valueAsNumber: true })}
        />
        <FormField
          as="textarea"
          label={formFields.keyStrengths.label}
          error={errors.keyStrengths?.message}
          helpText={formFields.keyStrengths.helpText}
          {...register('keyStrengths')}
        />
        <FormField
          as="textarea"
          label={formFields.developmentAreas.label}
          error={errors.developmentAreas?.message}
          helpText={formFields.developmentAreas.helpText}
          {...register('developmentAreas')}
        />
        <FormField
          as="textarea"
          label={formFields.actionPlan.label}
          error={errors.actionPlan?.message}
          helpText={formFields.actionPlan.helpText}
          {...register('actionPlan')}
        />
        <FormField
          label={formFields.timeline.label}
          error={errors.timeline?.message}
          helpText={formFields.timeline.helpText}
          {...register('timeline')}
        />
      </div>

      {/* Comments and Acknowledgment */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold border-b pb-2">Comments and Acknowledgment</h2>
        <FormField
          as="textarea"
          label={formFields.evaluatorComments.label}
          error={errors.evaluatorComments?.message}
          helpText={formFields.evaluatorComments.helpText}
          {...register('evaluatorComments')}
        />
        <FormField
          as="textarea"
          label={formFields.employeeComments.label}
          error={errors.employeeComments?.message}
          helpText={formFields.employeeComments.helpText}
          {...register('employeeComments')}
        />
        <div className="space-y-4">
          <FormField
            as="checkbox"
            label={formFields.employeeAcknowledgment.label}
            error={errors.employeeAcknowledgment?.message}
            helpText={formFields.employeeAcknowledgment.helpText}
            {...register('employeeAcknowledgment')}
          />
          <FormField
            type="date"
            label={formFields.acknowledgmentDate.label}
            error={errors.acknowledgmentDate?.message}
            helpText={formFields.acknowledgmentDate.helpText}
            {...register('acknowledgmentDate')}
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          className="px-4 py-2 border rounded-md hover:bg-gray-100"
          onClick={() => window.print()}
        >
          Print Assessment
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
        >
          Submit Assessment
        </button>
      </div>
    </form>
  );
}

// Export the schema for use in API validation
export { jobCompetencySchema };
export type { JobCompetencyForm };
