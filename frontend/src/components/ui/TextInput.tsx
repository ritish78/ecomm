"use client";

import React from "react";

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
}

export default function TextInput({
  id,
  label,
  className = "",
  ...rest
}: TextInputProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold text-[#701634]"
      >
        {label}
      </label>

      <input {...rest} id={id} className={`brand-input text-sm ${className}`} />
    </div>
  );
}
