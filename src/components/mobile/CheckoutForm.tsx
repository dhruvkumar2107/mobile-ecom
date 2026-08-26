'use client';

import { useState, useCallback, forwardRef } from 'react';
import { mobileDesign } from '@/lib/mobile-design';
import { cn } from '@/lib/utils';
import { Input, Textarea, Select } from './Input';
import { Card } from './Card';
import { Badge } from './Badge';
import { HapticButton } from './HapticButton';
import { Stepper, Divider } from './List';
import { formatINR } from '@/lib/money';

export interface Address {
  id?: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
  type?: 'home' | 'work' | 'other';
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'upi' | 'netbanking' | 'wallet' | 'cod';
  name: string;
  icon?: React.ReactNode;
  details?: string;
  isDefault?: boolean;
}

export interface CheckoutFormProps {
  steps: Array<{
    id: string;
    label: string;
    description?: string;
    icon?: React.ReactNode;
  }>;
  currentStep: number;
  onStepChange: (step: number) => void;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  children: React.ReactNode;
  loading?: boolean;
}

export function CheckoutForm({ steps, currentStep, onStepChange, onSubmit, children, loading = false }: CheckoutFormProps) {
  const handleNext = useCallback(() => {
    onStepChange(currentStep + 1);
  }, [currentStep, onStepChange]);

  const handleBack = useCallback(() => {
    onStepChange(currentStep - 1);
  }, [currentStep, onStepChange]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget as HTMLFormElement);
      const data = Object.fromEntries(formData.entries());
      await onSubmit(data);
    },
    [onSubmit]
  );

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: `${mobileDesign.spacing.xl}px` }}>
      <Stepper
        steps={steps}
        currentStep={currentStep}
        orientation="vertical"
        variant="default"
        onStepClick={onStepChange}
      />

      <div style={{ flex: 1 }}>{children}</div>

      <div
        style={{
          display: 'flex',
          gap: `${mobileDesign.spacing.md}px`,
          paddingTop: `${mobileDesign.spacing.lg}px`,
          borderTop: `1px solid ${mobileDesign.colors.borderLight}`,
          position: 'sticky',
          bottom: 0,
          background: mobileDesign.colors.background,
          paddingBottom: `${mobileDesign.spacing.lg}px`,
        }}
      >
        {currentStep > 0 && (
          <HapticButton variant="outline" fullWidth onClick={handleBack} disabled={loading}>
            Back
          </HapticButton>
        )}
        <HapticButton
          variant="primary"
          fullWidth
          onClick={(e) =>
            currentStep < steps.length - 1
              ? handleNext()
              : (e.currentTarget as HTMLElement).closest('form')?.requestSubmit()
          }
          disabled={loading}
          loading={loading}
        >
          {currentStep === steps.length - 1 ? 'Place Order' : 'Continue'}
        </HapticButton>
      </div>
    </form>
  );
}

export interface AddressFormProps {
  initialData?: Partial<Address>;
  onSubmit: (data: Address) => void;
  onCancel?: () => void;
  loading?: boolean;
}

