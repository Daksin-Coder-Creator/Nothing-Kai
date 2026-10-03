import React from 'react';
import { Rotating3DAtom } from './Rotating3DAtom';

export interface IconAtomProps {
  className?: string;
  size?: number;
  variant?: 'hero' | 'header' | 'thinking' | 'inline';
  isReducedMotion?: boolean;
}

export const IconAtom: React.FC<IconAtomProps> = ({
  className = '',
  size,
  variant = 'inline',
  isReducedMotion = false,
}) => {
  // Determine size based on variant if not explicitly passed
  let pixelSize = size;
  if (!pixelSize) {
    if (variant === 'hero') pixelSize = 96;
    else if (variant === 'header') pixelSize = 32;
    else if (variant === 'thinking') pixelSize = 24;
    else pixelSize = 20;
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: pixelSize, height: pixelSize }}
      title="Nothing-Ai — Nothing Engine"
    >
      <Rotating3DAtom size={pixelSize} interactive={variant === 'hero'} monochrome={false} />
    </div>
  );
};
