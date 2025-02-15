import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '../../ui/input';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../../ui/form';
import { ColorFieldType } from '../../../types/form-schema';

type Props = Omit<ColorFieldType, 'type'>;

export const ColorField: React.FC<Props> = ({ 
  id, 
  name, 
  label, 
  placeholder, 
  helpText, 
  validation, 
  disabled, 
  className,
  format 
}) => {
  const { control } = useFormContext();

  const handleColorChange = (value: string) => {
    if (format === 'rgb' || format === 'rgba') {
      // Convert hex to rgb/rgba
      const hex = value.replace('#', '');
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return format === 'rgb' 
        ? `rgb(${r}, ${g}, ${b})`
        : `rgba(${r}, ${g}, ${b}, 1)`;
    }
    return value;
  };

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="flex items-center gap-2">
              <Input
                {...field}
                id={id}
                type="color"
                placeholder={placeholder}
                disabled={disabled}
                className={`w-12 h-12 p-1 rounded ${className}`}
                onChange={(e) => {
                  const color = handleColorChange(e.target.value);
                  field.onChange(color);
                }}
              />
              <Input
                value={field.value}
                onChange={(e) => {
                  field.onChange(e.target.value);
                }}
                placeholder={format === 'hex' ? '#000000' : format === 'rgb' ? 'rgb(0,0,0)' : 'rgba(0,0,0,1)'}
                className="flex-1"
              />
            </div>
          </FormControl>
          {helpText && <FormDescription>{helpText}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
