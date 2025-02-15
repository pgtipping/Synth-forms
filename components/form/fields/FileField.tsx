import React, { useCallback, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { FileFieldType } from '../../../types/form-schema';

type FileFieldProps = FileFieldType & {
  className?: string;
};

export const FileField: React.FC<FileFieldProps> = ({
  id,
  name,
  label,
  helpText,
  disabled,
  className,
  validation,
  accept,
  multiple,
  maxSize,
}) => {
  const {
    register,
    formState: { errors },
    setValue,
  } = useFormContext();

  const [fileList, setFileList] = useState<File[]>([]);
  const error = errors[name];

  const validateFiles = useCallback((files: FileList | null): string | true => {
    if (!files) return true;
    if (validation?.required && files.length === 0) {
      return 'This field is required';
    }
    if (!multiple && files.length > 1) {
      return 'Only one file is allowed';
    }
    if (maxSize) {
      for (let i = 0; i < files.length; i++) {
        if (files[i].size > maxSize) {
          return `File size must not exceed ${maxSize / 1024 / 1024}MB`;
        }
      }
    }
    return true;
  }, [multiple, maxSize, validation?.required]);

  const { onChange, ...inputProps } = register(name, {
    required: validation?.required ? 'This field is required' : false,
    validate: validateFiles,
  });

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setFileList(fileArray);
      setValue(name, multiple ? fileArray : fileArray[0], { shouldValidate: true });
    }
  }, [multiple, name, setValue]);

  const removeFile = useCallback((index: number) => {
    setFileList((prev) => {
      const newFiles = [...prev];
      newFiles.splice(index, 1);
      setValue(name, multiple ? newFiles : newFiles[0] || null, { shouldValidate: true });
      return newFiles;
    });
  }, [multiple, name, setValue]);

  return (
    <div className="form-field">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
        {validation?.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="mt-1">
        <div className="flex items-center justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md">
          <div className="space-y-1 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="flex text-sm text-gray-600">
              <label
                htmlFor={id}
                className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
              >
                <span>Upload {multiple ? 'files' : 'a file'}</span>
                <input
                  id={id}
                  {...inputProps}
                  onChange={handleChange}
                  type="file"
                  className="sr-only"
                  disabled={disabled}
                  multiple={multiple}
                  accept={accept}
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">
              {accept ? `Allowed types: ${accept}` : 'Any file type'}
              {maxSize && ` up to ${maxSize / 1024 / 1024}MB`}
            </p>
          </div>
        </div>
      </div>
      {fileList.length > 0 && (
        <ul className="mt-4 space-y-2">
          {fileList.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md"
            >
              <span className="text-sm text-gray-700 truncate">
                {file.name} ({(file.size / 1024).toFixed(1)}KB)
              </span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="ml-2 text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
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
