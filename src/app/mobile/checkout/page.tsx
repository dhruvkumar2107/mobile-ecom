'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, MapPin, CreditCard, Smartphone, Check, X, ChevronDown, ChevronUp, Lock, Gift, Truck, Shield, RotateCcw, Heart, Search } from 'lucide-react';
import { mobileDesign } from '@/lib/mobile-design';
import { MobileImage } from '@/components/mobile/MobileImage';
import { BottomTabNavigation } from '@/components/mobile/BottomTabNavigation';
import { HapticButton, ChipButton } from '@/components/mobile/HapticButton';
import { Input, Select } from '@/components/mobile/Input';
import { Card } from '@/components/mobile/Card';
import { Badge } from '@/components/mobile/Badge';
import { Stepper } from '@/components/mobile/List';
import { formatINR } from '@/lib/money';
import { ProductCardSkeleton } from '@/components/mobile/Skeleton';

const checkoutSteps = [
  { id: 'address', label: 'Delivery', description: 'Shipping address', icon: <MapPin style={{ width: 20, height: 20 }} aria-hidden="true" /> },
  { id: 'payment', label: 'Payment', description: 'Payment method', icon: <CreditCard style={{ width: 20, height: 20 }} aria-hidden="true" /> },
  { id: 'review', label: 'Review', description: 'Confirm order', icon: <Check style={{ width: 20, height: 20 }} aria-hidden="true" /> },
];

const addresses: Address[] = [
  {
    id: '1',
    name: 'Rahul Sharma',
    phone: '98765 43210',
    line1: '123 MG Road, Apartment 4B',
    line2: 'Near Metro Station',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    isDefault: true,
    type: 'home',
  },
  {
    id: '2',
    name: 'Rahul Sharma',
    phone: '98765 43210',
    line1: 'Cyber City, Tower A, Floor 12',
    line2: 'DLF Phase 2',
    city: 'Gurugram',
    state: 'Haryana',
    pincode: '122002',
    isDefault: false,
    type: 'work',
  },
];

const paymentMethods: PaymentMethod[] = [
  { id: 'upi', name: 'UPI', icon: <Smartphone style={{ width: 24, height: 24 }} aria-hidden="true" />, details: 'PhonePe, Google Pay, Paytm', recommended: true },
  { id: 'card', name: 'Credit/Debit Card', icon: <CreditCard style={{ width: 24, height: 24 }} aria-hidden="true" />, details: 'Visa, Mastercard, RuPay', recommended: false },
  { id: 'netbanking', name: 'Net Banking', icon: <Lock style={{ width: 24, height: 24 }} aria-hidden="true" />, details: '50+ banks supported', recommended: false },
  { id: 'wallet', name: 'Wallet', icon: <Gift style={{ width: 24, height: 24 }} aria-hidden="true" />, details: 'Voltage Wallet balance', recommended: false },
  { id: 'cod', name: 'Cash on Delivery', icon: <Truck style={{ width: 24, height: 24 }} aria-hidden="true" />, details: 'Pay on delivery (+₹49)', recommended: false },
];

