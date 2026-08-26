'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Package, Truck, CheckCircle, Clock, AlertCircle, X, RotateCcw, Heart, Download, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { mobileDesign } from '@/lib/mobile-design';
import { MobileImage } from '@/components/mobile/MobileImage';
import { BottomTabNavigation } from '@/components/mobile/BottomTabNavigation';
import { HapticButton, ChipButton } from '@/components/mobile/HapticButton';
import { Card } from '@/components/mobile/Card';
import { Badge, type BadgeProps } from '@/components/mobile/Badge';
import { Stepper } from '@/components/mobile/List';
import { formatINR } from '@/lib/money';
import { format } from 'date-fns';
import type { LucideIcon } from 'lucide-react';

type BadgeVariant = NonNullable<BadgeProps['variant']>;

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export interface OrderItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  quantity: number;
  color: string;
  storage: string;
}

export interface Order {
  id: string;
  date: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  address: string;
  paymentMethod: string;
  trackingNumber: string | null;
  estimatedDelivery: string | null;
}

const orders: Order[] = [
  {
    id: 'ORD-2024-001',
    date: '2024-01-15T10:30:00Z',
    status: 'delivered',
    items: [
      { id: '1', name: 'iPhone 15 Pro Max', brand: 'Apple', price: 159900, image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&q=80', quantity: 1, color: 'Natural Titanium', storage: '256 GB' },
      { id: '2', name: 'AirPods Pro 2', brand: 'Apple', price: 24900, image: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400&q=80', quantity: 1, color: 'White', storage: '' },
    ],
    total: 184800,
    address: '123 MG Road, Apartment 4B, Mumbai, Maharashtra - 400001',
    paymentMethod: 'UPI',
    trackingNumber: 'TRK123456789',
    estimatedDelivery: '2024-01-18T18:00:00Z',
  },
  {
    id: 'ORD-2024-002',
    date: '2024-01-10T14:20:00Z',
    status: 'shipped',
    items: [
      { id: '3', name: 'Sony WH-1000XM5', brand: 'Sony', price: 29990, image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&q=80', quantity: 1, color: 'Black', storage: '' },
    ],
    total: 29990,
    address: 'Cyber City, Tower A, Floor 12, Gurugram, Haryana - 122002',
    paymentMethod: 'Credit Card',
    trackingNumber: 'TRK987654321',
    estimatedDelivery: '2024-01-13T18:00:00Z',
  },
  {
    id: 'ORD-2024-003',
    date: '2024-01-05T09:15:00Z',
    status: 'cancelled',
    items: [
      { id: '4', name: 'MacBook Air M3', brand: 'Apple', price: 114900, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80', quantity: 1, color: 'Space Gray', storage: '512 GB' },
    ],
    total: 114900,
    address: '123 MG Road, Apartment 4B, Mumbai, Maharashtra - 400001',
    paymentMethod: 'Net Banking',
    trackingNumber: null,
    estimatedDelivery: null,
  },
  {
    id: 'ORD-2024-004',
    date: '2023-12-28T16:45:00Z',
    status: 'returned',
    items: [
      { id: '5', name: 'iPad Pro 12.9" M2', brand: 'Apple', price: 99900, image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&q=80', quantity: 1, color: 'Silver', storage: '256 GB' },
    ],
    total: 99900,
    address: '123 MG Road, Apartment 4B, Mumbai, Maharashtra - 400001',
    paymentMethod: 'Wallet',
    trackingNumber: 'RET555666777',
    estimatedDelivery: null,
  },
];

const FULFILMENT_STEPS = ['Order Placed', 'Confirmed', 'Packed', 'Shipped', 'Delivered'];

const statusConfig: Record<
  string,
  {
    label: string;
    badge: BadgeVariant;
    color: keyof typeof mobileDesign.colors;
    bg: keyof typeof mobileDesign.colors;
    icon: LucideIcon;
    steps: string[];
  }
> = {
  pending:   { label: 'Pending',   badge: 'warning', color: 'warning', bg: 'warningLight', icon: Clock,      steps: FULFILMENT_STEPS },
  confirmed: { label: 'Confirmed', badge: 'accent',  color: 'accent',  bg: 'accentLight',  icon: CheckCircle, steps: FULFILMENT_STEPS },
  shipped:   { label: 'Shipped',   badge: 'info',    color: 'plasma',  bg: 'plasmaLight',  icon: Truck,      steps: FULFILMENT_STEPS },
  delivered: { label: 'Delivered', badge: 'success', color: 'success', bg: 'successLight', icon: CheckCircle, steps: FULFILMENT_STEPS },
  cancelled: { label: 'Cancelled', badge: 'error',   color: 'error',   bg: 'errorLight',   icon: X,          steps: ['Order Placed', 'Cancelled'] },
  returned:  { label: 'Returned',  badge: 'error',   color: 'error',   bg: 'errorLight',   icon: RotateCcw,  steps: ['Order Placed', 'Delivered', 'Return Initiated', 'Returned', 'Refunded'] },
} as const;

const statusOrder: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'];


export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'addresses' | 'settings'>('orders');
  const [showOrderDetail, setShowOrderDetail] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetail(order.id);
  };

  const handleCloseOrderDetail = () => {
    setShowOrderDetail(null);
    setSelectedOrder(null);
  };

  return (
    <div style={{ minHeight: '100vh', background: mobileDesign.colors.background, fontFamily: mobileDesign.typography.fontFamily, paddingBottom: `${mobileDesign.touchTarget + mobileDesign.spacing['3xl']}px` }}>
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
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: mobileDesign.colors.textPrimary, margin: 0 }}>My Account</h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <motion.button whileTap={{ scale: 0.9 }} style={{ width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: '12px', background: mobileDesign.colors.borderLight, color: mobileDesign.colors.textPrimary, cursor: 'pointer' }} aria-label="Notifications"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 22, height: 22 }}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></motion.button>
            <motion.button whileTap={{ scale: 0.9 }} style={{ width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: '12px', background: mobileDesign.colors.borderLight, color: mobileDesign.colors.textPrimary, cursor: 'pointer' }} aria-label="Settings"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 22, height: 22 }}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 1 4.6 9a1.65 1.65 0 0 1 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 1-.33 1.82V9a1.65 1.65 0 0 1 1.51-1H9a2 2 0 0 1 2-2 2 2 0 0 1 2 2h.09a1.65 1.65 0 0 1 1 1.51 1.65 1.65 0 0 1-1.51 1H3a2 2 0 0 1-2 2 2 2 0 0 1 2 2h.09a1.65 1.65 0 0 1 1 1.51 1.65 1.65 0 0 1-1 1.51.09A1.65 1.65 0 0 1 9 20.4a1.65 1.65 0 0 1 1.82.33l.06.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 1-.33 1.82V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 1 9 14.6a1.65 1.65 0 0 1-1.82-.33l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06-.06a1.65 1.65 0 0 1 .33-1.82V3a1.65 1.65 0 0 1 1.51-1H9a2 2 0 0 1 2-2 2 2 0 0 1 2 2h.09a1.65 1.65 0 0 1 1 1.51 1.65 1.65 0 0 1-1.51 1H3a2 2 0 0 1-2 2 2 2 0 0 1 2 2h.09a1.65 1.65 0 0 1 1 1.51"/></svg></motion.button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {showOrderDetail && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed', inset: 0, zIndex: mobileDesign.zIndex.modal,
              background: mobileDesign.colors.overlay,
            }}
            onClick={handleCloseOrderDetail}
            role="dialog" aria-modal="true" aria-label="Order Details"
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: mobileDesign.colors.textPrimary }}>Order Details</h2>
                <button onClick={handleCloseOrderDetail} style={{ border: 'none', background: 'transparent', color: mobileDesign.colors.textTertiary, cursor: 'pointer', padding: 8 }} />
              </div>
              <OrderDetailView order={selectedOrder} onClose={handleCloseOrderDetail} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ padding: `${mobileDesign.spacing.lg}px` }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {(['orders', 'wishlist', 'addresses', 'settings'] as const).map(tab => (
            <ChipButton
              key={tab}
              variant="accent"
              selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              style={{ whiteSpace: 'nowrap' }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </ChipButton>
          ))}
        </div>

        {activeTab === 'orders' && (
          <OrdersTab orders={orders} onOrderClick={handleOrderClick} />
        )}
        {activeTab === 'wishlist' && (
          <WishlistTab />
        )}
        {activeTab === 'addresses' && (
          <AddressesTab />
        )}
        {activeTab === 'settings' && (
          <SettingsTab />
        )}
      </div>

      <BottomTabNavigation currentTab="profile" cartCount={0} />
    </div>
  );
}

