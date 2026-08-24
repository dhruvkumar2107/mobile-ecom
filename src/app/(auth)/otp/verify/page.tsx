'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle, CheckCircle, Smartphone, Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Panel, PanelBody, PanelHeader, PanelFooter } from '@/components/ui/panel';
import { api } from '@/lib/client';

function OtpVerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contact = searchParams.get('contact') ?? '';
  const purpose = searchParams.get('purpose') ?? 'login';
  const next = searchParams.get('next') ?? '/account';

  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setResendCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\d{6}$/.test(otp)) { setError('Enter the 6-digit code.'); return; }
    setLoading(true);
    try {
      const res = await api('/api/auth/otp/verify', { json: { identifier: contact, purpose, code: otp } });
      if (!res.ok) { setError(res.error); setLoading(false); return; }
      router.push(next);
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  async function resend() {
    setError(null);
    setLoading(true);
    try {
      const res = await api<{ devCode?: string }>('/api/auth/otp/request', { json: { identifier: contact, purpose } });
      if (!res.ok) { setError(res.error); setLoading(false); return; }
      if (res.data?.devCode) setDevCode(res.data.devCode);
      setResendCooldown(60);
    } catch {
      setError('Could not resend. Please try again.');
    }
    setLoading(false);
  }

  const isPhone = /^\d{10}$/.test(contact.replace(/\D/g, ''));
  const masked = isPhone
    ? contact.replace(/\d(?=\d{4})/g, '•')
    : contact.replace(/(.{2})(.*)(@.*)/, '$1***$3');

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <Link href="/" className="inline-flex items-center gap-2 mb-8 text-ink-2 hover:text-ink" aria-label="Voltage home">
        <svg viewBox="0 0 32 32" className="size-8" fill="none" aria-hidden="true">
          <rect x="4" y="4" width="24" height="24" rx="6" fill="url(#otpGrad)" stroke="#22d3ee" strokeWidth="1.5" />
          <defs>
            <linearGradient id="otpGrad" x1="0" y1="0" x2="32" y2="32">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <path d="M10 16l6 6 10-10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
        <span className="text-xl font-semibold tracking-tight">VOLTAGE</span>
      </Link>

      <Panel>
        <PanelHeader
          title="Enter the code"
          description={`We sent a 6-digit code to ${isPhone ? <Smartphone className="size-3.5 inline" /> : <Mail className="size-3.5 inline" />} {masked}.`}
        />
        <PanelBody className="space-y-4">
          {devCode && (
            <div className="flex items-center gap-2 rounded-lg bg-volt-400/10 p-3 ring-1 ring-inset ring-volt-400/20 text-sm text-volt-300">
              <CheckCircle className="size-4 shrink-0" aria-hidden />
              <span className="font-mono">Dev OTP: {devCode}</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-bad-500/10 p-3 ring-1 ring-inset ring-bad-500/20 text-sm text-bad-400">
              <AlertCircle className="size-4 shrink-0" aria-hidden />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="6-digit code"
              type="tel"
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />

            <Button type="submit" fullWidth loading={loading} size="lg">
              Verify & continue
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={resend}
              disabled={loading || resendCooldown > 0}
              className="text-sm text-ink-3 underline underline-offset-2 hover:text-ink transition-colors disabled:opacity-50"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Didn't receive it? Resend code"}
            </button>
          </div>
        </PanelBody>
        <PanelFooter>
          <Link href={purpose === 'login' ? '/login' : '/signup'} className="text-sm text-ink-3 hover:text-ink flex items-center justify-center gap-1.5">
            <ArrowLeft className="size-3.5" aria-hidden />
            Back to {purpose === 'login' ? 'sign in' : 'sign up'}
          </Link>
        </PanelFooter>
      </Panel>
    </div>
  );
}

export default function OtpVerifyPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-12 sm:py-16" />}>
      <OtpVerifyContent />
    </Suspense>
  );
}