import React from 'react';
import { useFormContext } from 'react-hook-form';
import { RadioFieldType } from '../../../types/form-schema';

type RadioFieldProps = RadioFieldType & {
  className?: string;
};

export const RadioField: React.FC<RadioFieldProps> = ({
  id,
  name,
  label,
  helpText,
  disabled,
  className,
  validation,
  defaultValue,
  options,
}) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const error = errors[name];
  const inputProps = register(name, {
    required: validation?.required ? 'This field is required' : false,
  });

  return (
    <div className="form-field">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {validation?.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="space-y-4">
        {options.map((option) => (
          <div key={option.value} className="flex items-center">
            <input
              id={`${id}-${option.value}`}
              type="radio"
              {...inputProps}
              value={option.value}
              disabled={disabled}
              defaultChecked={defaultValue === option.value}
              className={`
                h-4 w-4 border-gray-300 text-primary-600
                focus:ring-primary-500 disabled:bg-gray-100
                disabled:cursor-not-allowed
                ${error ? 'border-red-500' : 'border-gray-300'}
                ${className || ''}
              `}
            />
            <label
              htmlFor={`${id}-${option.value}`}
              className={`ml-3 block text-sm font-medium text-gray-700 ${
                disabled ? 'cursor-not-allowed opacity-70' : ''
              }`}
            >
              {option.label}
            </label>
          </div>
        ))}
      </div>
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
