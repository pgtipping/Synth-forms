import React from 'react';
import { useFormContext } from 'react-hook-form';
import { DateFieldType } from '../../../types/form-schema';

type DateFieldProps = DateFieldType & {
  className?: string;
};

export const DateField: React.FC<DateFieldProps> = ({
  id,
  name,
  label,
  placeholder,
  helpText,
  disabled,
  className,
  validation,
  defaultValue,
  format,
}) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const error = errors[name];
  const inputProps = register(name, {
    required: validation?.required ? 'This field is required' : false,
    validate: (value) => {
      if (!value) return true;
      const date = new Date(value);
      return !isNaN(date.getTime()) || 'Invalid date format';
    },
  });

  // Convert defaultValue to YYYY-MM-DD format for HTML date input
  const formatDateValue = (value: any) => {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="form-field">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
        {validation?.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        id={id}
        type="date"
        {...inputProps}
        placeholder={placeholder}
        disabled={disabled}
        defaultValue={formatDateValue(defaultValue)}
        className={`
          w-full px-3 py-2 border rounded-md shadow-sm
          focus:ring-primary-500 focus:border-primary-500
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${className || ''}
        `}
      />
      {helpText && (
        <p className="mt-1 text-sm text-gray-500">{helpText}</p>
      )}
      {error && (
        <p className="mt-1 text-sm text-red-500">
          {error.message as string}
        </p>
      )}
    </div>
  );
};