const orderItems: OrderItem[] = [
  { id: '1', name: 'iPhone 15 Pro Max', brand: 'Apple', price: 159900, originalPrice: 169900, image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&q=80', color: 'Natural Titanium', storage: '256 GB', protectionPlan: 'AppleCare+', protectionPrice: 9999, quantity: 1 },
  { id: '2', name: 'AirPods Pro 2', brand: 'Apple', price: 24900, originalPrice: 26900, image: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400&q=80', color: 'White', storage: '', protectionPlan: null, protectionPrice: 0, quantity: 1 },
];

const shippingThreshold = 49900;
const shippingCost = 0;
const codFee = 49;

export default function CheckoutPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAddress, setSelectedAddress] = useState(addresses[0]);
  const [selectedPayment, setSelectedPayment] = useState('upi');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']));

  const toggleSection = (section: string) => {
    setExpandedSections((prev: Set<string>) => {
      const next = new Set(prev);
      next.has(section) ? next.delete(section) : next.add(section);
      return next;
    });
  };

  const subtotal = orderItems.reduce((sum, item) => sum + (item.price + item.protectionPrice) * item.quantity, 0);
  const savings = orderItems.reduce((sum, item) => sum + ((item.originalPrice - item.price) * item.quantity), 0);
  const protectionTotal = orderItems.reduce((sum, item) => sum + item.protectionPrice * item.quantity, 0);
  const needsShipping = subtotal < shippingThreshold;
  const finalShipping = needsShipping ? shippingCost : 0;
  const baseTotal = subtotal + finalShipping + codFee;

  const promoDiscount = appliedPromo
    ? (() => {
        const validPromos: Record<string, { discount: number; type: 'percent' | 'flat' }> = {
          'WELCOME10': { discount: 10, type: 'percent' },
          'SAVE500': { discount: 500, type: 'flat' },
          'FREESHIP': { discount: 0, type: 'flat' },
        };
        const promo = validPromos[appliedPromo];
        return promo.type === 'percent' ? Math.round(subtotal * promo.discount / 100) : promo.discount;
      })()
    : 0;

  const finalTotal = baseTotal - promoDiscount;

  const applyPromo = useCallback(() => {
    setPromoError('');
    setPromoSuccess('');
    if (!promoCode.trim()) return;
    const validPromos: Record<string, { discount: number; type: 'percent' | 'flat' }> = {
      'WELCOME10': { discount: 10, type: 'percent' },
      'SAVE500': { discount: 500, type: 'flat' },
      'FREESHIP': { discount: 0, type: 'flat' },
    };
    const promo = validPromos[promoCode.toUpperCase()];
    if (promo) {
      setAppliedPromo(promoCode.toUpperCase());
      setPromoSuccess(promo.type === 'percent' ? `Applied ${promo.discount}% off!` : promo.discount > 0 ? `Applied ₹${promo.discount} off!` : 'Free shipping applied!');
    } else {
      setPromoError('Invalid promo code');
    }
  }, [promoCode]);

  const removePromo = useCallback(() => {
    setAppliedPromo(null);
    setPromoCode('');
    setPromoSuccess('');
  }, []);

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);
    setShowSuccess(true);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleNext = () => {
    if (currentStep < checkoutSteps.length - 1) setCurrentStep(currentStep + 1);
  };

  if (showSuccess) {
    return (
      <div style={{ minHeight: '100vh', background: mobileDesign.colors.background, fontFamily: mobileDesign.typography.fontFamily, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}>
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: mobileDesign.colors.successLight, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ width: 48, height: 48, color: mobileDesign.colors.success }}><path d="M20 6L9 17l-5-5" /></svg>
          </div>
        </motion.div>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: mobileDesign.colors.textPrimary, marginBottom: '8px' }}>Order Placed Successfully!</h2>
        <p style={{ fontSize: '15px', color: mobileDesign.colors.textSecondary, marginBottom: '24px', maxWidth: '280px' }}>Your order has been confirmed. You will receive an SMS with tracking details shortly.</p>
        <motion.div style={{ background: mobileDesign.colors.surface, borderRadius: `${mobileDesign.borderRadius.lg}px`, padding: '20px', marginBottom: '24px', boxShadow: mobileDesign.shadows.sm, textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: '14px', color: mobileDesign.colors.textSecondary }}>Order ID</p>
          <p style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: 700, color: mobileDesign.colors.textPrimary, fontFamily: mobileDesign.typography.fontFamily }}>ORD-#{Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
          <p style={{ margin: '12px 0 0', fontSize: '14px', color: mobileDesign.colors.textSecondary }}>Total Paid</p>
          <p style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: 700, color: mobileDesign.colors.accent, fontFamily: mobileDesign.typography.fontFamily }}>{formatINR(finalTotal)}</p>
        </motion.div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <HapticButton variant="primary" size="lg" onClick={() => window.location.href = '/mobile/profile'} style={{ minWidth: '160px' }}>
            View Orders
          </HapticButton>
          <HapticButton variant="outline" size="lg" onClick={() => window.location.href = '/mobile'} style={{ minWidth: '160px' }}>
            Continue Shopping
          </HapticButton>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: mobileDesign.colors.background, fontFamily: mobileDesign.typography.fontFamily, paddingBottom: `${mobileDesign.touchTarget * 2 + mobileDesign.spacing['3xl']}px` }}>
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'sticky', top: 0, zIndex: mobileDesign.zIndex.sticky,
          background: 'rgba(250,250,250,0.95)', backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${mobileDesign.colors.borderLight}`,
          padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.lg}px`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <motion.button
            onClick={handleBack}
            whileTap={{ scale: 0.9 }}
            style={{
              width: `${mobileDesign.touchTarget}px`, height: `${mobileDesign.touchTarget}px`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 'none', borderRadius: `${mobileDesign.borderRadius.md}px`,
              background: mobileDesign.colors.borderLight, color: mobileDesign.colors.textPrimary, cursor: 'pointer',
            }}
            aria-label="Go back"
          >
            <ChevronLeft style={{ width: 24, height: 24 }} aria-hidden="true" />
          </motion.button>
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: mobileDesign.colors.textPrimary, margin: 0, flex: 1, textAlign: 'center' }}>Checkout</h1>
          <div style={{ width: `${mobileDesign.touchTarget}px` }} />
        </div>
      </motion.header>

      <main style={{ paddingTop: `${mobileDesign.spacing.md}px` }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Stepper
            steps={checkoutSteps.map((s, i) => ({ ...s, completed: i < currentStep, active: i === currentStep }))}
            currentStep={currentStep}
            orientation="vertical"
            variant="default"
            onStepClick={(i) => i <= currentStep && setCurrentStep(i)}
          />
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            style={{ padding: `0 ${mobileDesign.spacing.lg}px ${mobileDesign.spacing.lg}px` }}
          >
            {currentStep === 0 && (
              <DeliveryAddressStep
                addresses={addresses}
                selectedAddress={selectedAddress}
                onSelectAddress={setSelectedAddress}
                onAddAddress={() => setShowAddAddress(true)}
                showAddAddress={showAddAddress}
                onCloseAddAddress={() => setShowAddAddress(false)}
                onNext={handleNext}
              />
            )}
            {currentStep === 1 && (
              <PaymentMethodStep
                paymentMethods={paymentMethods}
                selectedPayment={selectedPayment}
                onSelectPayment={setSelectedPayment}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            {currentStep === 2 && (
              <ReviewOrderStep
                orderItems={orderItems}
                selectedAddress={selectedAddress}
                selectedPayment={paymentMethods.find(p => p.id === selectedPayment)!}
                subtotal={subtotal}
                savings={savings}
                protectionTotal={protectionTotal}
                finalShipping={finalShipping}
                needsShipping={needsShipping}
                codFee={codFee}
                promoCode={promoCode}
                setPromoCode={setPromoCode}
                appliedPromo={appliedPromo}
                promoError={promoError}
                promoSuccess={promoSuccess}
                setPromoError={setPromoError}
                setPromoSuccess={setPromoSuccess}
                applyPromo={applyPromo}
                removePromo={removePromo}
                promoDiscount={promoDiscount}
                finalTotal={finalTotal}
                expandedSections={expandedSections}
                setExpandedSections={setExpandedSections}
                toggleSection={toggleSection}
                onBack={handleBack}
                onPlaceOrder={handlePlaceOrder}
                isProcessing={isProcessing}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomTabNavigation currentTab="cart" cartCount={orderItems.reduce((s, i) => s + i.quantity, 0)} />
    </div>
  );
}

function DeliveryAddressStep({
  addresses,
  selectedAddress,
  onSelectAddress,
  onAddAddress,
  showAddAddress,
  onCloseAddAddress,
  onNext,
}: {
  addresses: Address[];
  selectedAddress: Address;
  onSelectAddress: (addr: Address) => void;
  onAddAddress: () => void;
  showAddAddress: boolean;
  onCloseAddAddress: () => void;
  onNext: () => void;
}) {
  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        style={{ padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.lg}px` }}
      >
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: mobileDesign.colors.textSecondary, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Delivery Address</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {addresses.map(addr => (
            <motion.button
              key={addr.id}
              onClick={() => onSelectAddress(addr)}
              whileTap={{ scale: 0.99 }}
              style={{
                display: 'flex', gap: '12px', padding: '16px',
                border: `2px solid ${selectedAddress.id === addr.id ? mobileDesign.colors.accent : mobileDesign.colors.border}`,
                borderRadius: `${mobileDesign.borderRadius.lg}px`,
                background: selectedAddress.id === addr.id ? mobileDesign.colors.accentLight : mobileDesign.colors.surface,
                cursor: 'pointer', textAlign: 'left', transition: `all ${mobileDesign.transitions.fast}`,
              }}
            >
              <div
                style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  border: `2px solid ${selectedAddress.id === addr.id ? mobileDesign.colors.accent : mobileDesign.colors.border}`,
                  background: selectedAddress.id === addr.id ? mobileDesign.colors.accent : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: mobileDesign.colors.textInverse, flexShrink: 0, marginTop: '2px',
                }}
              >
                {selectedAddress.id === addr.id && <Check style={{ width: 14, height: 14 }} aria-hidden="true" />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: mobileDesign.colors.textPrimary }}>{addr.name}</span>
                  {addr.isDefault && <Badge variant="accent" size="sm">Default</Badge>}
                  <span style={{ fontSize: '13px', fontWeight: 500, color: mobileDesign.colors.textSecondary }}>{addr.phone}</span>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: mobileDesign.colors.textSecondary, lineHeight: 1.5 }}>
                  {addr.line1}{addr.line2 && `, ${addr.line2}`}, {addr.city}, {addr.state} - {addr.pincode}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
        <HapticButton variant="outline" fullWidth onClick={onAddAddress} style={{ marginTop: '12px' }}>
          + Add New Address
        </HapticButton>
      </motion.section>

      <AnimatePresence>
        {showAddAddress && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed', inset: 0, zIndex: mobileDesign.zIndex.modal,
              background: mobileDesign.colors.overlay,
            }}
            onClick={onCloseAddAddress}
            role="dialog" aria-modal="true" aria-label="Add Address"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '90vh',
                background: mobileDesign.colors.surface, borderTopLeftRadius: `${mobileDesign.borderRadius.xl}px`,
                borderTopRightRadius: `${mobileDesign.borderRadius.xl}px`, boxShadow: mobileDesign.shadows.xl,
                overflow: 'auto', padding: `${mobileDesign.spacing.lg}px ${mobileDesign.spacing.xl}px`,
                paddingBottom: `calc(${mobileDesign.spacing.xl}px + env(safe-area-inset-bottom, 0))`,
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingRight: '40px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: mobileDesign.colors.textPrimary }}>Add New Address</h2>
                <button onClick={onCloseAddAddress} style={{ border: 'none', background: 'transparent', color: mobileDesign.colors.textTertiary, cursor: 'pointer', padding: 8 }} />
              </div>
              <AddAddressForm onSubmit={(data) => { onCloseAddAddress(); }} onCancel={onCloseAddAddress} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ position: 'sticky', bottom: 0, background: mobileDesign.colors.background, padding: '16px', borderTop: `1px solid ${mobileDesign.colors.borderLight}` }}>
        <HapticButton variant="primary" fullWidth size="lg" onClick={onNext} disabled={!selectedAddress}>
          Continue to Payment
        </HapticButton>
      </div>
    </>
  );
}

function AddAddressForm({ onSubmit, onCancel }: { onSubmit: (data: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState({ name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', type: 'home' });
  const handleChange = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSubmit(form); };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Input label="Full Name" placeholder="John Doe" value={form.name} onChange={e => handleChange('name', e.target.value)} required autoComplete="name" />
        <Input label="Phone Number" placeholder="98765 43210" value={form.phone} onChange={e => handleChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} required autoComplete="tel" maxLength={10} />
      </div>
      <Input label="Address Line 1" placeholder="House/Flat No., Building, Street" value={form.line1} onChange={e => handleChange('line1', e.target.value)} required autoComplete="address-line1" />
      <Input label="Address Line 2 (Optional)" placeholder="Landmark, Area, Colony" value={form.line2} onChange={e => handleChange('line2', e.target.value)} autoComplete="address-line2" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Input label="City" placeholder="Mumbai" value={form.city} onChange={e => handleChange('city', e.target.value)} required autoComplete="address-level2" />
        <Select label="State" placeholder="Select State" value={form.state} onChange={e => handleChange('state', e.target.value)} required options={indianStates.map(s => ({ value: s, label: s }))} />
      </div>
      <Input label="Pincode" placeholder="400001" value={form.pincode} onChange={e => handleChange('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} required autoComplete="postal-code" maxLength={6} pattern="[0-9]{6}" />
      <div style={{ display: 'flex', gap: '8px' }}>
        {(['home', 'work', 'other'] as const).map(type => (
          <label key={type} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', border: `2px solid ${form.type === type ? mobileDesign.colors.accent : mobileDesign.colors.border}`, borderRadius: `${mobileDesign.borderRadius.md}px`, background: form.type === type ? mobileDesign.colors.accentLight : mobileDesign.colors.surface, color: form.type === type ? mobileDesign.colors.accentDark : mobileDesign.colors.textPrimary, fontSize: '13px', fontWeight: 500, fontFamily: mobileDesign.typography.fontFamily, cursor: 'pointer' }}>
            <input type="radio" name="type" value={type} checked={form.type === type} onChange={() => handleChange('type', type)} style={{ width: '18px', height: '18px', accentColor: mobileDesign.colors.accent }} />
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </label>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
        <HapticButton variant="outline" fullWidth onClick={onCancel}>Cancel</HapticButton>
        <HapticButton variant="primary" fullWidth type="submit">Save Address</HapticButton>
      </div>
    </form>
  );
}

const indianStates = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'];

function PaymentMethodStep({
  paymentMethods,
  selectedPayment,
  onSelectPayment,
  onNext,
  onBack,
}: {
  paymentMethods: PaymentMethod[];
  selectedPayment: string;
  onSelectPayment: (id: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        style={{ padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.lg}px` }}
      >
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: mobileDesign.colors.textSecondary, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Payment Method</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {paymentMethods.map(method => (
            <motion.button
              key={method.id}
              onClick={() => onSelectPayment(method.id)}
              whileTap={{ scale: 0.99 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '16px',
                border: `2px solid ${selectedPayment === method.id ? mobileDesign.colors.accent : mobileDesign.colors.border}`,
                borderRadius: `${mobileDesign.borderRadius.lg}px`,
                background: selectedPayment === method.id ? mobileDesign.colors.accentLight : mobileDesign.colors.surface,
                cursor: 'pointer', textAlign: 'left', transition: `all ${mobileDesign.transitions.fast}`,
              }}
            >
              <div
                style={{
                  width: '48px', height: '48px', borderRadius: `${mobileDesign.borderRadius.md}px`,
                  background: selectedPayment === method.id ? mobileDesign.colors.accent : mobileDesign.colors.borderLight,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: selectedPayment === method.id ? mobileDesign.colors.textInverse : mobileDesign.colors.textSecondary,
                }}
              >
                {method.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: mobileDesign.colors.textPrimary }}>{method.name}</span>
                  {method.recommended && <Badge variant="accent" size="sm" dot>Recommended</Badge>}
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: mobileDesign.colors.textSecondary }}>{method.details}</p>
              </div>
              <div
                style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  border: `2px solid ${selectedPayment === method.id ? mobileDesign.colors.accent : mobileDesign.colors.border}`,
                  background: selectedPayment === method.id ? mobileDesign.colors.accent : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: mobileDesign.colors.textInverse,
                }}
              >
                {selectedPayment === method.id && <Check style={{ width: 14, height: 14 }} aria-hidden="true" />}
              </div>
            </motion.button>
          ))}
        </div>
      </motion.section>

      <div style={{ position: 'sticky', bottom: 0, background: mobileDesign.colors.background, padding: '16px', borderTop: `1px solid ${mobileDesign.colors.borderLight}`, display: 'flex', gap: '12px' }}>
        <HapticButton variant="outline" fullWidth onClick={onBack} style={{ flex: 1 }}>Back</HapticButton>
        <HapticButton variant="primary" fullWidth onClick={onNext} style={{ flex: 1 }}>Continue to Review</HapticButton>
      </div>
    </>
  );
}

