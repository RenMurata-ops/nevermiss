import React from "react";

export type InputSize = "sm" | "md" | "lg";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: InputSize;
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const sizeStyles: Record<InputSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-4 py-3 text-lg",
};

const iconSizeStyles: Record<InputSize, string> = {
  sm: "pl-9",
  md: "pl-10",
  lg: "pl-12",
};

const rightIconSizeStyles: Record<InputSize, string> = {
  sm: "pr-9",
  md: "pr-10",
  lg: "pr-12",
};

export function Input({
  size = "md",
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className = "",
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={`${fullWidth ? "w-full" : ""}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500 dark:text-slate-400">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          disabled={disabled}
          className={`
            block rounded-2xl border shadow-sm
            bg-white dark:bg-slate-950
            text-slate-900 dark:text-slate-50
            placeholder:text-slate-500 dark:placeholder:text-slate-400
            border-slate-200 dark:border-slate-700
            focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent
            dark:focus:ring-slate-600
            disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 dark:disabled:bg-slate-900
            transition-colors duration-200
            ${sizeStyles[size]}
            ${leftIcon ? iconSizeStyles[size] : ""}
            ${rightIcon ? rightIconSizeStyles[size] : ""}
            ${error ? "border-red-500 dark:border-red-400 focus:ring-red-500 dark:focus:ring-red-400" : ""}
            ${fullWidth ? "w-full" : ""}
            ${className}
          `}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500 dark:text-slate-400">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
      {hint && !error && (
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      )}
    </div>
  );
}
