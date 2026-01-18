import React from "react";

export type SpinnerSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface LoadingSpinnerProps {
  size?: SpinnerSize;
  className?: string;
  label?: string;
  fullScreen?: boolean;
}

const sizeStyles: Record<SpinnerSize, string> = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
};

const labelSizeStyles: Record<SpinnerSize, string> = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
  xl: "text-xl",
};

export function LoadingSpinner({
  size = "md",
  className = "",
  label,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <svg
        className={`animate-spin text-slate-900 dark:text-slate-50 ${sizeStyles[size]}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        role="status"
        aria-label={label || "Loading"}
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {label && (
        <span
          className={`text-slate-500 dark:text-slate-400 ${labelSizeStyles[size]}`}
        >
          {label}
        </span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
}

// Inline loading for buttons or small areas
export interface InlineLoadingProps {
  className?: string;
}

export function InlineLoading({ className = "" }: InlineLoadingProps) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span className="animate-bounce h-1.5 w-1.5 rounded-full bg-current delay-0" />
      <span
        className="animate-bounce h-1.5 w-1.5 rounded-full bg-current"
        style={{ animationDelay: "0.1s" }}
      />
      <span
        className="animate-bounce h-1.5 w-1.5 rounded-full bg-current"
        style={{ animationDelay: "0.2s" }}
      />
    </span>
  );
}

// Skeleton loader for content placeholders
export interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: "none" | "sm" | "md" | "lg" | "full" | "2xl";
}

export function Skeleton({
  className = "",
  width,
  height = "1rem",
  rounded = "md",
}: SkeletonProps) {
  const roundedStyles: Record<string, string> = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
    "2xl": "rounded-2xl",
  };

  return (
    <div
      className={`
        animate-pulse
        bg-slate-100 dark:bg-slate-800
        ${roundedStyles[rounded]}
        ${className}
      `}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}
