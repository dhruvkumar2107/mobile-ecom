'use client';

import { forwardRef } from 'react';
import { mobileDesign } from '@/lib/mobile-design';
import { cn } from '@/lib/utils';

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'solid' | 'dashed' | 'dotted';
  thickness?: 'thin' | 'medium' | 'thick';
  label?: string;
  labelPosition?: 'start' | 'center' | 'end';
}

const thicknessStyles = {
  thin: '1px',
  medium: '2px',
  thick: '3px',
};

export const Divider = forwardRef<HTMLDivElement, DividerProps>(
  (
    {
      orientation = 'horizontal',
      variant = 'solid',
      thickness = 'thin',
      label,
      labelPosition = 'center',
      className,
      style,
      ...props
    },
    ref
  ) => {
    const borderStyle = variant === 'dashed' ? 'dashed' : variant === 'dotted' ? 'dotted' : 'solid';
    const borderWidth = thicknessStyles[thickness];

    if (label) {
      return (
        <div
          ref={ref}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: `${mobileDesign.spacing.md}px`,
            width: orientation === 'horizontal' ? '100%' : 'auto',
            height: orientation === 'vertical' ? '100%' : 'auto',
            fontSize: '12px',
            fontWeight: 500,
            fontFamily: mobileDesign.typography.fontFamily,
            color: mobileDesign.colors.textTertiary,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            ...style,
          }}
          className={cn('mobile-divider', className)}
          role="separator"
          {...props}
        >
          <div
            style={{
              flex: labelPosition === 'start' ? '0 0 auto' : labelPosition === 'end' ? '0 0 auto' : 1,
              minWidth: 0,
              borderTop: orientation === 'horizontal' ? `${borderWidth} ${borderStyle} ${mobileDesign.colors.border}` : 'none',
              borderLeft: orientation === 'vertical' ? `${borderWidth} ${borderStyle} ${mobileDesign.colors.border}` : 'none',
            }}
            aria-hidden="true"
          />
          <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>{label}</span>
          <div
            style={{
              flex: labelPosition === 'start' ? 1 : labelPosition === 'end' ? '0 0 auto' : 1,
              minWidth: 0,
              borderTop: orientation === 'horizontal' ? `${borderWidth} ${borderStyle} ${mobileDesign.colors.border}` : 'none',
              borderLeft: orientation === 'vertical' ? `${borderWidth} ${borderStyle} ${mobileDesign.colors.border}` : 'none',
            }}
            aria-hidden="true"
          />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        style={{
          width: orientation === 'horizontal' ? '100%' : borderWidth,
          height: orientation === 'vertical' ? '100%' : borderWidth,
          borderTop: orientation === 'horizontal' ? `${borderWidth} ${borderStyle} ${mobileDesign.colors.border}` : 'none',
          borderLeft: orientation === 'vertical' ? `${borderWidth} ${borderStyle} ${mobileDesign.colors.border}` : 'none',
          ...style,
        }}
        className={cn('mobile-divider', className)}
        role="separator"
        {...props}
      />
    );
  }
);

Divider.displayName = 'Divider';

export interface ListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  avatar?: React.ReactNode;
  title: string;
  subtitle?: string;
  description?: string;
  trailing?: React.ReactNode;
  action?: React.ReactNode;
  onClick?: () => void;
  pressable?: boolean;
  divider?: boolean;
  inset?: boolean;
}

