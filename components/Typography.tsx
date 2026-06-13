import React from 'react';
import { cn, CLASSES } from '../utils';
import { useApp } from '../store';

export type TypographyVariant = 
  | 'h1' 
  | 'h2' 
  | 'h3' 
  | 'body' 
  | 'label' 
  | 'caption' 
  | 'tableHeader' 
  | 'meta' 
  | 'destructive' 
  | 'success'
  | 'muted';

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant?: TypographyVariant;
  as?: React.ElementType;
  children: React.ReactNode;
  htmlFor?: string; // Support for label elements
}

/**
 * Standardized Typography component mapping variants to specific spec-driven CSS classes.
 * Variant-specific line-heights for Khmer are handled via root CSS overrides in index.html.
 */
export const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  as,
  className,
  children,
  ...props
}) => {
  const { settings } = useApp();
  
  const variantMap: Record<TypographyVariant, string> = {
    h1: CLASSES.typography.h1,
    h2: CLASSES.typography.h2,
    h3: CLASSES.typography.h3,
    body: CLASSES.typography.body,
    label: CLASSES.typography.label,
    caption: CLASSES.typography.caption,
    tableHeader: CLASSES.typography.tableHeader,
    meta: CLASSES.typography.meta,
    destructive: CLASSES.typography.destructive,
    success: CLASSES.typography.success,
    muted: CLASSES.typography.muted,
  };

  const defaultElementMap: Record<TypographyVariant, React.ElementType> = {
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    body: 'p',
    label: 'label',
    caption: 'span',
    tableHeader: 'span',
    meta: 'span',
    destructive: 'span',
    success: 'span',
    muted: 'span',
  };

  const Component = as || defaultElementMap[variant];

  return (
    <Component
      className={cn(variantMap[variant], className)}
      lang={settings.language} 
      {...props}
    >
      {children}
    </Component>
  );
};