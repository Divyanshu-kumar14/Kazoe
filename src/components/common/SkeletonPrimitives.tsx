import React from 'react';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

interface SkeletonBoxProps extends SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
}

export const SkeletonBox: React.FC<SkeletonBoxProps> = ({ width = '100%', height = '100%', borderRadius = '0.25rem', className = '', style = {} }) => (
  <div
    className={`skeleton ${className}`}
    style={{ width, height, borderRadius, ...style }}
  />
);

export const SkeletonText: React.FC<SkeletonBoxProps> = ({ width = '100%', height = '14px', className = '', style = {} }) => (
  <div
    className={`skeleton ${className}`}
    style={{ width, height, ...style }}
  />
);

export const SkeletonTitle: React.FC<SkeletonBoxProps> = ({ width = '60%', height = '28px', className = '', style = {} }) => (
  <div
    className={`skeleton ${className}`}
    style={{ width, height, ...style }}
  />
);

export const SkeletonCircle: React.FC<SkeletonBoxProps & { size?: string | number }> = ({ size = '40px', className = '', style = {} }) => (
  <div
    className={`skeleton ${className}`}
    style={{ width: size, height: size, borderRadius: '50%', ...style }}
  />
);

export const SkeletonCard: React.FC<SkeletonProps & { children?: React.ReactNode }> = ({ children, className = '', style = {} }) => (
  <div className={`card ${className}`} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', ...style }}>
    {children}
  </div>
);

export const SkeletonButton: React.FC<SkeletonBoxProps> = ({ width = '120px', height = '48px', className = '', style = {} }) => (
  <div
    className={`skeleton ${className}`}
    style={{ width, height, borderRadius: '0.5rem', ...style }}
  />
);
