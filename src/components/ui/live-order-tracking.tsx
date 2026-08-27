'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Truck, MapPin, CheckCircle2, Clock } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface OrderStep {
  id: string;
  label: string;
  status: 'completed' | 'current' | 'upcoming';
  timestamp?: string;
  icon: typeof Package;
}

interface LiveOrderTrackingProps {
  orderId: string;
  estimatedDelivery?: string;
}

export function LiveOrderTracking({ orderId, estimatedDelivery }: LiveOrderTrackingProps) {
  const [steps] = useState<OrderStep[]>([
    { id: '1', label: 'Order Placed', status: 'completed', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), icon: Package },
    { id: '2', label: 'Processing', status: 'completed', timestamp: new Date(Date.now() - 86400000 * 1).toISOString(), icon: Package },
    { id: '3', label: 'Shipped', status: 'completed', timestamp: new Date(Date.now() - 3600000 * 6).toISOString(), icon: Truck },
    { id: '4', label: 'Out for Delivery', status: 'current', timestamp: new Date().toISOString(), icon: MapPin },
    { id: '5', label: 'Delivered', status: 'upcoming', icon: CheckCircle2 },
  ]);

  const completedSteps = steps.filter((s) => s.status === 'completed').length;
  const progress = (completedSteps / (steps.length - 1)) * 100;

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="relative">
        <div className="h-1.5 bg-line/30 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-volt-500 to-volt-300 rounded-full"
          />
        </div>
        {/* Animated truck */}
        <motion.div
          initial={{ left: '0%' }}
          animate={{ left: `${progress}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="absolute -top-3"
          style={{ transform: 'translateX(-50%)' }}
        >
          <motion.div
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="size-6 rounded-full bg-volt-500 flex items-center justify-center shadow-lg shadow-volt-500/30"
          >
            <Truck className="size-3 text-void" />
          </motion.div>
        </motion.div>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-4"
            >
              <div className="flex flex-col items-center">
                <div
                  className={`size-10 rounded-full flex items-center justify-center ${
                    step.status === 'completed'
                      ? 'bg-volt-500/15 text-volt-400'
                      : step.status === 'current'
                      ? 'bg-volt-500 text-void ring-4 ring-volt-500/20'
                      : 'bg-panel-2 text-ink-4'
                  }`}
                >
                  <Icon className="size-4" />
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-0.5 h-8 mt-1 ${
                      step.status === 'completed' ? 'bg-volt-500/30' : 'bg-line/30'
                    }`}
                  />
                )}
              </div>
              <div className="flex-1 pt-1.5">
                <p
                  className={`text-sm font-medium ${
                    step.status === 'current' ? 'text-ink' : step.status === 'completed' ? 'text-ink-2' : 'text-ink-4'
                  }`}
                >
                  {step.label}
                </p>
                {step.timestamp && (
                  <p className="text-[11px] text-ink-4 mt-0.5 flex items-center gap-1">
                    <Clock className="size-3" />
                    {formatDateTime(step.timestamp)}
                  </p>
                )}
                {step.status === 'current' && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-volt-300 mt-1 font-medium"
                  >
                    Live tracking active — next update in 30 min
                  </motion.p>
                )}
              </div>
              {step.status === 'current' && (
                <motion.span
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="px-2 py-1 rounded-full bg-volt-500/15 text-volt-300 text-[10px] font-semibold uppercase mt-1"
                >
                  Live
                </motion.span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Estimated delivery */}
      {estimatedDelivery && (
        <div className="rounded-xl border border-volt-500/20 bg-volt-500/5 p-4">
          <p className="text-xs text-ink-3">Estimated Delivery</p>
          <p className="text-sm font-semibold text-ink mt-0.5">{estimatedDelivery}</p>
        </div>
      )}
    </div>
  );
}