export function AddressForm({ initialData, onSubmit, onCancel, loading = false }: AddressFormProps) {
  const [formData, setFormData] = useState<Address>({
    name: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    type: 'home',
    ...initialData,
  });

  const handleChange = useCallback((field: keyof Address, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    },
    [formData, onSubmit]
  );

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: `${mobileDesign.spacing.lg}px` }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: `${mobileDesign.spacing.md}px` }}>
        <Input
          label="Full Name"
          placeholder="John Doe"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          required
          autoComplete="name"
        />
        <Input
          label="Phone Number"
          placeholder="98765 43210"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
          required
          autoComplete="tel"
          inputProps={{ maxLength: 10 }}
        />
      </div>

      <Input
        label="Address Line 1"
        placeholder="House/Flat No., Building, Street"
        value={formData.line1}
        onChange={(e) => handleChange('line1', e.target.value)}
        required
        autoComplete="address-line1"
      />

      <Input
        label="Address Line 2 (Optional)"
        placeholder="Landmark, Area, Colony"
        value={formData.line2 || ''}
        onChange={(e) => handleChange('line2', e.target.value)}
        autoComplete="address-line2"
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: `${mobileDesign.spacing.md}px` }}>
        <Input
          label="City"
          placeholder="Mumbai"
          value={formData.city}
          onChange={(e) => handleChange('city', e.target.value)}
          required
          autoComplete="address-level2"
        />
        <Select
          label="State"
          placeholder="Select State"
          value={formData.state}
          onChange={(e) => handleChange('state', e.target.value)}
          required
          options={indianStates.map((s) => ({ value: s, label: s }))}
        />
      </div>

      <Input
        label="Pincode"
        placeholder="400001"
        value={formData.pincode}
        onChange={(e) => handleChange('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
        required
        autoComplete="postal-code"
        inputProps={{ maxLength: 6, pattern: '[0-9]{6}' }}
      />

      <div style={{ display: 'flex', gap: `${mobileDesign.spacing.md}px`, marginTop: `${mobileDesign.spacing.md}px` }}>
        {(['home', 'work', 'other'] as const).map((type) => (
          <label
            key={type}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: `${mobileDesign.spacing.md}px`,
              border: `2px solid ${formData.type === type ? mobileDesign.colors.accent : mobileDesign.colors.border}`,
              borderRadius: `${mobileDesign.borderRadius.md}px`,
              background: formData.type === type ? mobileDesign.colors.accentLight : mobileDesign.colors.surface,
              color: formData.type === type ? mobileDesign.colors.accentDark : mobileDesign.colors.textPrimary,
              fontSize: '13px',
              fontWeight: 500,
              fontFamily: mobileDesign.typography.fontFamily,
              cursor: 'pointer',
              transition: `all ${mobileDesign.transitions.fast}`,
            }}
          >
            <input
              type="radio"
              name="addressType"
              value={type}
              checked={formData.type === type}
              onChange={() => handleChange('type', type)}
              style={{ width: '18px', height: '18px', accentColor: mobileDesign.colors.accent }}
            />
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </label>
        ))}
      </div>

      <div style={{ display: 'flex', gap: `${mobileDesign.spacing.md}px`, marginTop: `${mobileDesign.spacing.md}px` }}>
        {onCancel && (
          <HapticButton variant="outline" fullWidth onClick={onCancel} disabled={loading}>
            Cancel
          </HapticButton>
        )}
        <HapticButton variant="primary" fullWidth type="submit" disabled={loading} loading={loading}>
          {initialData?.id ? 'Update Address' : 'Save Address'}
        </HapticButton>
      </div>
    </form>
  );
}

const indianStates = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
];

export interface PaymentMethodCardProps {
  method: PaymentMethod;
  selected: boolean;
  onSelect: () => void;
  showDetails?: boolean;
}

export function PaymentMethodCard({ method, selected, onSelect, showDetails = true }: PaymentMethodCardProps) {
  return (
    <Card
      variant={selected ? 'elevated' : 'outlined'}
      padding="md"
      pressable
      onPress={onSelect}
      style={{
        border: selected ? `2px solid ${mobileDesign.colors.accent}` : undefined,
        background: selected ? mobileDesign.colors.accentLight : undefined,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: `${mobileDesign.spacing.md}px` }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: `${mobileDesign.borderRadius.md}px`,
            background: selected ? mobileDesign.colors.accent : mobileDesign.colors.borderLight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: selected ? mobileDesign.colors.textInverse : mobileDesign.colors.textSecondary,
          }}
        >
          {method.icon || (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              style={{ width: 24, height: 24 }}
              aria-hidden="true"
            >
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, fontFamily: mobileDesign.typography.fontFamily, color: mobileDesign.colors.textPrimary }}>
            {method.name}
          </p>
          {showDetails && method.details && (
            <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 400, fontFamily: mobileDesign.typography.fontFamily, color: mobileDesign.colors.textSecondary }}>
              {method.details}
            </p>
          )}
        </div>
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            border: `2px solid ${selected ? mobileDesign.colors.accent : mobileDesign.colors.border}`,
            background: selected ? mobileDesign.colors.accent : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: mobileDesign.colors.textInverse,
          }}
        >
          {selected && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} style={{ width: 14, height: 14 }} aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>}
        </div>
      </div>
    </Card>
  );
}

