import React from "react";

export type CardVariant = "default" | "outlined" | "elevated";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: "none" | "sm" | "md" | "lg";
  hoverable?: boolean;
  as?: React.ElementType;
}

const variantStyles: Record<CardVariant, string> = {
  default:
    "bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700",
  outlined:
    "bg-transparent border-2 border-slate-200 dark:border-slate-700",
  elevated:
    "bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 shadow-sm",
};

const paddingStyles: Record<"none" | "sm" | "md" | "lg", string> = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export function Card({
  variant = "default",
  padding = "md",
  hoverable = false,
  as: Component = "div",
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <Component
      className={`
        rounded-2xl
        ${variantStyles[variant]}
        ${paddingStyles[padding]}
        ${hoverable ? "transition-all duration-200 hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer" : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </Component>
  );
}

// Sub-components for structured card layouts
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function CardHeader({
  title,
  subtitle,
  action,
  className = "",
  children,
  ...props
}: CardHeaderProps) {
  return (
    <div
      className={`flex items-start justify-between gap-4 ${className}`}
      {...props}
    >
      <div className="flex-1">
        {title && (
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {subtitle}
          </p>
        )}
        {children}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

export interface CardContentProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export function CardContent({
  className = "",
  children,
  ...props
}: CardContentProps) {
  return (
    <div className={`mt-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "left" | "center" | "right" | "between";
}

export function CardFooter({
  align = "right",
  className = "",
  children,
  ...props
}: CardFooterProps) {
  const alignStyles: Record<"left" | "center" | "right" | "between", string> = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
    between: "justify-between",
  };

  return (
    <div
      className={`
        flex items-center gap-3 mt-4 pt-4
        border-t border-slate-200 dark:border-slate-700
        ${alignStyles[align]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
