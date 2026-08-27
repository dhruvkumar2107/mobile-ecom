'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Smartphone, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, PasswordInput } from '@/components/ui/input';
import { Panel, PanelBody, PanelHeader, PanelFooter } from '@/components/ui/panel';
import { BiometricLogin } from '@/components/ui/biometric-login';
import { api } from '@/lib/client';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/account';

  const [method, setMethod] = useState<'password' | 'otp'>('password');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (method === 'password') {
        if (!identifier.includes('@') && !/^\d{10}$/.test(identifier.replace(/\D/g, ''))) {
          setError('Enter your email or 10-digit phone number.');
          setLoading(false);
          return;
        }
        const res = await api('/api/auth/login', { json: { identifier, password } });
        if (!res.ok) { setError(res.error); setLoading(false); return; }
      } else {
        if (!/^\d{10}$/.test(identifier.replace(/\D/g, ''))) {
          setError('Enter a 10-digit phone number for OTP login.');
          setLoading(false);
          return;
        }
        const res = await api('/api/auth/otp/request', { json: { identifier, purpose: 'login' } });
        if (!res.ok) { setError(res.error); setLoading(false); return; }
        router.push(`/auth/otp/verify?contact=${encodeURIComponent(identifier)}&purpose=login&next=${encodeURIComponent(next)}`);
        return;
      }
      router.push(next);
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <Link href="/" className="inline-flex items-center gap-2 mb-8 text-ink-2 hover:text-ink" aria-label="Voltage home">
        <svg viewBox="0 0 32 32" className="size-8" fill="none" aria-hidden="true">
          <rect x="4" y="4" width="24" height="24" rx="6" fill="url(#loginGrad)" stroke="#22d3ee" strokeWidth="1.5" />
          <defs>
            <linearGradient id="loginGrad" x1="0" y1="0" x2="32" y2="32">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <path d="M10 16l6 6 10-10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
        <span className="text-xl font-semibold tracking-tight">VOLTAGE</span>
      </Link>

      <Panel>
        <PanelHeader title="Welcome back" description="Sign in to access your account, orders and wallet." />
        <PanelBody className="space-y-4">
          <div className="flex gap-2" role="tablist">
            <button
              role="tab"
              aria-selected={method === 'password'}
              onClick={() => setMethod('password')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                method === 'password'
                  ? 'bg-volt-400/10 text-volt-300 ring-1 ring-inset ring-volt-400/30'
                  : 'text-ink-3 hover:text-ink hover:bg-panel-2'
              }`}
            >
              <Lock className="size-3.5 mr-1.5 inline" aria-hidden />
              Password
            </button>
            <button
              role="tab"
              aria-selected={method === 'otp'}
              onClick={() => setMethod('otp')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                method === 'otp'
                  ? 'bg-volt-400/10 text-volt-300 ring-1 ring-inset ring-volt-400/30'
                  : 'text-ink-3 hover:text-ink hover:bg-panel-2'
              }`}
            >
              <Smartphone className="size-3.5 mr-1.5 inline" aria-hidden />
              OTP
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-bad-500/10 p-3 ring-1 ring-inset ring-bad-500/20 text-sm text-bad-400">
              <AlertCircle className="size-4 shrink-0" aria-hidden />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-ink-3">
                {method === 'password' ? <Mail className="size-4" /> : <Smartphone className="size-4" />}
              </span>
              <Input
                label="Email or phone"
                type={method === 'password' ? 'text' : 'tel'}
                autoComplete={method === 'password' ? 'username' : 'tel'}
                placeholder="you@example.com or 9876543210"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="pl-9"
              />
            </div>

            {method === 'password' && (
              <PasswordInput
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            )}

            <Button type="submit" fullWidth loading={loading} size="lg">
              {method === 'password' ? 'Sign in' : 'Send OTP'}
            </Button>
          </form>

          {method === 'password' && (
            <div className="text-center">
              <Link href="/forgot-password" className="text-sm text-volt-300 underline underline-offset-2 hover:text-volt-200">
                Forgot password?
              </Link>
            </div>
          )}

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-line" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-panel-1 px-2 text-ink-4">or continue with</span>
            </div>
          </div>

          <BiometricLogin onSuccess={() => router.push(next)} />
        </PanelBody>
        <PanelFooter>
          <p className="text-center text-sm text-ink-3">
            New to VOLTAGE?{' '}
            <Link href="/signup" className="font-medium text-volt-300 hover:text-volt-200 underline underline-offset-2">
              Create an account
            </Link>
          </p>
        </PanelFooter>
      </Panel>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-12 sm:py-16" />}>
      <LoginContent />
    </Suspense>
  );
}