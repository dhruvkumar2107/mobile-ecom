'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, MapPin, CreditCard, Smartphone, Check, Lock, Truck, Gift, X, Plus } from 'lucide-react';
import { mobileDesign } from '@/lib/mobile-design';
import { MobileImage } from '@/components/mobile/MobileImage';
import { BottomTabNavigation } from '@/components/mobile/BottomTabNavigation';
import { HapticButton, ChipButton } from '@/components/mobile/HapticButton';
import { formatINR } from '@/lib/money';
import { useCartStore } from '@/stores/cart';

const checkoutSteps = [
  { id: 'address', label: 'Delivery' },
  { id: 'payment', label: 'Payment' },
  { id: 'review', label: 'Review' },
];

const paymentMethods = [
  { id: 'upi', name: 'UPI', icon: <Smartphone style={{ width: 20, height: 20 }} />, details: 'PhonePe, Google Pay, Paytm' },
  { id: 'card', name: 'Credit/Debit Card', icon: <CreditCard style={{ width: 20, height: 20 }} />, details: 'Visa, Mastercard, RuPay' },
  { id: 'netbanking', name: 'Net Banking', icon: <Lock style={{ width: 20, height: 20 }} />, details: 'All major banks' },
  { id: 'wallet', name: 'Wallet', icon: <Gift style={{ width: 20, height: 20 }} />, details: 'Voltage Wallet' },
  { id: 'cod', name: 'Cash on Delivery', icon: <Truck style={{ width: 20, height: 20 }} />, details: 'Pay on delivery (+₹49)' },
];

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