function OrdersTab({ orders, onOrderClick }: { orders: Order[]; onOrderClick: (order: Order) => void }) {
  if (orders.length === 0) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: mobileDesign.colors.borderLight, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <Package style={{ width: 48, height: 48, color: mobileDesign.colors.textTertiary }} aria-hidden="true" />
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: mobileDesign.colors.textPrimary, marginBottom: '8px' }}>No orders yet</h2>
        <p style={{ fontSize: '15px', color: mobileDesign.colors.textSecondary, marginBottom: '24px', maxWidth: '280px' }}>You haven't placed any orders yet. Start shopping to see your orders here!</p>
        <HapticButton variant="primary" size="lg" onClick={() => window.location.href = '/mobile'} style={{ minWidth: '200px' }}>
          Start Shopping
        </HapticButton>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {orders.map((order, index) => (
        <motion.div
          key={order.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onOrderClick(order)}
          style={{
            background: mobileDesign.colors.surface, borderRadius: `${mobileDesign.borderRadius.lg}px`,
            boxShadow: mobileDesign.shadows.sm, cursor: 'pointer', overflow: 'hidden',
            border: `1px solid ${mobileDesign.colors.borderLight}`, transition: `box-shadow ${mobileDesign.transitions.fast}`,
          }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = mobileDesign.shadows.md}
          onMouseLeave={e => e.currentTarget.style.boxShadow = mobileDesign.shadows.sm}
        >
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: mobileDesign.colors.textPrimary }}>{order.id}</p>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: mobileDesign.colors.textSecondary }}>{format(new Date(order.date), 'MMM d, yyyy • h:mm a')}</p>
              </div>
              <Badge
                variant={statusConfig[order.status].badge}
                dot
              >
                {statusConfig[order.status].label}
              </Badge>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              {order.items.slice(0, 2).map(item => (
                <div key={item.id} style={{ width: '60px', height: '60px', borderRadius: '8px', background: mobileDesign.colors.borderLight, flexShrink: 0, overflow: 'hidden' }}>
                  <MobileImage src={item.image} alt="" sizes="72px" />
                </div>
              ))}
              {order.items.length > 2 && (
                <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: mobileDesign.colors.borderLight, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: mobileDesign.colors.textSecondary, fontSize: '12px', fontWeight: 600 }}>
                  +{order.items.length - 2}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: mobileDesign.colors.textPrimary, lineHeight: 1.3 }}>{order.items[0].name}</p>
                {order.items[0].color && <p style={{ margin: '2px 0 0', fontSize: '12px', color: mobileDesign.colors.textSecondary }}>{order.items[0].color}{order.items[0].storage && ` • ${order.items[0].storage}`}</p>}
                {order.items.length > 1 && <p style={{ margin: '2px 0 0', fontSize: '12px', color: mobileDesign.colors.textTertiary }}>+{order.items.length - 1} more item{order.items.length - 1 > 1 ? 's' : ''}</p>}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: `1px solid ${mobileDesign.colors.borderLight}` }}>
              <span style={{ fontSize: '16px', fontWeight: 700, color: mobileDesign.colors.textPrimary }}>{formatINR(order.total)}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {order.status === 'delivered' && (
                  <HapticButton variant="outline" size="sm" onClick={e => { e.stopPropagation(); }} style={{ minWidth: 'auto' }}>
                    <Download style={{ width: 14, height: 14, marginRight: 4 }} aria-hidden="true" />
                    Invoice
                  </HapticButton>
                )}
                {order.status === 'delivered' && (
                  <HapticButton variant="outline" size="sm" onClick={e => { e.stopPropagation(); }} style={{ minWidth: 'auto' }}>
                    <RotateCcw style={{ width: 14, height: 14, marginRight: 4 }} aria-hidden="true" />
                    Return
                  </HapticButton>
                )}
                {order.status === 'shipped' && (
                  <HapticButton variant="primary" size="sm" onClick={e => { e.stopPropagation(); }} style={{ minWidth: 'auto' }}>
                    <Truck style={{ width: 14, height: 14, marginRight: 4 }} aria-hidden="true" />
                    Track
                  </HapticButton>
                )}
                {order.status !== 'delivered' && order.status !== 'shipped' && order.status !== 'cancelled' && (
                  <HapticButton variant="outline" size="sm" onClick={e => { e.stopPropagation(); }} style={{ minWidth: 'auto' }}>
                    <RotateCcw style={{ width: 14, height: 14, marginRight: 4 }} aria-hidden="true" />
                    Reorder
                  </HapticButton>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function OrderDetailView({ order, onClose }: { order: Order; onClose: () => void }) {
  const config = statusConfig[order.status];

  return (
    <div>
      <Card variant="elevated" padding="lg" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: mobileDesign.colors[config.bg], display: 'flex', alignItems: 'center', justifyContent: 'center', color: mobileDesign.colors[config.color] }}>
            <config.icon style={{ width: 24, height: 24 }} aria-hidden="true" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: mobileDesign.colors.textPrimary }}>{order.id}</p>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: mobileDesign.colors.textSecondary }}>{format(new Date(order.date), 'MMMM d, yyyy at h:mm a')}</p>
          </div>
        </div>

        <Stepper
          steps={config.steps.map((step, i) => {
            const currentStatusIndex = statusOrder.indexOf(order.status);
            const stepIndex = i;
            let completed = false, active = false, error = false;
            if (order.status === 'cancelled' || order.status === 'returned') {
              error = stepIndex > 1;
              completed = stepIndex <= 1;
              active = stepIndex === 1;
            } else {
              completed = stepIndex < currentStatusIndex;
              active = stepIndex === currentStatusIndex;
            }
            return { label: step, completed, active, error };
          })}
          currentStep={statusOrder.indexOf(order.status)}
          orientation="vertical"
          variant="compact"
        />
      </Card>

      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: mobileDesign.colors.textSecondary, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Items</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {order.items.map(item => (
            <Card key={item.id} variant="outlined" padding="md">
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '8px', background: mobileDesign.colors.borderLight, flexShrink: 0, overflow: 'hidden' }}>
                  <MobileImage src={item.image} alt="" sizes="72px" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: mobileDesign.colors.textPrimary }}>{item.name}</p>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: mobileDesign.colors.textSecondary }}>{item.color}{item.storage && ` • ${item.storage}`}</p>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: mobileDesign.colors.textTertiary }}>Qty: {item.quantity}</p>
                </div>
                <span style={{ fontSize: '14px', fontWeight: 600, color: mobileDesign.colors.textPrimary, alignSelf: 'center' }}>{formatINR(item.price * item.quantity)}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: mobileDesign.colors.textSecondary, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Delivery Address</h3>
        <Card variant="outlined" padding="md">
          <div style={{ display: 'flex', gap: '12px' }}>
            <Package style={{ width: 20, height: 20, color: mobileDesign.colors.accent, flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
            <div>
              <p style={{ margin: 0, fontSize: '13px', color: mobileDesign.colors.textSecondary, lineHeight: 1.5 }}>{order.address}</p>
            </div>
          </div>
        </Card>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: mobileDesign.colors.textSecondary, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Payment</h3>
        <Card variant="outlined" padding="md">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: mobileDesign.colors.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: mobileDesign.colors.accent }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 20, height: 20 }} aria-hidden="true"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: mobileDesign.colors.textPrimary }}>{order.paymentMethod}</p>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: mobileDesign.colors.textTertiary }}>Paid • {formatINR(order.total)}</p>
            </div>
          </div>
        </Card>
      </div>

      {order.trackingNumber && (
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: mobileDesign.colors.textSecondary, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Tracking</h3>
          <Card variant="outlined" padding="md">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: mobileDesign.colors.textSecondary }}>Tracking Number</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: mobileDesign.colors.textPrimary, fontFamily: mobileDesign.typography.fontFamily }}>{order.trackingNumber}</span>
              </div>
              {order.estimatedDelivery && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: mobileDesign.colors.textSecondary }}>Estimated Delivery</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: mobileDesign.colors.textPrimary }}>{format(new Date(order.estimatedDelivery), 'MMM d, yyyy')}</span>
                </div>
              )}
              <HapticButton variant="primary" fullWidth size="sm" onClick={onClose}>
                <Truck style={{ width: 14, height: 14, marginRight: 4 }} aria-hidden="true" />
                Track Shipment
              </HapticButton>
            </div>
          </Card>
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px' }}>
        <HapticButton variant="outline" fullWidth onClick={onClose} style={{ flex: 1 }}>
          Close
        </HapticButton>
        {order.status === 'delivered' && (
          <HapticButton variant="primary" fullWidth onClick={onClose} style={{ flex: 1 }}>
            <RotateCcw style={{ width: 16, height: 16, marginRight: 4 }} aria-hidden="true" />
            Buy Again
          </HapticButton>
        )}
      </div>
    </div>
  );
}

