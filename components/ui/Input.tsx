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
      {label && (
        <label className="block text-sm font-semibold text-gray-700 tracking-[-0.01em]">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`w-full px-3.5 py-2.5 rounded-xl bg-white border ${
          error
            ? "border-red-300 focus:ring-red-400/30 focus:border-red-400"
            : "border-gray-200 focus:ring-blue-500/20 focus:border-blue-500"
        } text-gray-900 placeholder-gray-400 text-sm font-medium focus:outline-none focus:ring-2 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${className}`}
        {...props}
      />
      {hint && !error && <p className="text-xs text-gray-400 font-medium">{hint}</p>}
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
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
      {label && (
        <label className="block text-sm font-semibold text-gray-700 tracking-[-0.01em]">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={`w-full px-3.5 py-2.5 rounded-xl bg-white border ${
          error
            ? "border-red-300 focus:ring-red-400/30 focus:border-red-400"
            : "border-gray-200 focus:ring-blue-500/20 focus:border-blue-500"
        } text-gray-900 placeholder-gray-400 text-sm font-medium focus:outline-none focus:ring-2 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)] resize-none ${className}`}
        {...props}
      />
      {hint && !error && <p className="text-xs text-gray-400 font-medium">{hint}</p>}
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  )
);
Textarea.displayName = "Textarea";