export const ListItem = forwardRef<HTMLDivElement, ListItemProps>(
  (
    {
      icon,
      avatar,
      title,
      subtitle,
      description,
      trailing,
      action,
      onClick,
      pressable = false,
      divider = true,
      inset = false,
      children,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const Content = (pressable ? 'button' : 'div') as 'div';

    return (
      <Content
        ref={ref}
        onClick={onClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: `${mobileDesign.spacing.md}px`,
          padding: `${mobileDesign.spacing.md}px ${inset ? mobileDesign.spacing.md : mobileDesign.spacing.lg}px`,
          background: 'transparent',
          border: 'none',
          cursor: pressable ? 'pointer' : 'default',
          width: '100%',
          textAlign: 'left',
          ...style,
        }}
        className={cn('mobile-list-item', className)}
        {...props}
      >
        {(icon || avatar) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: `${mobileDesign.borderRadius.md}px`,
              background: mobileDesign.colors.borderLight,
              flexShrink: 0,
              color: mobileDesign.colors.textSecondary,
            }}
          >
            {avatar || icon}
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: '15px',
              fontWeight: 500,
              fontFamily: mobileDesign.typography.fontFamily,
              color: mobileDesign.colors.textPrimary,
              lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {title}
          </p>
          {subtitle && (
            <p
              style={{
                margin: '2px 0 0',
                fontSize: '13px',
                fontWeight: 400,
                fontFamily: mobileDesign.typography.fontFamily,
                color: mobileDesign.colors.textSecondary,
                lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {subtitle}
            </p>
          )}
          {description && (
            <p
              style={{
                margin: '2px 0 0',
                fontSize: '12px',
                fontWeight: 400,
                fontFamily: mobileDesign.typography.fontFamily,
                color: mobileDesign.colors.textTertiary,
                lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {description}
            </p>
          )}
        </div>

        {trailing && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: `${mobileDesign.spacing.sm}px`,
              flexShrink: 0,
            }}
          >
            {trailing}
          </div>
        )}

        {action && (
          <div style={{ flexShrink: 0 }}>{action}</div>
        )}

        {children}
      </Content>
    );
  }
);

ListItem.displayName = 'ListItem';

export interface ListProps extends React.HTMLAttributes<HTMLDivElement> {
  divider?: boolean;
  inset?: boolean;
}

export const List = forwardRef<HTMLDivElement, ListProps>(
  (
    {
      divider = true,
      inset = false,
      children,
      className,
      style,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        style={{
          background: mobileDesign.colors.surface,
          borderRadius: `${mobileDesign.borderRadius.lg}px`,
          border: `1px solid ${mobileDesign.colors.borderLight}`,
          overflow: 'hidden',
          ...style,
        }}
        className={cn('mobile-list', className)}
        {...props}
      >
        {typeof children === 'function'
          ? (children as (ctx: { divider: boolean; inset: boolean }) => React.ReactNode)({ divider, inset })
          : children}
      </div>
    );
  }
);

List.displayName = 'List';

export interface SectionListProps extends React.HTMLAttributes<HTMLDivElement> {
  sections: Array<{
    title: string;
    items: React.ReactNode[];
    footer?: React.ReactNode;
  }>;
  divider?: boolean;
  inset?: boolean;
}

