'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Smartphone, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Panel, PanelBody, PanelHeader, PanelFooter } from '@/components/ui/panel';
import { api } from '@/lib/client';

export default function ForgotPasswordPage() {
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (method === 'email') {
      if (!identifier.includes('@')) { setError('Enter a valid email address.'); return; }
    } else {
      if (!/^\d{10}$/.test(identifier.replace(/\D/g, ''))) { setError('Enter a valid 10-digit phone number.'); return; }
    }

    setLoading(true);
    try {
      const res = await api<{ devToken?: string }>('/api/auth/password/forgot', { json: { identifier, channel: method } });
      if (!res.ok) { setError(res.error); setLoading(false); return; }
      if (res.data?.devToken) setDevToken(res.data.devToken);
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <Link href="/" className="inline-flex items-center gap-2 mb-8 text-ink-2 hover:text-ink" aria-label="Voltage home">
        <svg viewBox="0 0 32 32" className="size-8" fill="none" aria-hidden="true">
          <rect x="4" y="4" width="24" height="24" rx="6" fill="url(#forgotGrad)" stroke="#22d3ee" strokeWidth="1.5" />
          <defs>
            <linearGradient id="forgotGrad" x1="0" y1="0" x2="32" y2="32">
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
          title={sent ? 'Check your inbox' : 'Reset your password'}
          description={sent
            ? `We've sent a reset link to ${identifier}. It expires in 30 minutes.`
            : "Enter your email or phone and we'll send you a secure reset link."}
        />
        <PanelBody className="space-y-4">
          {devToken && (
            <div className="flex items-center gap-2 rounded-lg bg-volt-400/10 p-3 ring-1 ring-inset ring-volt-400/20 text-sm text-volt-300">
              <CheckCircle className="size-4 shrink-0" aria-hidden />
              <span className="font-mono truncate">Dev link: /reset-password?token={devToken}</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-bad-500/10 p-3 ring-1 ring-inset ring-bad-500/20 text-sm text-bad-400">
              <AlertCircle className="size-4 shrink-0" aria-hidden />
              {error}
            </div>
          )}

          {!sent && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-2" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={method === 'email'}
                  onClick={() => setMethod('email')}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    method === 'email'
                      ? 'bg-volt-400/10 text-volt-300 ring-1 ring-inset ring-volt-400/30'
                      : 'text-ink-3 hover:text-ink hover:bg-panel-2'
                  }`}
                >
                  <Mail className="size-3.5 mr-1.5 inline" aria-hidden />
                  Email
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={method === 'phone'}
                  onClick={() => setMethod('phone')}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    method === 'phone'
                      ? 'bg-volt-400/10 text-volt-300 ring-1 ring-inset ring-volt-400/30'
                      : 'text-ink-3 hover:text-ink hover:bg-panel-2'
                  }`}
                >
                  <Smartphone className="size-3.5 mr-1.5 inline" aria-hidden />
                  Phone
                </button>
              </div>

              {/* Input with prefix icon */}
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-ink-3">
                  {method === 'email' ? <Mail className="size-4" /> : <Smartphone className="size-4" />}
                </span>
                <Input
                  label={method === 'email' ? 'Email address' : 'Phone number'}
                  type={method === 'email' ? 'email' : 'tel'}
                  placeholder={method === 'email' ? 'you@example.com' : '9876543210'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  className="pl-9"
                  autoComplete={method === 'email' ? 'email' : 'tel'}
                />
              </div>

              <Button type="submit" fullWidth loading={loading} size="lg">
                Send reset link
              </Button>
            </form>
          )}
        </PanelBody>
        <PanelFooter>
          <p className="text-center text-sm text-ink-3">
            {sent ? (
              <>Back to <Link href="/login" className="font-medium text-volt-300 hover:text-volt-200 underline underline-offset-2">sign in</Link></>
            ) : (
              <>Remember your password? <Link href="/login" className="font-medium text-volt-300 hover:text-volt-200 underline underline-offset-2">Sign in</Link></>
            )}
          </p>
        </PanelFooter>
      </Panel>
    </div>
  );
}