type OrderItem = {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice: number;
  image: string;
  color: string;
  storage: string;
  protectionPlan?: string | null;
  protectionPrice: number;
  quantity: number;
};

type Address = {
  id: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  type: 'home' | 'work' | 'other';
};

type PaymentMethod = {
  id: string;
  name: string;
  icon: React.ReactNode;
  details: string;
  recommended?: boolean;
};

function ReviewOrderStep({
  orderItems,
  selectedAddress,
  selectedPayment,
  subtotal,
  savings,
  protectionTotal,
  finalShipping,
  needsShipping,
  codFee,
  promoCode,
  setPromoCode,
  appliedPromo,
  promoError,
  promoSuccess,
  applyPromo,
  removePromo,
  promoDiscount,
  finalTotal,
  expandedSections,
  setExpandedSections,
  onBack,
  onPlaceOrder,
  isProcessing,
  toggleSection,
  setPromoError,
  setPromoSuccess,
}: {
  orderItems: OrderItem[];
  selectedAddress: Address;
  selectedPayment: PaymentMethod;
  subtotal: number;
  savings: number;
  protectionTotal: number;
  finalShipping: number;
  needsShipping: boolean;
  codFee: number;
  promoCode: string;
  setPromoCode: (v: string) => void;
  setPromoError: (v: string) => void;
  setPromoSuccess: (v: string) => void;
  appliedPromo: string | null;
  promoError: string;
  promoSuccess: string;
  applyPromo: () => void;
  removePromo: () => void;
  promoDiscount: number;
  finalTotal: number;
  expandedSections: Set<string>;
  setExpandedSections: (s: Set<string>) => void;
  toggleSection: (section: string) => void;
  onBack: () => void;
  onPlaceOrder: () => void;
  isProcessing: boolean;
}) {

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        style={{ padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.lg}px` }}
      >
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: mobileDesign.colors.textSecondary, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Order Summary</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {orderItems.map(item => (
            <div key={item.id} style={{ display: 'flex', gap: '12px', padding: '12px', background: mobileDesign.colors.surface, borderRadius: `${mobileDesign.borderRadius.md}px`, border: `1px solid ${mobileDesign.colors.borderLight}` }}>
              <div style={{ width: '60px', height: '60px', borderRadius: `${mobileDesign.borderRadius.md}px`, background: mobileDesign.colors.borderLight, flexShrink: 0, overflow: 'hidden' }}>
                <MobileImage src={item.image} alt="" sizes="72px" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: mobileDesign.colors.textPrimary, lineHeight: 1.3 }}>{item.name}</p>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: mobileDesign.colors.textSecondary }}>{item.color}{item.storage && ` • ${item.storage}`}{item.protectionPlan && ` • ${item.protectionPlan}`}</p>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: mobileDesign.colors.textTertiary }}>Qty: {item.quantity}</p>
              </div>
              <span style={{ fontSize: '14px', fontWeight: 600, color: mobileDesign.colors.textPrimary, alignSelf: 'center' }}>{formatINR((item.price + item.protectionPrice) * item.quantity)}</span>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        style={{ padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.lg}px` }}
      >
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: mobileDesign.colors.textSecondary, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Delivery Address</h3>
        <Card variant="outlined" padding="md">
          <div style={{ display: 'flex', gap: '12px' }}>
            <MapPin style={{ width: 20, height: 20, color: mobileDesign.colors.accent, flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
            <div>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: mobileDesign.colors.textPrimary }}>{selectedAddress.name}</p>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: mobileDesign.colors.textSecondary }}>{selectedAddress.phone}</p>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: mobileDesign.colors.textSecondary, lineHeight: 1.5 }}>
                {selectedAddress.line1}{selectedAddress.line2 && `, ${selectedAddress.line2}`}, {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
              </p>
            </div>
          </div>
        </Card>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        style={{ padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.lg}px` }}
      >
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: mobileDesign.colors.textSecondary, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Payment Method</h3>
        <Card variant="outlined" padding="md">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: `${mobileDesign.borderRadius.md}px`, background: mobileDesign.colors.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: mobileDesign.colors.accent }}>
              {selectedPayment.icon}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: mobileDesign.colors.textPrimary }}>{selectedPayment.name}</p>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: mobileDesign.colors.textSecondary }}>{selectedPayment.details}</p>
            </div>
          </div>
        </Card>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        style={{ padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.lg}px` }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: mobileDesign.colors.textSecondary, margin: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>Price Details</h3>
          <motion.button onClick={() => toggleSection('summary')} whileTap={{ scale: 0.95 }} style={{ border: 'none', background: 'transparent', color: mobileDesign.colors.accent, fontSize: '13px', fontWeight: 500, fontFamily: mobileDesign.typography.fontFamily, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {expandedSections.has('summary') ? <ChevronUp style={{ width: 16, height: 16 }} /> : <ChevronDown style={{ width: 16, height: 16 }} />}
          </motion.button>
        </div>
        <AnimatePresence>
          {expandedSections.has('summary') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden', background: mobileDesign.colors.surface, borderRadius: `${mobileDesign.borderRadius.lg}px`, padding: '16px', boxShadow: mobileDesign.shadows.sm }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: mobileDesign.colors.textSecondary }}>Subtotal ({orderItems.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: mobileDesign.colors.textPrimary }}>{formatINR(subtotal)}</span>
              </div>
              {savings > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: mobileDesign.colors.success }}>
                  <span style={{ fontSize: '14px' }}>Savings</span>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>-{formatINR(savings)}</span>
                </div>
              )}
              {protectionTotal > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', color: mobileDesign.colors.textSecondary }}>Protection Plans</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: mobileDesign.colors.textPrimary }}>{formatINR(protectionTotal)}</span>
                </div>
              )}
              {appliedPromo && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: mobileDesign.colors.success }}>
                  <span style={{ fontSize: '14px' }}>Promo Discount ({appliedPromo})</span>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>-{formatINR(promoDiscount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: mobileDesign.colors.textSecondary }}>
                  Shipping
                  {needsShipping && <span style={{ marginLeft: '4px', fontSize: '11px', color: mobileDesign.colors.accent }}>Free above ₹499</span>}
                </span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: needsShipping ? mobileDesign.colors.accent : mobileDesign.colors.success }}>
                  {needsShipping ? formatINR(finalShipping) : 'FREE'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', color: mobileDesign.colors.textSecondary }}>COD Fee</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: mobileDesign.colors.textPrimary }}>{formatINR(codFee)}</span>
              </div>
              <div style={{ borderTop: `1px solid ${mobileDesign.colors.border}`, paddingTop: '12px', marginTop: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '18px', fontWeight: 700, color: mobileDesign.colors.textPrimary }}>Total</span>
                  <span style={{ fontSize: '20px', fontWeight: 700, color: mobileDesign.colors.accent }}>{formatINR(finalTotal)}</span>
                </div>
                <p style={{ marginTop: '8px', fontSize: '12px', color: mobileDesign.colors.textTertiary, textAlign: 'right' }}>Incl. of all taxes</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        style={{ padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.lg}px` }}
      >
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: mobileDesign.colors.textSecondary, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Promo Code</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={promoCode}
            onChange={e => { setPromoCode(e.target.value); setPromoError(''); }}
            placeholder="Enter promo code"
            style={{
              flex: 1, padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.lg}px`,
              border: `1px solid ${promoError ? mobileDesign.colors.error : mobileDesign.colors.border}`,
              borderRadius: `${mobileDesign.borderRadius.md}px`, background: mobileDesign.colors.surface,
              fontSize: '15px', fontFamily: mobileDesign.typography.fontFamily, color: mobileDesign.colors.textPrimary,
              outline: 'none',
            }}
            aria-label="Promo code"
          />
          {appliedPromo ? (
            <motion.button onClick={removePromo} whileTap={{ scale: 0.95 }} style={{
              padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.lg}px`, border: 'none', borderRadius: `${mobileDesign.borderRadius.md}px`,
              background: mobileDesign.colors.errorLight, color: mobileDesign.colors.error,
              fontSize: '14px', fontWeight: 600, fontFamily: mobileDesign.typography.fontFamily, cursor: 'pointer',
            }}>Remove</motion.button>
          ) : (
            <HapticButton onClick={applyPromo} disabled={!promoCode.trim()} style={{ minWidth: '100px' }}>Apply</HapticButton>
          )}
        </div>
        {promoError && <p style={{ marginTop: '8px', fontSize: '13px', color: mobileDesign.colors.error }}>{promoError}</p>}
        {promoSuccess && <p style={{ marginTop: '8px', fontSize: '13px', color: mobileDesign.colors.success }}>{promoSuccess}</p>}
      </motion.section>

      <div style={{ position: 'sticky', bottom: 0, background: mobileDesign.colors.background, padding: '16px', borderTop: `1px solid ${mobileDesign.colors.borderLight}`, display: 'flex', gap: '12px' }}>
        <HapticButton variant="outline" fullWidth onClick={onBack} style={{ flex: 1 }}>Back</HapticButton>
        <HapticButton variant="primary" fullWidth size="xl" onClick={onPlaceOrder} loading={isProcessing} style={{ flex: 1 }}>
          Place Order · {formatINR(finalTotal)}
        </HapticButton>
      </div>
    </>
  );
}