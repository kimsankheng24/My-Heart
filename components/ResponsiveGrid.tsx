import React from 'react';
import { cn, CLASSES } from '../utils';

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'dense';
}

/**
 * Standardized card grid component following Section 3.5.1 rules.
 * Automatically applies fluid gaps and provides a container for responsive column classes.
 */
export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({ 
  children, 
  className, 
  variant = 'default' 
}) => {
  return (
    <div 
      className={cn(
        variant === 'dense' ? CLASSES.gridDense : CLASSES.grid,
        className
      )}
    >
      {children}
    </div>
  );
};
