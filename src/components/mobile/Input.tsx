'use client';

import { useState, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { motion } from 'framer-motion';
import { mobileDesign } from '@/lib/mobile-design';
import { cn } from '@/lib/utils';
import { Search, X, Eye, EyeOff, Loader2 } from 'lucide-react';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  placeholder?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  variant?: 'default' | 'outlined' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  /** Extra attributes forwarded straight to the underlying <input>. */
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

const sizeStyles = {
  sm: { px: 12, py: 10, fontSize: 14, iconSize: 18, gap: 8, borderRadius: 10 },
  md: { px: 16, py: 12, fontSize: 15, iconSize: 20, gap: 10, borderRadius: 12 },
  lg: { px: 20, py: 14, fontSize: 16, iconSize: 22, gap: 12, borderRadius: 14 },
};

const variantStyles = {
  default: {
    bg: 'var(--mobile-color-surface)',
    border: '1px solid var(--mobile-color-border)',
    focusBorder: 'var(--mobile-color-accent)',
    hoverBorder: 'var(--mobile-color-accent)',
    labelColor: 'var(--mobile-color-text-secondary)',
    placeholderColor: 'var(--mobile-color-text-tertiary)',
  },
  outlined: {
    bg: 'transparent',
    border: '1.5px solid var(--mobile-color-border)',
    focusBorder: 'var(--mobile-color-accent)',
    hoverBorder: 'var(--mobile-color-text-tertiary)',
    labelColor: 'var(--mobile-color-text-secondary)',
    placeholderColor: 'var(--mobile-color-text-tertiary)',
  },
  filled: {
    bg: 'var(--mobile-color-border-light)',
    border: 'none',
    focusBorder: 'var(--mobile-color-accent)',
    hoverBorder: 'transparent',
    labelColor: 'var(--mobile-color-text-tertiary)',
    placeholderColor: 'var(--mobile-color-text-tertiary)',
  },
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      placeholder,
      error,
      helperText,
      leftIcon,
      rightIcon,
      showPasswordToggle = false,
      loading = false,
      fullWidth = true,
      variant = 'default',
      size = 'md',
      className,
      style,
      disabled,
      required,
      onChange,
      onBlur,
      onFocus,
      type = 'text',
      value,
      inputProps,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [hasValue, setHasValue] = useState(!!value);

    const inputType = showPasswordToggle && showPassword ? 'text' : type;

    const s = sizeStyles[size];
    const v = variantStyles[variant];

    const innerRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(ref, () => innerRef.current as HTMLInputElement, []);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setHasValue(!!e.target.value);
        onChange?.(e);
      },
      [onChange]
    );

    const handleFocus = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(true);
        onFocus?.(e);
      },
      [onFocus]
    );

    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(false);
        onBlur?.(e);
      },
      [onBlur]
    );

    const handlePasswordToggle = useCallback(() => {
      setShowPassword((prev) => !prev);
    }, []);

    const handleClear = useCallback(() => {
      const node = innerRef.current;
      if (node) {
        node.value = '';
        // Fire a real React change event so controlled parents stay in sync.
        const setter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        )?.set;
        setter?.call(node, '');
        node.dispatchEvent(new Event('input', { bubbles: true }));
      }
      onChange?.({
        target: { value: '', name: props.name },
        currentTarget: { value: '', name: props.name },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
      setHasValue(false);
      node?.focus();
    }, [onChange, props.name]);

    const isError = !!error;
    const borderColor = isError
      ? 'var(--mobile-color-error)'
      : isFocused
      ? v.focusBorder
      : v.border;
    const bgColor = variant === 'filled' && isFocused ? 'var(--mobile-color-surface)' : v.bg;

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: `${mobileDesign.spacing.xs}px`,
          width: fullWidth ? '100%' : 'auto',
          ...style,
        }}
        className={cn('mobile-input-wrapper', className)}
      >
        {label && (
          <motion.label
            style={{
              fontSize: '13px',
              fontWeight: 500,
              fontFamily: mobileDesign.typography.fontFamily,
              color: isError
                ? 'var(--mobile-color-error)'
                : isFocused
                ? 'var(--mobile-color-accent)'
                : v.labelColor,
              transition: `color ${mobileDesign.transitions.fast}`,
            }}
          >
            {label}
            {required && (
              <span
                style={{
                  color: 'var(--mobile-color-error)',
                  marginLeft: '4px',
                }}
                aria-hidden="true"
              >
                *
              </span>
            )}
          </motion.label>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: `${s.gap}px`,
            padding: `${s.py}px ${s.px}px`,
            backgroundColor: bgColor,
            border: `1px solid ${borderColor}`,
            borderRadius: `${s.borderRadius}px`,
            transition: `all ${mobileDesign.transitions.fast}`,
            boxShadow: isFocused && !isError ? '0 0 0 3px var(--mobile-color-accent-light)' : 'none',
          }}
        >
          {leftIcon && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: `${s.iconSize}px`,
                height: `${s.iconSize}px`,
                color: isFocused ? 'var(--mobile-color-accent)' : 'var(--mobile-color-text-tertiary)',
                flexShrink: 0,
              }}
            >
              {leftIcon}
            </span>
          )}

          <input
            ref={innerRef}
            type={inputType}
            placeholder={placeholder}
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled || loading}
            required={required}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              fontSize: `${s.fontSize}px`,
              fontFamily: mobileDesign.typography.fontFamily,
              fontWeight: 400,
              color: 'var(--mobile-color-text-primary)',
              outline: 'none',
              width: '100%',
              minWidth: 0,
              caretColor: 'var(--mobile-color-accent)',
              ['--mobile-placeholder' as string]: v.placeholderColor,
            } as React.CSSProperties}
            aria-invalid={isError}
            aria-describedby={error ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined}
            {...props}
            {...inputProps}
          />

          {loading && (
            <Loader2
              style={{
                width: `${s.iconSize}px`,
                height: `${s.iconSize}px`,
                color: 'var(--mobile-color-accent)',
                animation: 'spin 1s linear infinite',
              }}
              aria-hidden="true"
            />
          )}

          {hasValue && !loading && !disabled && !showPasswordToggle && !rightIcon && (
            <motion.button
              onClick={handleClear}
              whileTap={{ scale: 0.8 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: `${s.iconSize}px`,
                height: `${s.iconSize}px`,
                border: 'none',
                background: 'transparent',
                color: 'var(--mobile-color-text-tertiary)',
                borderRadius: `${mobileDesign.borderRadius.sm}px`,
                cursor: 'pointer',
                transition: `color ${mobileDesign.transitions.fast}`,
              }}
              aria-label="Clear input"
            >
              <X style={{ width: s.iconSize, height: s.iconSize }} aria-hidden="true" />
            </motion.button>
          )}

          {showPasswordToggle && (
            <motion.button
              onClick={handlePasswordToggle}
              whileTap={{ scale: 0.9 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: `${s.iconSize}px`,
                height: `${s.iconSize}px`,
                border: 'none',
                background: 'transparent',
                color: 'var(--mobile-color-text-tertiary)',
                cursor: 'pointer',
              }}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff style={{ width: s.iconSize, height: s.iconSize }} aria-hidden="true" />
              ) : (
                <Eye style={{ width: s.iconSize, height: s.iconSize }} aria-hidden="true" />
              )}
            </motion.button>
          )}

          {rightIcon && !showPasswordToggle && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: `${s.iconSize}px`,
                height: `${s.iconSize}px`,
                color: 'var(--mobile-color-text-tertiary)',
                flexShrink: 0,
              }}
            >
              {rightIcon}
            </span>
          )}
        </div>

        {error && (
          <motion.p
            id={`${props.id}-error`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              margin: 0,
              fontSize: '12px',
              fontWeight: 400,
              fontFamily: mobileDesign.typography.fontFamily,
              color: 'var(--mobile-color-error)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            role="alert"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }} aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </motion.p>
        )}

        {helperText && !error && (
          <p
            id={`${props.id}-helper`}
            style={{
              margin: 0,
              fontSize: '12px',
              fontWeight: 400,
              fontFamily: mobileDesign.typography.fontFamily,
              color: 'var(--mobile-color-text-tertiary)',
            }}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label?: string;
  placeholder?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  variant?: 'default' | 'outlined' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  minRows?: number;
  maxRows?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      placeholder,
      error,
      helperText,
      fullWidth = true,
      variant = 'default',
      size = 'md',
      className,
      style,
      disabled,
      required,
      onChange,
      onBlur,
      onFocus,
      minRows = 3,
      maxRows = 8,
      value,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const s = sizeStyles[size];
    const v = variantStyles[variant];

    const isError = !!error;
    const borderColor = isError
      ? 'var(--mobile-color-error)'
      : isFocused
      ? v.focusBorder
      : v.border;
    const bgColor = variant === 'filled' && isFocused ? 'var(--mobile-color-surface)' : v.bg;

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: `${mobileDesign.spacing.xs}px`,
          width: fullWidth ? '100%' : 'auto',
          ...style,
        }}
        className={cn('mobile-textarea-wrapper', className)}
      >
        {label && (
          <motion.label
            style={{
              fontSize: '13px',
              fontWeight: 500,
              fontFamily: mobileDesign.typography.fontFamily,
              color: isError
                ? 'var(--mobile-color-error)'
                : isFocused
                ? 'var(--mobile-color-accent)'
                : v.labelColor,
              transition: `color ${mobileDesign.transitions.fast}`,
            }}
          >
            {label}
            {required && (
              <span
                style={{
                  color: 'var(--mobile-color-error)',
                  marginLeft: '4px',
                }}
                aria-hidden="true"
              >
                *
              </span>
            )}
          </motion.label>
        )}

        <textarea
          ref={ref}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={(e) => { setIsFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setIsFocused(false); onBlur?.(e); }}
          disabled={disabled}
          required={required}
          rows={minRows}
          style={{
            padding: `${s.py}px ${s.px}px`,
            backgroundColor: bgColor,
            border: `1px solid ${borderColor}`,
            borderRadius: `${s.borderRadius}px`,
            fontSize: `${s.fontSize}px`,
            fontFamily: mobileDesign.typography.fontFamily,
            fontWeight: 400,
            color: 'var(--mobile-color-text-primary)',
            outline: 'none',
            width: '100%',
            minHeight: `${minRows * (s.fontSize + 8)}px`,
            maxHeight: `${maxRows * (s.fontSize + 8)}px`,
            resize: 'vertical',
            lineHeight: 1.5,
            transition: `all ${mobileDesign.transitions.fast}`,
            boxShadow: isFocused && !isError ? '0 0 0 3px var(--mobile-color-accent-light)' : 'none',
            ['--mobile-placeholder' as string]: v.placeholderColor,
          } as React.CSSProperties}
          aria-invalid={isError}
          aria-describedby={error ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined}
          {...props}
        />

        {error && (
          <motion.p
            id={`${props.id}-error`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              margin: 0,
              fontSize: '12px',
              fontWeight: 400,
              fontFamily: mobileDesign.typography.fontFamily,
              color: 'var(--mobile-color-error)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            role="alert"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }} aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </motion.p>
        )}

        {helperText && !error && (
          <p
            id={`${props.id}-helper`}
            style={{
              margin: 0,
              fontSize: '12px',
              fontWeight: 400,
              fontFamily: mobileDesign.typography.fontFamily,
              color: 'var(--mobile-color-text-tertiary)',
            }}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  placeholder?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  fullWidth?: boolean;
  variant?: 'default' | 'outlined' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  /** Extra attributes forwarded straight to the underlying <input>. */
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      placeholder,
      error,
      helperText,
      options,
      fullWidth = true,
      variant = 'default',
      size = 'md',
      className,
      style,
      disabled,
      required,
      onChange,
      onBlur,
      onFocus,
      value,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const s = sizeStyles[size];
    const v = variantStyles[variant];

    const isError = !!error;
    const borderColor = isError
      ? 'var(--mobile-color-error)'
      : isFocused
      ? v.focusBorder
      : v.border;
    const bgColor = variant === 'filled' && isFocused ? 'var(--mobile-color-surface)' : v.bg;

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: `${mobileDesign.spacing.xs}px`,
          width: fullWidth ? '100%' : 'auto',
          ...style,
        }}
        className={cn('mobile-select-wrapper', className)}
      >
        {label && (
          <motion.label
            style={{
              fontSize: '13px',
              fontWeight: 500,
              fontFamily: mobileDesign.typography.fontFamily,
              color: isError
                ? 'var(--mobile-color-error)'
                : isFocused
                ? 'var(--mobile-color-accent)'
                : v.labelColor,
              transition: `color ${mobileDesign.transitions.fast}`,
            }}
          >
            {label}
            {required && (
              <span
                style={{
                  color: 'var(--mobile-color-error)',
                  marginLeft: '4px',
                }}
                aria-hidden="true"
              >
                *
              </span>
            )}
          </motion.label>
        )}

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <select
            ref={ref}
            value={value}
            onChange={onChange}
            onFocus={(e) => { setIsFocused(true); onFocus?.(e); }}
            onBlur={(e) => { setIsFocused(false); onBlur?.(e); }}
            disabled={disabled}
            required={required}
            style={{
              flex: 1,
              appearance: 'none',
              padding: `${s.py}px ${s.px}px`,
              paddingRight: `${s.px + s.iconSize + s.gap}px`,
              backgroundColor: bgColor,
              border: `1px solid ${borderColor}`,
              borderRadius: `${s.borderRadius}px`,
              fontSize: `${s.fontSize}px`,
              fontFamily: mobileDesign.typography.fontFamily,
              fontWeight: 400,
              color: value ? 'var(--mobile-color-text-primary)' : v.placeholderColor,
              outline: 'none',
              width: '100%',
              minWidth: 0,
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: `all ${mobileDesign.transitions.fast}`,
              boxShadow: isFocused && !isError ? '0 0 0 3px var(--mobile-color-accent-light)' : 'none',
            }}
            aria-invalid={isError}
            aria-describedby={error ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>

          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            style={{
              position: 'absolute',
              right: `${s.px}px`,
              width: `${s.iconSize}px`,
              height: `${s.iconSize}px`,
              color: isFocused ? 'var(--mobile-color-accent)' : 'var(--mobile-color-text-tertiary)',
              pointerEvents: 'none',
            }}
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>

        {error && (
          <motion.p
            id={`${props.id}-error`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              margin: 0,
              fontSize: '12px',
              fontWeight: 400,
              fontFamily: mobileDesign.typography.fontFamily,
              color: 'var(--mobile-color-error)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            role="alert"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }} aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </motion.p>
        )}

        {helperText && !error && (
          <p
            id={`${props.id}-helper`}
            style={{
              margin: 0,
              fontSize: '12px',
              fontWeight: 400,
              fontFamily: mobileDesign.typography.fontFamily,
              color: 'var(--mobile-color-text-tertiary)',
            }}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';