export interface OrderSummaryProps {
  subtotal: number;
  shipping: number;
  discount: number;
  tax: number;
  total: number;
  promoCode?: string;
  onPromoApply?: (code: string) => void;
  onPromoRemove?: () => void;
  loading?: boolean;
}

export function OrderSummary({ subtotal, shipping, discount, tax, total, promoCode, onPromoApply, onPromoRemove, loading = false }: OrderSummaryProps) {
  const [promoInput, setPromoInput] = useState('');

  return (
    <Card variant="elevated" padding="lg">
      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, fontFamily: mobileDesign.typography.fontFamily, color: mobileDesign.colors.textPrimary, marginBottom: `${mobileDesign.spacing.lg}px` }}>
        Order Summary
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: `${mobileDesign.spacing.md}px` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '14px', fontWeight: 400, fontFamily: mobileDesign.typography.fontFamily, color: mobileDesign.colors.textSecondary }}>
            Subtotal
          </span>
          <span style={{ fontSize: '14px', fontWeight: 500, fontFamily: mobileDesign.typography.fontFamily, color: mobileDesign.colors.textPrimary }}>
            {formatINR(subtotal)}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '14px', fontWeight: 400, fontFamily: mobileDesign.typography.fontFamily, color: mobileDesign.colors.textSecondary }}>
            Shipping
          </span>
          <span style={{ fontSize: '14px', fontWeight: 500, fontFamily: mobileDesign.typography.fontFamily, color: shipping === 0 ? mobileDesign.colors.success : mobileDesign.colors.textPrimary }}>
            {shipping === 0 ? 'Free' : formatINR(shipping)}
          </span>
        </div>

        {discount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', color: mobileDesign.colors.success }}>
            <span style={{ fontSize: '14px', fontWeight: 400, fontFamily: mobileDesign.typography.fontFamily }}>
              Discount
            </span>
            <span style={{ fontSize: '14px', fontWeight: 500, fontFamily: mobileDesign.typography.fontFamily }}>
              -{formatINR(discount)}
            </span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '14px', fontWeight: 400, fontFamily: mobileDesign.typography.fontFamily, color: mobileDesign.colors.textSecondary }}>
            Tax (GST)
          </span>
          <span style={{ fontSize: '14px', fontWeight: 500, fontFamily: mobileDesign.typography.fontFamily, color: mobileDesign.colors.textPrimary }}>
            {formatINR(tax)}
          </span>
        </div>

        {promoCode && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: `${mobileDesign.spacing.md}px`,
              background: mobileDesign.colors.successLight,
              borderRadius: `${mobileDesign.borderRadius.md}px`,
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 500, fontFamily: mobileDesign.typography.fontFamily, color: mobileDesign.colors.success }}>
              Promo Applied: {promoCode}
            </span>
            <button
              onClick={onPromoRemove}
              style={{
                padding: `${mobileDesign.spacing.xs}px ${mobileDesign.spacing.sm}px`,
                fontSize: '12px',
                fontWeight: 600,
                fontFamily: mobileDesign.typography.fontFamily,
                border: 'none',
                background: 'transparent',
                color: mobileDesign.colors.success,
                cursor: 'pointer',
              }}
            >
              Remove
            </button>
          </div>
        )}

        {!promoCode && onPromoApply && (
          <div style={{ display: 'flex', gap: `${mobileDesign.spacing.sm}px` }}>
            <Input
              placeholder="Enter promo code"
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value)}
              variant="outlined"
              size="sm"
              style={{ flex: 1 }}
            />
            <HapticButton size="sm" onClick={() => onPromoApply(promoInput)} disabled={!promoInput.trim() || loading} loading={loading}>
              Apply
            </HapticButton>
          </div>
        )}

        <Divider thickness="medium" />

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: mobileDesign.typography.fontFamily, color: mobileDesign.colors.textPrimary }}>
            Total
          </span>
          <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: mobileDesign.typography.fontFamily, color: mobileDesign.colors.textPrimary }}>
            {formatINR(total)}
          </span>
        </div>

        <p style={{ margin: `${mobileDesign.spacing.md}px 0 0`, fontSize: '12px', fontWeight: 400, fontFamily: mobileDesign.typography.fontFamily, color: mobileDesign.colors.textTertiary, textAlign: 'center' }}>
          Includes GST. Free shipping on orders above ₹499.
        </p>
      </div>
    </Card>
  );
}

