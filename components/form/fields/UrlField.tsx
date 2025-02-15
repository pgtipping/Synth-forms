import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../../ui/form';
import { UrlFieldType } from '../../../types/form-schema';

type Props = Omit<UrlFieldType, 'type'>;

export const UrlField: React.FC<Props> = ({ id, name, label, placeholder, helpText, validation, disabled, className }) => {
  const { control } = useFormContext();

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
              type="url"
              placeholder={placeholder}
              disabled={disabled}
              className={className}
              pattern={validation?.pattern}
            />
          </FormControl>
          {helpText && <FormDescription>{helpText}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
