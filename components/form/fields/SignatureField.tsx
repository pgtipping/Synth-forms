import React, { useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../../ui/form';
import { SignatureFieldType } from '../../../types/form-schema';
import SignaturePad from 'react-signature-canvas';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';

type Props = Omit<SignatureFieldType, 'type'>;

export const SignatureField: React.FC<Props> = ({ 
  id, 
  name, 
  label, 
  helpText, 
  validation, 
  disabled, 
  className,
  format,
  includeTimestamp,
  requireName
}) => {
  const { control } = useFormContext();
  const signaturePadRef = useRef<SignaturePad>(null);
  const [signedName, setSignedName] = useState('');

  const generateSignature = (drawn?: string) => {
    const timestamp = includeTimestamp ? new Date().toISOString() : undefined;
    return {
      value: drawn || signedName,
      type: format,
      name: requireName ? signedName : undefined,
      timestamp
    };
  };

  const clearSignature = () => {
    if (format === 'draw' && signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
    setSignedName('');
  };

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-4">
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="space-y-4">
              {requireName && (
                <Input
                  type="text"
                  placeholder="Type your full name"
                  value={signedName}
                  onChange={(e) => setSignedName(e.target.value)}
                  disabled={disabled}
                  className="w-full"
                />
              )}

              {format === 'draw' ? (
                <div className="border rounded-md p-2">
                  <SignaturePad
                    ref={signaturePadRef}
                    canvasProps={{
                      className: `w-full h-40 border rounded ${className}`,
                    }}
                    onEnd={() => {
                      if (signaturePadRef.current) {
                        const drawn = signaturePadRef.current.toDataURL();
                        field.onChange(generateSignature(drawn));
                      }
                    }}
                  />
                </div>
              ) : (
                <Input
                  type="text"
                  placeholder="Type your signature"
                  value={field.value?.value || ''}
                  onChange={(e) => field.onChange(generateSignature(e.target.value))}
                  disabled={disabled}
                  className={`font-signature ${className}`}
                />
              )}

              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={clearSignature}
                  disabled={disabled}
                >
                  Clear
                </Button>
              </div>

              {includeTimestamp && field.value?.timestamp && (
                <p className="text-sm text-gray-500">
                  Signed on: {new Date(field.value.timestamp).toLocaleString()}
                </p>
              )}
            </div>
          </FormControl>
          {helpText && <FormDescription>{helpText}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
