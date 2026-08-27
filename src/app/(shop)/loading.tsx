'use client';

import { LottieAnimation } from '@/components/ui/lottie';

export default function ShopLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <LottieAnimation type="loading" size={160} />
    </div>
  );
}
