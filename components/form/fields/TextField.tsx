import React from 'react';
import { useFormContext } from 'react-hook-form';
import { TextFieldType } from '../../../types/form-schema';
import { cn } from '../../../lib/utils';

interface TextFieldProps extends Omit<TextFieldType, 'type'> {
  className?: string;
}

export const TextField: React.FC<TextFieldProps> = ({
  id,
  name,
  label,
  placeholder,
  helpText,
  disabled,
  className,
  validation,
  multiline = false,
  rows = 3,
}) => {
  const { register, formState: { errors } } = useFormContext();
  const error = errors[name];

  const inputClasses = cn(
    'mt-1 block w-full rounded-md border-gray-300 shadow-sm',
    'focus:border-indigo-500 focus:ring-indigo-500',
    'disabled:cursor-not-allowed disabled:opacity-50',
    error && 'border-red-500',
    className
  );

  const Component = multiline ? 'textarea' : 'input';
  const type = multiline ? undefined : 'text';

  return (
    <div className="form-field">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
        {validation?.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <Component
        id={id}
        type={type}
        {...register(name, validation)}
        placeholder={placeholder}
        disabled={disabled}
        className={inputClasses}
        rows={multiline ? rows : undefined}
      />
      {helpText && (
        <p className="mt-2 text-sm text-gray-500">{helpText}</p>
      )}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error.message}</p>
      )}
    </div>
  );
};
