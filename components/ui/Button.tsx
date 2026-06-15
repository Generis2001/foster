"use client";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", children, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center gap-1.5 font-semibold rounded-xl transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 select-none tracking-[-0.01em]";

    const variants = {
      primary:
        "bg-[#0E2D6B] hover:bg-[#163a87] active:bg-[#0a2057] text-white shadow-[0_1px_3px_rgba(14,45,107,0.35),0_0_0_1px_rgba(14,45,107,0.18)]",
      secondary:
        "bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-800 border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.07)]",
      outline:
        "bg-transparent hover:bg-blue-50 active:bg-blue-100 text-blue-600 border border-blue-200",
      ghost:
        "text-gray-500 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200",
      danger:
        "bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-600 border border-red-200",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs gap-1",
      md: "px-4 py-2 text-sm",
      lg: "px-5 py-2.5 text-sm",
    };

    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
