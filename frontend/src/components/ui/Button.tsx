"use client";

import React from "react";

type ButtonVariant = "primary" | "secondary" | "destructive";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  loadingText?: string;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-emerald-500 hover:bg-emerald-800 text-white focus:ring-emerald-500",
  secondary:
    "border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 focus:ring-emerald-500",
  destructive:
    "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 focus:ring-red-500",
};

export default function Button({
  variant = "primary",
  isLoading = false,
  loadingText,
  disabled,
  children,
  className = "",
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`w-full flex items-center justify-center gap-2 rounded-md text-sm font-medium py-2.5 transition-colors duration-150 hover:cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    >
      {isLoading ? (loadingText ?? "Loading...") : children}
    </button>
  );
}