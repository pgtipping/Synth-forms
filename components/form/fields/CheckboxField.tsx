import React from 'react';
import { useFormContext } from 'react-hook-form';
import { CheckboxFieldType } from '../../../types/form-schema';

type CheckboxFieldProps = CheckboxFieldType & {
  className?: string;
};

export const CheckboxField: React.FC<CheckboxFieldProps> = ({
  id,
  name,
  label,
  helpText,
  disabled,
  className,
  validation,
  defaultValue,
  checked,
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
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id={id}
            type="checkbox"
            {...inputProps}
            disabled={disabled}
            defaultChecked={defaultValue as boolean ?? checked}
            className={`
              h-4 w-4 rounded border-gray-300 text-primary-600
              focus:ring-primary-500 disabled:bg-gray-100
              disabled:cursor-not-allowed
              ${error ? 'border-red-500' : 'border-gray-300'}
              ${className || ''}
            `}
          />
        </div>
        <div className="ml-3 text-sm">
          <label
            htmlFor={id}
            className={`font-medium text-gray-700 ${
              disabled ? 'cursor-not-allowed opacity-70' : ''
            }`}
          >
            {label}
            {validation?.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {helpText && (
            <p className="text-gray-500">{helpText}</p>
          )}
          {error && (
            <p className="text-red-500">
              {error.message as string}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
