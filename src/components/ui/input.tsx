'use client';

import { forwardRef, useId, useState } from 'react';
import { AlertCircle, Check, ChevronDown, Eye, EyeOff, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const fieldBase =
  'w-full rounded-xl bg-panel-2 px-3.5 text-sm text-ink placeholder:text-ink-4 ring-1 ring-inset ring-line-2 transition-all outline-none focus:ring-2 focus:ring-volt-400/70 disabled:opacity-50 disabled:cursor-not-allowed';

/** Shared label + hint + error scaffold so every control lines up. */
export function Field({
  label,
  hint,
  error,
  required,
  htmlFor,
  children,
  className,
  action,
}: {
  label?: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {(label || action) && (
        <div className="flex items-baseline justify-between gap-2">
          {label && (
            <label htmlFor={htmlFor} className="text-xs font-medium text-ink-2">
              {label}
              {required && <span className="ml-0.5 text-bad-400">*</span>}
            </label>
          )}
          {action}
        </div>
      )}
      {children}
      {error ? (
        <p className="flex items-center gap-1.5 text-xs text-bad-400">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-ink-3">{hint}</p>
      )}
    </div>
  );
}

export const Input = forwardRef<
  HTMLInputElement,
  {
    label?: string;
    hint?: string;
    error?: string | null;
    prefix?: React.ReactNode;
    suffix?: React.ReactNode;
    wrapClassName?: string;
  } & React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ label, hint, error, prefix, suffix, className, wrapClassName, id, ...rest }, ref) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={rest.required}
      htmlFor={fieldId}
      className={wrapClassName}
    >
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-ink-3">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          id={fieldId}
          className={cn(
            fieldBase,
            'h-11',
            prefix && 'pl-9',
            suffix && 'pr-10',
            error && 'ring-bad-500/50 focus:ring-bad-500/70',
            className,
          )}
          aria-invalid={!!error}
          {...rest}
        />
        {suffix && (
          <span className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-ink-3">
            {suffix}
          </span>
        )}
      </div>
    </Field>
  );
});

export function PasswordInput({
  label = 'Password',
  ...rest
}: React.ComponentProps<typeof Input>) {
  const [shown, setShown] = useState(false);
  return (
    <Input
      {...rest}
      label={label}
      type={shown ? 'text' : 'password'}
      autoComplete={rest.autoComplete ?? 'current-password'}
      suffix={
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          className="text-ink-3 transition-colors hover:text-ink"
          aria-label={shown ? 'Hide password' : 'Show password'}
        >
          {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      }
    />
  );
}

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  { label?: string; hint?: string; error?: string | null } & React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ label, hint, error, className, id, rows = 4, ...rest }, ref) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <Field label={label} hint={hint} error={error} required={rest.required} htmlFor={fieldId}>
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        className={cn(fieldBase, 'resize-y py-2.5 leading-relaxed', error && 'ring-bad-500/50', className)}
        aria-invalid={!!error}
        {...rest}
      />
    </Field>
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  {
    label?: string;
    hint?: string;
    error?: string | null;
    options?: Array<{ value: string; label: string; disabled?: boolean }>;
  } & React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ label, hint, error, options, className, id, children, ...rest }, ref) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <Field label={label} hint={hint} error={error} required={rest.required} htmlFor={fieldId}>
      <div className="relative">
        <select
          ref={ref}
          id={fieldId}
          className={cn(fieldBase, 'h-11 cursor-pointer appearance-none pr-9', error && 'ring-bad-500/50', className)}
          {...rest}
        >
          {options
            ? options.map((o) => (
                <option key={o.value} value={o.value} disabled={o.disabled}>
                  {o.label}
                </option>
              ))
            : children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-3"
          aria-hidden
        />
      </div>
    </Field>
  );
});

export function SearchInput({
  className,
  wrapClassName,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { wrapClassName?: string }) {
  return (
    <div className={cn('relative', wrapClassName)}>
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
      <input
        type="search"
        className={cn(fieldBase, 'h-10 pl-10 [&::-webkit-search-cancel-button]:hidden', className)}
        {...rest}
      />
    </div>
  );
}

export function Checkbox({
  label,
  description,
  className,
  ...rest
}: { label?: React.ReactNode; description?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const auto = useId();
  const id = rest.id ?? auto;
  return (
    <div className={cn('flex items-start gap-2.5', className)}>
      <div className="relative mt-0.5 flex size-[18px] shrink-0 items-center justify-center">
        <input
          id={id}
          type="checkbox"
          className="peer size-[18px] cursor-pointer appearance-none rounded-[5px] bg-panel-2 ring-1 ring-inset ring-line-2 transition-all checked:bg-volt-400 checked:ring-volt-400 disabled:opacity-50"
          {...rest}
        />
        <Check
          className="pointer-events-none absolute size-3 stroke-[3.5] text-void opacity-0 transition-opacity peer-checked:opacity-100"
          aria-hidden
        />
      </div>
      {(label || description) && (
        <label htmlFor={id} className="cursor-pointer select-none">
          {label && <span className="block text-sm text-ink">{label}</span>}
          {description && <span className="block text-xs text-ink-3">{description}</span>}
        </label>
      )}
    </div>
  );
}

export function Radio({
  label,
  description,
  className,
  ...rest
}: { label?: React.ReactNode; description?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const auto = useId();
  const id = rest.id ?? auto;
  return (
    <div className={cn('flex items-start gap-2.5', className)}>
      <input
        id={id}
        type="radio"
        className="mt-0.5 size-[18px] shrink-0 cursor-pointer appearance-none rounded-full bg-panel-2 ring-1 ring-inset ring-line-2 transition-all checked:border-[5px] checked:border-volt-400 checked:bg-void checked:ring-volt-400"
        {...rest}
      />
      {(label || description) && (
        <label htmlFor={id} className="cursor-pointer select-none">
          {label && <span className="block text-sm text-ink">{label}</span>}
          {description && <span className="block text-xs text-ink-3">{description}</span>}
        </label>
      )}
    </div>
  );
}

export function Switch({
  label,
  description,
  checked,
  onChange,
  disabled,
  name,
  className,
}: {
  label?: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  name?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      {(label || description) && (
        <div className="min-w-0">
          {label && <p className="text-sm text-ink">{label}</p>}
          {description && <p className="text-xs text-ink-3">{description}</p>}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors disabled:opacity-50',
          checked ? 'bg-volt-400' : 'bg-line-2',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform duration-200',
            checked ? 'translate-x-[22px]' : 'translate-x-0.5',
          )}
        />
        {name && <input type="hidden" name={name} value={checked ? 'true' : 'false'} />}
      </button>
    </div>
  );
}

/**
 * Money input that speaks rupees to the human and paise to the form.
 * Every monetary column in the schema is integer paise, so the conversion has
 * to happen at the edge — not in the service layer.
 */
export function RupeeInput({
  name,
  valuePaise,
  onChangePaise,
  label,
  hint,
  error,
  ...rest
}: {
  name?: string;
  valuePaise: number;
  onChangePaise: (paise: number) => void;
  label?: string;
  hint?: string;
  error?: string | null;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'name'>) {
  return (
    <>
      <Input
        {...rest}
        label={label}
        hint={hint}
        error={error}
        prefix="₹"
        inputMode="decimal"
        value={valuePaise === 0 ? '' : String(valuePaise / 100)}
        onChange={(e) => {
          const n = Number(e.target.value.replace(/[^0-9.]/g, ''));
          onChangePaise(Number.isFinite(n) ? Math.round(n * 100) : 0);
        }}
      />
      {name && <input type="hidden" name={name} value={valuePaise} />}
    </>
  );
}
