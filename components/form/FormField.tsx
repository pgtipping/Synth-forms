import React from 'react';
import { useFormContext } from 'react-hook-form';
import {
  TextFieldType,
  SelectFieldType,
  CheckboxFieldType,
  RadioFieldType,
  DateFieldType,
  FileFieldType,
  NumberFieldType,
  UrlFieldType,
  CurrencyFieldType,
  ColorFieldType,
  RatingFieldType,
  SignatureFieldType,
} from '../../types/form-schema';
import { TextField } from './fields/TextField';
import { SelectField } from './fields/SelectField';
import { CheckboxField } from './fields/CheckboxField';
import { RadioField } from './fields/RadioField';
import { DateField } from './fields/DateField';
import { FileField } from './fields/FileField';
import { NumberField } from './fields/NumberField';
import { UrlField } from './fields/UrlField';
import { CurrencyField } from './fields/CurrencyField';
import { ColorField } from './fields/ColorField';
import { RatingField } from './fields/RatingField';
import { SignatureField } from './fields/SignatureField';

type FieldProps = {
  field:
    | TextFieldType
    | SelectFieldType
    | CheckboxFieldType
    | RadioFieldType
    | DateFieldType
    | FileFieldType
    | NumberFieldType
    | UrlFieldType
    | CurrencyFieldType
    | ColorFieldType
    | RatingFieldType
    | SignatureFieldType;
};

export const FormField: React.FC<FieldProps> = ({ field }) => {
  const { watch } = useFormContext();

  // Handle conditional rendering
  if (field.conditional) {
    const watchedField = watch(field.conditional.field);
    if (watchedField !== field.conditional.value) {
      return null;
    }
  }

  // Handle hidden fields
  if (field.hidden) {
    return null;
  }

  const commonProps = {
    id: field.id,
    name: field.name,
    label: field.label,
    placeholder: field.placeholder,
    helpText: field.helpText,
    disabled: field.disabled,
    hidden: field.hidden,
    className: field.className,
    validation: field.validation,
  };

  switch (field.type) {
    case 'text':
      return <TextField {...commonProps} type="text" multiline={field.multiline} rows={field.rows} />;
    case 'select':
      return <SelectField {...commonProps} type="select" options={field.options} multiple={field.multiple} />;
    case 'checkbox':
      return <CheckboxField {...commonProps} type="checkbox" checked={field.checked} />;
    case 'radio':
      return <RadioField {...commonProps} type="radio" options={field.options} />;
    case 'date':
      return <DateField {...commonProps} type="date" format={field.format} />;
    case 'file':
      return <FileField {...commonProps} type="file" accept={field.accept} multiple={field.multiple} maxSize={field.maxSize} />;
    case 'number':
      return <NumberField {...commonProps} type="number" step={field.step} />;
    case 'url':
      return <UrlField {...commonProps} type="url" pattern={field.pattern} />;
    case 'currency':
      return <CurrencyField {...commonProps} type="currency" currency={field.currency} precision={field.precision} />;
    case 'color':
      return <ColorField {...commonProps} type="color" format={field.format} />;
    case 'rating':
      return <RatingField {...commonProps} type="rating" min={field.min} max={field.max} step={field.step} style={field.style} labels={field.labels} customIcons={field.customIcons} />;
    case 'signature':
      return <SignatureField {...commonProps} type="signature" format={field.format} includeTimestamp={field.includeTimestamp} requireName={field.requireName} />;
    default:
      return null;
  }
};
