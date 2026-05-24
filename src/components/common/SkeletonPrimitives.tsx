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

/* ─── Module-level constants to avoid re-creating object references on every render ─── */
const EMPTY_STYLE: React.CSSProperties = {};
const SKELETON_BOX_DEFAULTS = { width: '100%', height: '100%', borderRadius: '0.25rem' } as const;
const SKELETON_TEXT_DEFAULTS = { width: '100%', height: '14px' } as const;
const SKELETON_TITLE_DEFAULTS = { width: '60%', height: '28px' } as const;
const SKELETON_CIRCLE_DEFAULTS = { size: '40px' } as const;
const SKELETON_CARD_STYLE: React.CSSProperties = { padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' };
const SKELETON_BUTTON_DEFAULTS = { width: '120px', height: '48px', borderRadius: '0.5rem' } as const;

export const SkeletonBox: React.FC<SkeletonBoxProps> = ({ width = SKELETON_BOX_DEFAULTS.width, height = SKELETON_BOX_DEFAULTS.height, borderRadius = SKELETON_BOX_DEFAULTS.borderRadius, className = '', style = EMPTY_STYLE }) => (
  <div
    className={`skeleton ${className}`}
    style={{ width, height, borderRadius, ...style }}
  />
);

export const SkeletonText: React.FC<SkeletonBoxProps> = ({ width = SKELETON_TEXT_DEFAULTS.width, height = SKELETON_TEXT_DEFAULTS.height, className = '', style = EMPTY_STYLE }) => (
  <div
    className={`skeleton ${className}`}
    style={{ width, height, ...style }}
  />
);

export const SkeletonTitle: React.FC<SkeletonBoxProps> = ({ width = SKELETON_TITLE_DEFAULTS.width, height = SKELETON_TITLE_DEFAULTS.height, className = '', style = EMPTY_STYLE }) => (
  <div
    className={`skeleton ${className}`}
    style={{ width, height, ...style }}
  />
);

export const SkeletonCircle: React.FC<SkeletonBoxProps & { size?: string | number }> = ({ size = SKELETON_CIRCLE_DEFAULTS.size, className = '', style = EMPTY_STYLE }) => (
  <div
    className={`skeleton ${className}`}
    style={{ width: size, height: size, borderRadius: '50%', ...style }}
  />
);

export const SkeletonCard: React.FC<SkeletonProps & { children?: React.ReactNode }> = ({ children, className = '', style = EMPTY_STYLE }) => (
  <div className={`card ${className}`} style={{ ...SKELETON_CARD_STYLE, ...style }}>
    {children}
  </div>
);

export const SkeletonButton: React.FC<SkeletonBoxProps> = ({ width = SKELETON_BUTTON_DEFAULTS.width, height = SKELETON_BUTTON_DEFAULTS.height, className = '', style = EMPTY_STYLE }) => (
  <div
    className={`skeleton ${className}`}
    style={{ width, height, borderRadius: SKELETON_BUTTON_DEFAULTS.borderRadius, ...style }}
  />
);