export interface SavedAddressCardProps {
  address: Address;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDefault?: boolean;
}

export function SavedAddressCard({ address, selected, onSelect, onEdit, onDelete, isDefault }: SavedAddressCardProps) {
  return (
    <Card
      variant={selected ? 'elevated' : 'outlined'}
      padding="md"
      style={{
        border: selected ? `2px solid ${mobileDesign.colors.accent}` : undefined,
        background: selected ? mobileDesign.colors.accentLight : undefined,
      }}
    >
      <div style={{ display: 'flex', gap: `${mobileDesign.spacing.md}px` }}>
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            border: `2px solid ${selected ? mobileDesign.colors.accent : mobileDesign.colors.border}`,
            background: selected ? mobileDesign.colors.accent : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: mobileDesign.colors.textInverse,
            flexShrink: 0,
            marginTop: '2px',
          }}
        >
          {selected && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} style={{ width: 12, height: 12 }} aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>}
        </div>

        <div style={{ flex: 1, minWidth: 0 }} onClick={onSelect}>
          <div style={{ display: 'flex', alignItems: 'center', gap: `${mobileDesign.spacing.sm}px`, flexWrap: 'wrap', marginBottom: '4px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, fontFamily: mobileDesign.typography.fontFamily, color: mobileDesign.colors.textPrimary }}>
              {address.name}
            </span>
            {isDefault && (
              <Badge variant="accent" size="sm">
                Default
              </Badge>
            )}
          </div>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, fontFamily: mobileDesign.typography.fontFamily, color: mobileDesign.colors.textSecondary }}>
            {address.phone}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '13px', fontWeight: 400, fontFamily: mobileDesign.typography.fontFamily, color: mobileDesign.colors.textSecondary, lineHeight: 1.5 }}>
            {address.line1}{address.line2 ? `, ${address.line2}` : ''}, {address.city}, {address.state} - {address.pincode}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            style={{
              padding: `${mobileDesign.spacing.xs}px ${mobileDesign.spacing.sm}px`,
              fontSize: '12px',
              fontWeight: 500,
              fontFamily: mobileDesign.typography.fontFamily,
              border: `1px solid ${mobileDesign.colors.border}`,
              borderRadius: `${mobileDesign.borderRadius.sm}px`,
              background: mobileDesign.colors.surface,
              color: mobileDesign.colors.textSecondary,
              cursor: 'pointer',
            }}
          >
            Edit
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            style={{
              padding: `${mobileDesign.spacing.xs}px ${mobileDesign.spacing.sm}px`,
              fontSize: '12px',
              fontWeight: 500,
              fontFamily: mobileDesign.typography.fontFamily,
              border: `1px solid ${mobileDesign.colors.error}`,
              borderRadius: `${mobileDesign.borderRadius.sm}px`,
              background: mobileDesign.colors.errorLight,
              color: mobileDesign.colors.error,
              cursor: 'pointer',
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </Card>
  );
}