export function SectionList({ sections, divider = true, inset = false, className, style, ...props }: SectionListProps) {
  return (
    <div
      style={{
        background: mobileDesign.colors.surface,
        borderRadius: `${mobileDesign.borderRadius.lg}px`,
        border: `1px solid ${mobileDesign.colors.borderLight}`,
        overflow: 'hidden',
        ...style,
      }}
      className={cn('mobile-section-list', className)}
      {...props}
    >
      {sections.map((section, sectionIndex) => (
        <div key={sectionIndex}>
          <div
            style={{
              padding: `${mobileDesign.spacing.md}px ${inset ? mobileDesign.spacing.md : mobileDesign.spacing.lg}px`,
              borderBottom: sectionIndex > 0 ? `1px solid ${mobileDesign.colors.borderLight}` : 'none',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '12px',
                fontWeight: 600,
                fontFamily: mobileDesign.typography.fontFamily,
                color: mobileDesign.colors.textTertiary,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              {section.title}
            </p>
          </div>
          <div>
            {section.items.map((item, itemIndex) => (
              <div
                key={itemIndex}
                style={{
                  borderBottom: divider && itemIndex < section.items.length - 1 ? `1px solid ${mobileDesign.colors.borderLight}` : 'none',
                }}
              >
                {item}
              </div>
            ))}
          </div>
          {section.footer && (
            <div
              style={{
                padding: `${mobileDesign.spacing.md}px ${inset ? mobileDesign.spacing.md : mobileDesign.spacing.lg}px`,
                borderTop: `1px solid ${mobileDesign.colors.borderLight}`,
                background: mobileDesign.colors.borderLight,
              }}
            >
              {section.footer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export interface StepperProps {
  steps: Array<{
    label: string;
    description?: string;
    icon?: React.ReactNode;
    completed?: boolean;
    active?: boolean;
    error?: boolean;
  }>;
  currentStep: number;
  orientation?: 'vertical' | 'horizontal';
  variant?: 'default' | 'compact';
  onStepClick?: (index: number) => void;
}

export function Stepper({
  steps,
  currentStep,
  orientation = 'vertical',
  variant = 'default',
  onStepClick,
}: StepperProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: orientation === 'vertical' ? 'column' : 'row',
        gap: orientation === 'vertical' ? `${mobileDesign.spacing.xl}px` : `${mobileDesign.spacing.lg}px`,
      }}
      role="list"
      aria-label="Progress steps"
    >
      {steps.map((step, index) => {
        const isCompleted = step.completed ?? index < currentStep;
        const isActive = step.active ?? index === currentStep;
        const isError = step.error ?? false;
        const isLast = index === steps.length - 1;

        const stepColor = isError
          ? 'var(--mobile-color-error)'
          : isCompleted || isActive
          ? 'var(--mobile-color-accent)'
          : 'var(--mobile-color-border)';
        const stepBg = isError
          ? 'var(--mobile-color-error-light)'
          : isCompleted || isActive
          ? 'var(--mobile-color-accent-light)'
          : 'var(--mobile-color-border-light)';
        const labelColor = isError
          ? 'var(--mobile-color-error)'
          : isActive
          ? 'var(--mobile-color-text-primary)'
          : 'var(--mobile-color-text-secondary)';
        const descColor = isActive
          ? 'var(--mobile-color-text-secondary)'
          : 'var(--mobile-color-text-tertiary)';

        return (
          <div
            key={index}
            style={{
              display: 'flex',
              flexDirection: orientation === 'vertical' ? 'row' : 'column',
              alignItems: orientation === 'vertical' ? 'flex-start' : 'center',
              gap: orientation === 'vertical' ? `${mobileDesign.spacing.md}px` : `${mobileDesign.spacing.sm}px`,
              flex: orientation === 'horizontal' ? 1 : 0,
              position: 'relative',
              cursor: onStepClick ? 'pointer' : 'default',
            }}
            onClick={() => onStepClick?.(index)}
            role="listitem"
          >
            <div
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: 'relative',
                  zIndex: 1,
                  width: variant === 'compact' ? '24px' : '32px',
                  height: variant === 'compact' ? '24px' : '32px',
                  borderRadius: '50%',
                  background: stepBg,
                  border: `2px solid ${stepColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: stepColor,
                  fontSize: variant === 'compact' ? '11px' : '13px',
                  fontWeight: 700,
                  fontFamily: mobileDesign.typography.fontFamily,
                  transition: `all ${mobileDesign.transitions.normal}`,
                }}
              >
                {isCompleted && !isError ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} style={{ width: variant === 'compact' ? 12 : 16, height: variant === 'compact' ? 12 : 16 }} aria-hidden="true">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : isError ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} style={{ width: variant === 'compact' ? 12 : 16, height: variant === 'compact' ? 12 : 16 }} aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                ) : step.icon ? (
                  step.icon
                ) : (
                  index + 1
                )}
              </div>

              {!isLast && orientation === 'vertical' && (
                <div
                  style={{
                    position: 'absolute',
                    top: variant === 'compact' ? '24px' : '32px',
                    bottom: 0,
                    left: variant === 'compact' ? '11px' : '15px',
                    width: '2px',
                    background: index < currentStep ? 'var(--mobile-color-accent)' : 'var(--mobile-color-border)',
                    zIndex: 0,
                  }}
                  aria-hidden="true"
                />
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: variant === 'compact' ? '13px' : '14px',
                  fontWeight: isActive ? 600 : 500,
                  fontFamily: mobileDesign.typography.fontFamily,
                  color: labelColor,
                  lineHeight: 1.3,
                }}
              >
                {step.label}
              </p>
              {step.description && (
                <p
                  style={{
                    margin: `${mobileDesign.spacing.xs}px 0 0`,
                    fontSize: variant === 'compact' ? '12px' : '13px',
                    fontWeight: 400,
                    fontFamily: mobileDesign.typography.fontFamily,
                    color: descColor,
                    lineHeight: 1.4,
                  }}
                >
                  {step.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}