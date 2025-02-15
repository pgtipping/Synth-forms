import React from 'react';
import { useFormContext } from 'react-hook-form';
import { NumberFieldType } from '../../../types/form-schema';

type NumberFieldProps = NumberFieldType & {
  className?: string;
};

export const NumberField: React.FC<NumberFieldProps> = ({
  id,
  name,
  label,
  placeholder,
  helpText,
  disabled,
  className,
  validation,
  defaultValue,
  step,
}) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const error = errors[name];
  const inputProps = register(name, {
    required: validation?.required ? 'This field is required' : false,
    min: validation?.min
      ? {
          value: validation.min,
          message: `Minimum value is ${validation.min}`,
        }
      : undefined,
    max: validation?.max
      ? {
          value: validation.max,
          message: `Maximum value is ${validation.max}`,
        }
      : undefined,
    valueAsNumber: true,
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
      <div className="relative rounded-md shadow-sm">
        <input
          id={id}
          type="number"
          step={step}
          {...inputProps}
          placeholder={placeholder}
          disabled={disabled}
          defaultValue={defaultValue as number}
          className={`
            w-full px-3 py-2 border rounded-md shadow-sm
            focus:ring-primary-500 focus:border-primary-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${error ? 'border-red-500' : 'border-gray-300'}
            ${className || ''}
          `}
        />
        {step && (
          <div className="absolute inset-y-0 right-0 flex items-center">
            <div className="flex flex-col h-full">
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById(id) as HTMLInputElement;
                  const currentValue = parseFloat(input.value) || 0;
                  input.value = (currentValue + (step || 1)).toString();
                  input.dispatchEvent(new Event('input', { bubbles: true }));
                }}
                className="flex-1 px-2 text-gray-500 hover:text-gray-700 border-l border-gray-300"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById(id) as HTMLInputElement;
                  const currentValue = parseFloat(input.value) || 0;
                  input.value = (currentValue - (step || 1)).toString();
                  input.dispatchEvent(new Event('input', { bubbles: true }));
                }}
                className="flex-1 px-2 text-gray-500 hover:text-gray-700 border-l border-t border-gray-300"
              >
                ▼
              </button>
            </div>
          </div>
        )}
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
