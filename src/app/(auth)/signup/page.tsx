'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Smartphone, Lock, User, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, PasswordInput } from '@/components/ui/input';
import { Panel, PanelBody, PanelHeader, PanelFooter } from '@/components/ui/panel';
import { api } from '@/lib/client';
import { passwordIssues } from '@/lib/client-auth';

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/account';
  const ref = searchParams.get('ref') ?? '';

  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const issues = passwordIssues(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) { setError('Enter your name.'); return; }
    if (!email && !phone) { setError('Enter your email or phone number.'); return; }
    if (email && !email.includes('@')) { setError('Enter a valid email address.'); return; }
    if (phone && !/^\d{10}$/.test(phone.replace(/\D/g, ''))) { setError('Enter a valid 10-digit phone number.'); return; }
    if (issues.length) { setError(issues.join(', ')); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      const res = await api<{ devCode?: string }>('/api/auth/signup', {
        json: { name: name.trim(), email: email || null, phone: phone || null, password, referralCode: ref || null },
      });
      if (!res.ok) { setError(res.error); setLoading(false); return; }
      if (res.data?.devCode) setDevOtp(res.data.devCode);
      setStep('otp');
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\d{6}$/.test(otp)) { setError('Enter the 6-digit code.'); return; }
    setLoading(true);
    try {
      const identifier = email || phone;
      const res = await api('/api/auth/otp/verify', { json: { identifier, purpose: 'signup', code: otp } });
      if (!res.ok) { setError(res.error); setLoading(false); return; }
      router.push(next);
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  }

  async function resendOtp() {
    setError(null);
    setLoading(true);
    try {
      const identifier = email || phone;
      const res = await api<{ devCode?: string }>('/api/auth/otp/request', { json: { identifier, purpose: 'signup' } });
      if (!res.ok) { setError(res.error); setLoading(false); return; }
      if (res.data?.devCode) setDevOtp(res.data.devCode);
    } catch {
      setError('Could not resend. Please try again.');
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <Link href="/" className="inline-flex items-center gap-2 mb-8 text-ink-2 hover:text-ink" aria-label="Voltage home">
        <svg viewBox="0 0 32 32" className="size-8" fill="none" aria-hidden="true">
          <rect x="4" y="4" width="24" height="24" rx="6" fill="url(#signupGrad)" stroke="#22d3ee" strokeWidth="1.5" />
          <defs>
            <linearGradient id="signupGrad" x1="0" y1="0" x2="32" y2="32">
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
          title={step === 'form' ? 'Create your account' : 'Verify your contact'}
          description={step === 'form'
            ? 'Join VOLTAGE for genuine warranty, GST invoices and no-cost EMI.'
            : `We sent a 6-digit code to ${email ? email : phone}.`}
        />
        <PanelBody className="space-y-4">
          {devOtp && (
            <div className="flex items-center gap-2 rounded-lg bg-volt-400/10 p-3 ring-1 ring-inset ring-volt-400/20 text-sm text-volt-300">
              <CheckCircle className="size-4 shrink-0" aria-hidden />
              <span className="font-mono">Dev OTP: {devOtp}</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-bad-500/10 p-3 ring-1 ring-inset ring-bad-500/20 text-sm text-bad-400">
              <AlertCircle className="size-4 shrink-0" aria-hidden />
              {error}
            </div>
          )}

          {step === 'form' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-ink-3">
                  <User className="size-4" />
                </span>
                <Input
                  label="Full name"
                  placeholder="Aarav Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="pl-9"
                  autoComplete="name"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-ink-3">
                    <Mail className="size-4" />
                  </span>
                  <Input
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    autoComplete="email"
                  />
                </div>
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-ink-3">
                    <Smartphone className="size-4" />
                  </span>
                  <Input
                    label="Phone"
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-9"
                    autoComplete="tel"
                  />
                </div>
              </div>

              <PasswordInput
                label="Password"
                placeholder="At least 8 characters with a letter and number"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                hint={issues.length ? issues.join(' · ') : 'Min 8 chars, 1 letter, 1 number'}
              />

              <PasswordInput
                label="Confirm password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <Button type="submit" fullWidth loading={loading} size="lg">
                Create account
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
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

              <button
                type="button"
                onClick={resendOtp}
                disabled={loading}
                className="w-full text-sm text-ink-3 underline underline-offset-2 hover:text-ink transition-colors disabled:opacity-50"
              >
                Didn't receive it? Resend code
              </button>
            </form>
          )}
        </PanelBody>
        <PanelFooter>
          <p className="text-center text-sm text-ink-3">
            {step === 'form' ? (
              <>Already have an account?{' '}
                <Link href="/login" className="font-medium text-volt-300 hover:text-volt-200 underline underline-offset-2">
                  Sign in
                </Link>
              </>
            ) : (
              <>Back to{' '}
                <Link href="/signup" className="font-medium text-volt-300 hover:text-volt-200 underline underline-offset-2">
                  sign up
                </Link>
              </>
            )}
          </p>
        </PanelFooter>
      </Panel>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-12 sm:py-16" />}>
      <SignupContent />
    </Suspense>
  );
}