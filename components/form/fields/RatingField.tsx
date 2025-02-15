import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../../ui/form';
import { RatingFieldType } from '../../../types/form-schema';
import { Star, ThumbsUp, Smile } from 'lucide-react';

type Props = Omit<RatingFieldType, 'type'>;

const EMOJI_MAP = {
  1: '😡',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😄'
};

export const RatingField: React.FC<Props> = ({ 
  id, 
  name, 
  label, 
  helpText, 
  validation, 
  disabled, 
  className,
  min,
  max,
  step,
  style,
  labels,
  customIcons
}) => {
  const { control } = useFormContext();

  const renderIcon = (value: number, isSelected: boolean) => {
    const commonProps = {
      className: `w-6 h-6 ${isSelected ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`,
      strokeWidth: 1
    };

    switch (style) {
      case 'stars':
        return <Star {...commonProps} />;
      case 'emoji':
        return <span className={`text-2xl ${isSelected ? 'opacity-100' : 'opacity-30'}`}>
          {EMOJI_MAP[value as keyof typeof EMOJI_MAP] || '😐'}
        </span>;
      case 'custom':
        if (customIcons?.[value - 1]) {
          return <img 
            src={customIcons[value - 1]} 
            alt={`Rating ${value}`} 
            className={`w-6 h-6 ${isSelected ? 'opacity-100' : 'opacity-30'}`}
          />;
        }
        return <Star {...commonProps} />;
      default:
        return <span className={`text-lg font-semibold ${isSelected ? 'text-blue-600' : 'text-gray-300'}`}>
          {value}
        </span>;
    }
  };

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-2">
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="flex gap-2 items-center">
              {Array.from({ length: (max - min) / step + 1 }, (_, i) => min + i * step).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => field.onChange(value)}
                  disabled={disabled}
                  className={`p-1 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    field.value >= value ? 'scale-110' : ''
                  } ${className}`}
                >
                  {renderIcon(value, field.value >= value)}
                  {labels?.[value] && (
                    <span className="text-sm text-gray-600 block mt-1">
                      {labels[value]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </FormControl>
          {helpText && <FormDescription>{helpText}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
