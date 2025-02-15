import React from 'react';
import { useFormContext } from 'react-hook-form';
import { SelectFieldType } from '../../../types/form-schema';

type SelectFieldProps = SelectFieldType & {
  className?: string;
};

export const SelectField: React.FC<SelectFieldProps> = ({
  id,
  name,
  label,
  placeholder,
  helpText,
  disabled,
  className,
  validation,
  defaultValue,
  options,
  multiple,
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
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
        {validation?.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        id={id}
        {...inputProps}
        multiple={multiple}
        disabled={disabled}
        defaultValue={defaultValue as string | string[]}
        className={`
          w-full px-3 py-2 border rounded-md shadow-sm
          focus:ring-primary-500 focus:border-primary-500
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${className || ''}
        `}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
