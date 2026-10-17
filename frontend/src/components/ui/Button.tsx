"use client";

import React from "react";

type ButtonVariant = "primary" | "secondary" | "destructive";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  loadingText?: string;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "",
  secondary: "brand-button-secondary",
  destructive: "brand-button-destructive",
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
      {...rest}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      className={`brand-button w-full text-sm ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {isLoading ? (loadingText ?? "Loading...") : children}
    </button>
  );
}
