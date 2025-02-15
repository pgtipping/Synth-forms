import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '../../ui/input';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../../ui/form';
import { CurrencyFieldType } from '../../../types/form-schema';

type Props = Omit<CurrencyFieldType, 'type'>;

export const CurrencyField: React.FC<Props> = ({ 
  id, 
  name, 
  label, 
  placeholder, 
  helpText, 
  validation, 
  disabled, 
  className,
  currency,
  precision 
}) => {
  const { control } = useFormContext();

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: precision || 2,
      maximumFractionDigits: precision || 2,
    }).format(num);
  };

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              {...field}
              id={id}
              type="number"
              step={`0.${'0'.repeat(precision - 1)}1`}
              placeholder={placeholder}
              disabled={disabled}
              className={className}
              onChange={(e) => {
                field.onChange(e.target.value);
              }}
              onBlur={(e) => {
                const formattedValue = formatCurrency(e.target.value);
                e.target.value = formattedValue;
                field.onBlur();
              }}
            />
          </FormControl>
          {helpText && <FormDescription>{helpText}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