function WishlistTab() {
  const wishlistItems = [
    { id: '1', name: 'iPhone 15 Pro Max', brand: 'Apple', price: 159900, originalPrice: 169900, image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&q=80', rating: 4.8, reviewCount: 2341 },
    { id: '2', name: 'Galaxy S24 Ultra', brand: 'Samsung', price: 139999, originalPrice: 149999, image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&q=80', rating: 4.7, reviewCount: 1876 },
    { id: '3', name: 'MacBook Air M3', brand: 'Apple', price: 114900, originalPrice: 124900, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80', rating: 4.9, reviewCount: 3421 },
  ];

  return (
    <div>
      {wishlistItems.length === 0 ? (
        <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: mobileDesign.colors.borderLight, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Heart style={{ width: 48, height: 48, color: mobileDesign.colors.textTertiary }} aria-hidden="true" />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: mobileDesign.colors.textPrimary, marginBottom: '8px' }}>Your wishlist is empty</h2>
          <p style={{ fontSize: '15px', color: mobileDesign.colors.textSecondary, marginBottom: '24px', maxWidth: '280px' }}>Save items you love and we'll notify you when they're on sale.</p>
          <HapticButton variant="primary" size="lg" onClick={() => window.location.href = '/mobile'} style={{ minWidth: '200px' }}>
            Start Shopping
          </HapticButton>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {wishlistItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              style={{ display: 'flex', gap: '12px', padding: '12px', background: mobileDesign.colors.surface, borderRadius: `${mobileDesign.borderRadius.lg}px`, boxShadow: mobileDesign.shadows.sm, border: `1px solid ${mobileDesign.colors.borderLight}` }}
            >
              <div style={{ width: '80px', height: '80px', borderRadius: '8px', background: mobileDesign.colors.borderLight, flexShrink: 0, overflow: 'hidden' }}>
                <MobileImage src={item.image} alt="" sizes="72px" />
              </div>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: 500, color: mobileDesign.colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.brand}</p>
                  <h4 style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 600, color: mobileDesign.colors.textPrimary, lineHeight: 1.3 }}>{item.name}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}>
                    <Star className="fill-current" style={{ width: 14, height: 14, color: '#FBBF24' }} aria-hidden="true" />
                    <span style={{ fontSize: '12px', fontWeight: 500, color: mobileDesign.colors.textSecondary }}>{item.rating.toFixed(1)}</span>
                    <span style={{ fontSize: '12px', color: mobileDesign.colors.textTertiary }}>({item.reviewCount})</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: mobileDesign.colors.textPrimary }}>{formatINR(item.price)}</span>
                    {item.originalPrice > item.price && <span style={{ fontSize: '12px', color: mobileDesign.colors.textTertiary, textDecoration: 'line-through' }}>{formatINR(item.originalPrice)}</span>}
                  </div>
                  <HapticButton variant="primary" size="sm" onClick={() => {}}>Add to Cart</HapticButton>
                </div>
              </div>
              <button style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: '8px', background: mobileDesign.colors.errorLight, color: mobileDesign.colors.error, cursor: 'pointer' }} aria-label="Remove from wishlist">
                <X style={{ width: 18, height: 18 }} />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddressesTab() {
  const addresses = [
    { id: '1', name: 'Rahul Sharma', phone: '98765 43210', line1: '123 MG Road, Apartment 4B', line2: 'Near Metro Station', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', isDefault: true, type: 'home' },
    { id: '2', name: 'Rahul Sharma', phone: '98765 43210', line1: 'Cyber City, Tower A, Floor 12', line2: 'DLF Phase 2', city: 'Gurugram', state: 'Haryana', pincode: '122002', isDefault: false, type: 'work' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {addresses.map(addr => (
        <Card key={addr.id} variant="outlined" padding="lg">
          <div style={{ display: 'flex', gap: '12px' }}>
            <div
              style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: addr.type === 'home' ? mobileDesign.colors.accentLight : mobileDesign.colors.plasmaLight,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: addr.type === 'home' ? mobileDesign.colors.accent : mobileDesign.colors.plasma,
              }}
            >
              {addr.type === 'home' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 22, height: 22 }} aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 22, height: 22 }} aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: mobileDesign.colors.textPrimary }}>{addr.name}</span>
                {addr.isDefault && <Badge variant="accent" size="sm">Default</Badge>}
                <span style={{ fontSize: '11px', fontWeight: 600, color: mobileDesign.colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, background: mobileDesign.colors.borderLight, padding: '2px 8px', borderRadius: `${mobileDesign.borderRadius.full}px` }}>{addr.type}</span>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: mobileDesign.colors.textSecondary }}>{addr.phone}</p>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: mobileDesign.colors.textSecondary, lineHeight: 1.5 }}>
                {addr.line1}{addr.line2 && `, ${addr.line2}`}, {addr.city}, {addr.state} - {addr.pincode}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <HapticButton variant="outline" size="sm" onClick={() => {}} style={{ minWidth: 'auto', textAlign: 'center' }}>Edit</HapticButton>
              {!addr.isDefault && <HapticButton variant="outline" size="sm" onClick={() => {}} style={{ minWidth: 'auto', textAlign: 'center', color: mobileDesign.colors.error, borderColor: mobileDesign.colors.error }}>Remove</HapticButton>}
            </div>
          </div>
        </Card>
      ))}
      <HapticButton variant="outline" fullWidth onClick={() => {}} style={{ marginTop: '8px' }}>
        + Add New Address
      </HapticButton>
    </div>
  );
}

