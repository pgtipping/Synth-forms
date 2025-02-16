"use client";

import React from "react";
import { Star } from "lucide-react";

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helpText?: string;
  as?: "text" | "rating" | "yesno";
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  helpText,
  as = "text",
  className = "",
  ...props
}) => {
  if (as === "rating") {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        {helpText && <p className="mt-1 text-sm text-gray-500">{helpText}</p>}
        <div className="flex gap-4 mt-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <label key={value} className="flex flex-col items-center">
              <input
                type="radio"
                value={value}
                className="sr-only peer"
                {...props}
              />
              <Star 
                className="w-8 h-8 cursor-pointer peer-checked:text-yellow-400 peer-checked:fill-yellow-400"
                strokeWidth={1}
              />
              <span className="text-xs mt-1">{value}</span>
            </label>
          ))}
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  if (as === "yesno") {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        <div className="flex gap-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              value="yes"
              className="form-radio text-blue-600"
              {...props}
            />
            <span className="ml-2">Yes</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              value="no"
              className="form-radio text-blue-600"
              {...props}
            />
            <span className="ml-2">No</span>
          </label>
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="text"
        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};
