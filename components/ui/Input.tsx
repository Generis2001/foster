"use client";
import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", ...props }, ref) => (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <input
        ref={ref}
        className={`w-full px-3.5 py-2.5 rounded-lg bg-white border ${
          error ? "border-red-300 focus:ring-red-500" : "border-gray-200 focus:ring-blue-500"
        } text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-blue-500 transition-all shadow-sm ${className}`}
        {...props}
      />
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
);
Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = "", ...props }, ref) => (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <textarea
        ref={ref}
        className={`w-full px-3.5 py-2.5 rounded-lg bg-white border ${
          error ? "border-red-300 focus:ring-red-500" : "border-gray-200 focus:ring-blue-500"
        } text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-blue-500 transition-all shadow-sm resize-none ${className}`}
        {...props}
      />
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
);
Textarea.displayName = "Textarea";