function SettingsTab() {
  const settings: Array<{
    section: string;
    items: Array<{ title: string; subtitle: string; icon: string; destructive?: boolean }>;
  }> = [
    { section: 'Account', items: [
      { title: 'Profile Information', subtitle: 'Name, email, phone number', icon: 'User' },
      { title: 'Change Password', subtitle: 'Update your password', icon: 'Lock' },
      { title: 'Two-Factor Authentication', subtitle: 'Add extra security', icon: 'Shield' },
    ]},
    { section: 'Preferences', items: [
      { title: 'Notifications', subtitle: 'Email, SMS, push notifications', icon: 'Bell' },
      { title: 'Language & Region', subtitle: 'English (India) / INR', icon: 'Globe' },
      { title: 'Theme', subtitle: 'System / Light / Dark', icon: 'Sun' },
    ]},
    { section: 'Support', items: [
      { title: 'Help Center', subtitle: 'FAQs and guides', icon: 'HelpCircle' },
      { title: 'Contact Us', subtitle: 'Chat, email, or call support', icon: 'MessageCircle' },
      { title: 'Terms & Privacy', subtitle: 'Legal policies', icon: 'FileText' },
    ]},
    { section: 'Danger Zone', items: [
      { title: 'Delete Account', subtitle: 'Permanently delete your account', icon: 'Trash2', destructive: true },
    ]},
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {settings.map(section => (
        <div key={section.section}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: mobileDesign.colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: '12px' }}>{section.section}</h3>
          <Card variant="outlined" padding="none">
            {section.items.map((item, i) => (
              <motion.button
                key={item.title}
                whileTap={{ scale: 0.99 }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '16px', border: 'none', background: 'transparent',
                  color: item.destructive ? mobileDesign.colors.error : mobileDesign.colors.textPrimary,
                  fontSize: '15px', fontWeight: 500, fontFamily: mobileDesign.typography.fontFamily,
                  textAlign: 'left', cursor: 'pointer',
                  borderTop: i > 0 ? `1px solid ${mobileDesign.colors.borderLight}` : 'none',
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: mobileDesign.colors.borderLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.destructive ? mobileDesign.colors.error : mobileDesign.colors.textSecondary, flexShrink: 0 }}>
                  {item.icon === 'User' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 20, height: 20 }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                  {item.icon === 'Lock' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 20, height: 20 }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
                  {item.icon === 'Shield' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 20, height: 20 }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
                  {item.icon === 'Bell' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 20, height: 20 }}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>}
                  {item.icon === 'Globe' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 20, height: 20 }}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>}
                  {item.icon === 'Sun' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 20, height: 20 }}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>}
                  {item.icon === 'HelpCircle' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 20, height: 20 }}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
                  {item.icon === 'MessageCircle' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 20, height: 20 }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
                  {item.icon === 'FileText' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 20, height: 20 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>}
                  {item.icon === 'Trash2' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 20, height: 20 }}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '15px', fontWeight: 500, color: item.destructive ? mobileDesign.colors.error : mobileDesign.colors.textPrimary }}>{item.title}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '13px', color: mobileDesign.colors.textSecondary }}>{item.subtitle}</p>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 20, height: 20, color: mobileDesign.colors.textTertiary }}><path d="M9 18l6-6-6-6"/></svg>
              </motion.button>
            ))}
          </Card>
        </div>
      ))}
    </div>
  );
}