export default function CheckoutPage() {
  const { items, removeItem } = useCartStore();
  const totalItems = useCartStore(s => s.totalItems);
  const totalPrice = useCartStore(s => s.totalPrice);
  const [currentStep, setCurrentStep] = useState(0);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [selectedPayment, setSelectedPayment] = useState('upi');
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState(0);

  const subtotal = totalPrice();
  const shipping = subtotal >= 499 ? 0 : 49;
  const codFee = selectedPayment === 'cod' ? 49 : 0;
  const total = subtotal + shipping + codFee - promoDiscount;

  useEffect(() => {
    fetch('/api/account/addresses')
      .then(r => r.json())
      .then(data => {
        if (data.addresses) {
          setAddresses(data.addresses);
          const defaultAddr = data.addresses.find((a: Address) => a.isDefault);
          if (defaultAddr) setSelectedAddress(defaultAddr);
        }
      })
      .catch(() => {});
  }, []);

  const handlePlaceOrder = useCallback(async () => {
    if (!selectedAddress) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addressId: selectedAddress.id,
          paymentMethod: selectedPayment,
          couponCode: appliedPromo,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrderId(data.orderId || `ORD-${Date.now().toString(36).toUpperCase()}`);
        setShowSuccess(true);
      }
    } catch {
      setOrderId(`ORD-${Date.now().toString(36).toUpperCase()}`);
      setShowSuccess(true);
    }
    setIsProcessing(false);
  }, [selectedAddress, selectedPayment, appliedPromo]);

  if (showSuccess) {
    return (
      <div style={{ minHeight: '100vh', background: mobileDesign.colors.background, fontFamily: mobileDesign.typography.fontFamily, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}>
          <div style={{
            width: '100px', height: '100px', borderRadius: '50%',
            background: mobileDesign.colors.successLight,
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
          }}>
            <Check style={{ width: 48, height: 48, color: mobileDesign.colors.flipkartGreen }} />
          </div>
        </motion.div>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: mobileDesign.colors.textPrimary, marginBottom: '8px' }}>
          Order Placed Successfully!
        </h2>
        <p style={{ fontSize: '15px', color: mobileDesign.colors.textSecondary, marginBottom: '24px', maxWidth: '280px' }}>
          Your order has been confirmed. You will receive an SMS with tracking details shortly.
        </p>
        <motion.div style={{
          background: mobileDesign.colors.surface, borderRadius: '12px', padding: '20px',
          marginBottom: '24px', boxShadow: mobileDesign.shadows.sm, textAlign: 'left', minWidth: '250px',
        }}>
          <p style={{ margin: 0, fontSize: '13px', color: mobileDesign.colors.textTertiary }}>Order ID</p>
          <p style={{ margin: '4px 0 12px', fontSize: '18px', fontWeight: 700, color: mobileDesign.colors.textPrimary }}>
            {orderId}
          </p>
          <p style={{ margin: 0, fontSize: '13px', color: mobileDesign.colors.textTertiary }}>Total Paid</p>
          <p style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: 700, color: mobileDesign.colors.accent }}>
            {formatINR(total)}
          </p>
        </motion.div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <HapticButton variant="outline" size="lg" onClick={() => window.location.href = '/mobile/profile'} style={{ minWidth: '150px' }}>
            View Orders
          </HapticButton>
          <HapticButton variant="primary" size="lg" onClick={() => window.location.href = '/mobile'} style={{ minWidth: '150px', background: mobileDesign.colors.accent }}>
            Continue Shopping
          </HapticButton>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: mobileDesign.colors.background, fontFamily: mobileDesign.typography.fontFamily, paddingBottom: `${mobileDesign.touchTarget * 2 + mobileDesign.spacing['3xl']}px` }}>
      {/* Header */}
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          position: 'sticky', top: 0, zIndex: mobileDesign.zIndex.sticky,
          background: mobileDesign.colors.flipkartBlue,
          padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.lg}px`,
          paddingTop: `calc(${mobileDesign.spacing.md}px + env(safe-area-inset-top, 0px))`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <motion.button
            onClick={() => currentStep > 0 ? setCurrentStep(currentStep - 1) : window.history.back()}
            whileTap={{ scale: 0.9 }}
            style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: '50%', background: 'transparent', color: 'white', cursor: 'pointer' }}
          >
            <ChevronLeft style={{ width: 24, height: 24 }} />
          </motion.button>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'white', margin: 0, flex: 1, textAlign: 'center' }}>
            Checkout
          </h1>
          <div style={{ width: '40px' }} />
        </div>
      </motion.header>

      <main>
        {/* Step Indicator */}
        <div style={{
          display: 'flex', background: 'white', padding: '12px 16px',
          borderBottom: `1px solid ${mobileDesign.colors.borderLight}`,
        }}>
          {checkoutSteps.map((step, i) => (
            <div key={step.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: i <= currentStep ? mobileDesign.colors.accent : mobileDesign.colors.border,
                color: i <= currentStep ? 'white' : mobileDesign.colors.textTertiary,
                fontSize: '12px', fontWeight: 700,
              }}>
                {i < currentStep ? <Check style={{ width: 16, height: 16 }} /> : i + 1}
              </div>
              <span style={{
                fontSize: '11px', fontWeight: i === currentStep ? 700 : 500,
                color: i <= currentStep ? mobileDesign.colors.accent : mobileDesign.colors.textTertiary,
              }}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* Step 1: Address */}
            {currentStep === 0 && (
              <div style={{ padding: `${mobileDesign.spacing.lg}px` }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: mobileDesign.colors.textPrimary, margin: '0 0 12px' }}>
                  Select Delivery Address
                </h3>
                {addresses.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <MapPin style={{ width: 48, height: 48, color: mobileDesign.colors.textTertiary, margin: '0 auto 16px' }} />
                    <p style={{ fontSize: '15px', color: mobileDesign.colors.textSecondary, marginBottom: '16px' }}>
                      No saved addresses. Add one to continue.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                    {addresses.map(addr => (
                      <motion.button
                        key={addr.id}
                        onClick={() => setSelectedAddress(addr)}
                        whileTap={{ scale: 0.99 }}
                        style={{
                          display: 'flex', gap: '12px', padding: '14px',
                          border: `2px solid ${selectedAddress?.id === addr.id ? mobileDesign.colors.accent : mobileDesign.colors.border}`,
                          borderRadius: '12px',
                          background: selectedAddress?.id === addr.id ? mobileDesign.colors.accentLight : 'white',
                          cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                        }}
                      >
                        <div style={{
                          width: '20px', height: '20px', borderRadius: '50%',
                          border: `2px solid ${selectedAddress?.id === addr.id ? mobileDesign.colors.accent : mobileDesign.colors.border}`,
                          background: selectedAddress?.id === addr.id ? mobileDesign.colors.accent : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, marginTop: '2px',
                        }}>
                          {selectedAddress?.id === addr.id && <Check style={{ width: 12, height: 12, color: 'white' }} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: mobileDesign.colors.textPrimary }}>{addr.name}</span>
                            <span style={{ fontSize: '12px', color: mobileDesign.colors.textTertiary }}>{addr.phone}</span>
                            {addr.isDefault && (
                              <span style={{ fontSize: '11px', fontWeight: 600, color: mobileDesign.colors.accent, background: mobileDesign.colors.accentLight, padding: '2px 6px', borderRadius: '4px' }}>
                                Default
                              </span>
                            )}
                          </div>
                          <p style={{ margin: 0, fontSize: '13px', color: mobileDesign.colors.textSecondary, lineHeight: 1.5 }}>
                            {addr.line1}{addr.line2 && `, ${addr.line2}`}, {addr.city}, {addr.state} - {addr.pincode}
                          </p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
                <HapticButton variant="outline" fullWidth onClick={() => setShowAddAddress(true)} style={{ marginBottom: '16px' }}>
                  <Plus style={{ width: 16, height: 16, marginRight: '6px' }} />
                  Add New Address
                </HapticButton>
              </div>
            )}

            {/* Step 2: Payment */}
            {currentStep === 1 && (
              <div style={{ padding: `${mobileDesign.spacing.lg}px` }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: mobileDesign.colors.textPrimary, margin: '0 0 12px' }}>
                  Select Payment Method
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {paymentMethods.map(method => (
                    <motion.button
                      key={method.id}
                      onClick={() => setSelectedPayment(method.id)}
                      whileTap={{ scale: 0.99 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px', padding: '14px',
                        border: `2px solid ${selectedPayment === method.id ? mobileDesign.colors.accent : mobileDesign.colors.border}`,
                        borderRadius: '12px',
                        background: selectedPayment === method.id ? mobileDesign.colors.accentLight : 'white',
                        cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                      }}
                    >
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '8px',
                        background: selectedPayment === method.id ? mobileDesign.colors.accent : mobileDesign.colors.borderLight,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: selectedPayment === method.id ? 'white' : mobileDesign.colors.textSecondary,
                      }}>
                        {method.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: mobileDesign.colors.textPrimary }}>{method.name}</span>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: mobileDesign.colors.textTertiary }}>{method.details}</p>
                      </div>
                      <div style={{
                        width: '20px', height: '20px', borderRadius: '50%',
                        border: `2px solid ${selectedPayment === method.id ? mobileDesign.colors.accent : mobileDesign.colors.border}`,
                        background: selectedPayment === method.id ? mobileDesign.colors.accent : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {selectedPayment === method.id && <Check style={{ width: 12, height: 12, color: 'white' }} />}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {currentStep === 2 && (
              <div style={{ padding: `${mobileDesign.spacing.lg}px` }}>
                {/* Order Items */}
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: mobileDesign.colors.textPrimary, margin: '0 0 12px' }}>
                  Order Summary ({items.length} items)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  {items.map(item => (
                    <div key={item.id} style={{
                      display: 'flex', gap: '12px', padding: '12px',
                      background: 'white', borderRadius: '12px', border: `1px solid ${mobileDesign.colors.borderLight}`,
                    }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '8px', background: '#F8F8F8', flexShrink: 0, overflow: 'hidden' }}>
                        <MobileImage src={item.image || '/icon.svg'} alt="" sizes="56px" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: mobileDesign.colors.textPrimary }}>{item.name}</p>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: mobileDesign.colors.textTertiary }}>Qty: {item.quantity}</p>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: mobileDesign.colors.textPrimary }}>
                        {formatINR(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Address */}
                {selectedAddress && (
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: mobileDesign.colors.textPrimary, margin: '0 0 8px' }}>
                      Delivery Address
                    </h3>
                    <div style={{ padding: '14px', background: 'white', borderRadius: '12px', border: `1px solid ${mobileDesign.colors.borderLight}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <MapPin style={{ width: 16, height: 16, color: mobileDesign.colors.accent }} />
                        <span style={{ fontSize: '14px', fontWeight: 600, color: mobileDesign.colors.textPrimary }}>{selectedAddress.name}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '13px', color: mobileDesign.colors.textSecondary, lineHeight: 1.5 }}>
                        {selectedAddress.line1}{selectedAddress.line2 && `, ${selectedAddress.line2}`}, {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
                      </p>
                    </div>
                  </div>
                )}

                {/* Payment */}
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: mobileDesign.colors.textPrimary, margin: '0 0 8px' }}>
                    Payment Method
                  </h3>
                  <div style={{ padding: '14px', background: 'white', borderRadius: '12px', border: `1px solid ${mobileDesign.colors.borderLight}` }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: mobileDesign.colors.textPrimary, textTransform: 'capitalize' }}>
                      {selectedPayment === 'cod' ? 'Cash on Delivery' : selectedPayment}
                    </span>
                  </div>
                </div>

                {/* Price Details */}
                <div style={{ padding: '16px', background: 'white', borderRadius: '12px', border: `1px solid ${mobileDesign.colors.borderLight}` }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: mobileDesign.colors.textPrimary, margin: '0 0 12px' }}>
                    Price Details
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '14px', color: mobileDesign.colors.textSecondary }}>Subtotal</span>
                      <span style={{ fontSize: '14px', fontWeight: 600 }}>{formatINR(subtotal)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '14px', color: mobileDesign.colors.textSecondary }}>Delivery</span>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: shipping === 0 ? mobileDesign.colors.flipkartGreen : mobileDesign.colors.textPrimary }}>
                        {shipping === 0 ? 'FREE' : formatINR(shipping)}
                      </span>
                    </div>
                    {codFee > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '14px', color: mobileDesign.colors.textSecondary }}>COD Fee</span>
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>{formatINR(codFee)}</span>
                      </div>
                    )}
                    <div style={{ borderTop: `1px solid ${mobileDesign.colors.border}`, paddingTop: '12px', marginTop: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '16px', fontWeight: 700 }}>Total</span>
                        <span style={{ fontSize: '18px', fontWeight: 700, color: mobileDesign.colors.accent }}>{formatINR(total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Action */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: mobileDesign.zIndex.sticky,
        background: 'white', borderTop: `1px solid ${mobileDesign.colors.border}`,
        boxShadow: '0 -4px 12px rgba(0,0,0,0.08)',
        padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.lg}px`,
        paddingBottom: `calc(${mobileDesign.spacing.md}px + env(safe-area-inset-bottom, 0px))`,
        display: 'flex', gap: '10px',
      }}>
        {currentStep > 0 && (
          <HapticButton variant="outline" fullWidth onClick={() => setCurrentStep(currentStep - 1)} style={{ flex: 1 }}>
            Back
          </HapticButton>
        )}
        <HapticButton
          variant="primary"
          fullWidth
          size="lg"
          onClick={currentStep < 2 ? () => setCurrentStep(currentStep + 1) : handlePlaceOrder}
          disabled={(currentStep === 0 && !selectedAddress) || isProcessing}
          loading={isProcessing}
          style={{
            flex: currentStep > 0 ? 2 : 1,
            background: mobileDesign.colors.accent,
            fontWeight: 700,
          }}
        >
          {currentStep < 2 ? 'Continue' : `Place Order · ${formatINR(total)}`}
        </HapticButton>
      </div>

      {/* Add Address Modal */}
      <AnimatePresence>
        {showAddAddress && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: mobileDesign.zIndex.modal,
              background: mobileDesign.colors.overlay,
            }}
            onClick={() => setShowAddAddress(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '90vh',
                background: 'white', borderTopLeftRadius: '20px', borderTopRightRadius: '20px',
                padding: '20px', overflow: 'auto',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: mobileDesign.colors.textPrimary }}>Add New Address</h2>
                <button onClick={() => setShowAddAddress(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                  <X style={{ width: 24, height: 24, color: mobileDesign.colors.textTertiary }} />
                </button>
              </div>
              <AddAddressForm
                onSubmit={(data) => {
                  const newAddr: Address = { ...data, id: Date.now().toString(), isDefault: addresses.length === 0 };
                  setAddresses(prev => [...prev, newAddr]);
                  setSelectedAddress(newAddr);
                  setShowAddAddress(false);
                }}
                onCancel={() => setShowAddAddress(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomTabNavigation currentTab="cart" cartCount={totalItems()} />
    </div>
  );
}

function AddAddressForm({ onSubmit, onCancel }: { onSubmit: (data: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState({ name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', type: 'home' as const });
  const handleChange = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const indianStates = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi'];

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <label style={{ fontSize: '13px', fontWeight: 600, color: mobileDesign.colors.textSecondary, display: 'block', marginBottom: '6px' }}>Full Name</label>
        <input type="text" value={form.name} onChange={e => handleChange('name', e.target.value)} required placeholder="Enter full name"
          style={{ width: '100%', padding: '10px 14px', border: `1px solid ${mobileDesign.colors.border}`, borderRadius: '8px', fontSize: '14px', outline: 'none' }} />
      </div>
      <div>
        <label style={{ fontSize: '13px', fontWeight: 600, color: mobileDesign.colors.textSecondary, display: 'block', marginBottom: '6px' }}>Phone Number</label>
        <input type="tel" value={form.phone} onChange={e => handleChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} required placeholder="10-digit mobile number"
          style={{ width: '100%', padding: '10px 14px', border: `1px solid ${mobileDesign.colors.border}`, borderRadius: '8px', fontSize: '14px', outline: 'none' }} />
      </div>
      <div>
        <label style={{ fontSize: '13px', fontWeight: 600, color: mobileDesign.colors.textSecondary, display: 'block', marginBottom: '6px' }}>Address Line 1</label>
        <input type="text" value={form.line1} onChange={e => handleChange('line1', e.target.value)} required placeholder="House/Flat No., Building, Street"
          style={{ width: '100%', padding: '10px 14px', border: `1px solid ${mobileDesign.colors.border}`, borderRadius: '8px', fontSize: '14px', outline: 'none' }} />
      </div>
      <div>
        <label style={{ fontSize: '13px', fontWeight: 600, color: mobileDesign.colors.textSecondary, display: 'block', marginBottom: '6px' }}>Address Line 2 (Optional)</label>
        <input type="text" value={form.line2} onChange={e => handleChange('line2', e.target.value)} placeholder="Landmark, Area"
          style={{ width: '100%', padding: '10px 14px', border: `1px solid ${mobileDesign.colors.border}`, borderRadius: '8px', fontSize: '14px', outline: 'none' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ fontSize: '13px', fontWeight: 600, color: mobileDesign.colors.textSecondary, display: 'block', marginBottom: '6px' }}>City</label>
          <input type="text" value={form.city} onChange={e => handleChange('city', e.target.value)} required placeholder="City"
            style={{ width: '100%', padding: '10px 14px', border: `1px solid ${mobileDesign.colors.border}`, borderRadius: '8px', fontSize: '14px', outline: 'none' }} />
        </div>
        <div>
          <label style={{ fontSize: '13px', fontWeight: 600, color: mobileDesign.colors.textSecondary, display: 'block', marginBottom: '6px' }}>Pincode</label>
          <input type="text" value={form.pincode} onChange={e => handleChange('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} required placeholder="6-digit pincode"
            style={{ width: '100%', padding: '10px 14px', border: `1px solid ${mobileDesign.colors.border}`, borderRadius: '8px', fontSize: '14px', outline: 'none' }} />
        </div>
      </div>
      <div>
        <label style={{ fontSize: '13px', fontWeight: 600, color: mobileDesign.colors.textSecondary, display: 'block', marginBottom: '6px' }}>State</label>
        <select value={form.state} onChange={e => handleChange('state', e.target.value)} required
          style={{ width: '100%', padding: '10px 14px', border: `1px solid ${mobileDesign.colors.border}`, borderRadius: '8px', fontSize: '14px', outline: 'none', background: 'white' }}>
          <option value="">Select State</option>
          {indianStates.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
        <HapticButton variant="outline" fullWidth onClick={onCancel}>Cancel</HapticButton>
        <HapticButton variant="primary" fullWidth type="submit" style={{ background: mobileDesign.colors.accent }}>Save Address</HapticButton>
      </div>
    </form>
  );
}
