'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, PasswordInput } from '@/components/ui/input';
import { Panel, PanelBody, PanelHeader, PanelFooter } from '@/components/ui/panel';
import { api } from '@/lib/client';
import { passwordIssues } from '@/lib/client-auth';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [valid, setValid] = useState(true);
  const [tokenChecked, setTokenChecked] = useState(false);

  const issues = passwordIssues(password);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token.');
      setValid(false);
    }
    setTokenChecked(true);
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) { setError('Missing reset token.'); return; }
    if (issues.length) { setError(issues.join(', ')); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      const res = await api('/api/auth/password/reset', { json: { token, password } });
      if (!res.ok) { setError(res.error); setLoading(false); return; }
      router.push('/login?reset=success');
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  }

  if (!tokenChecked) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
        <Panel>
          <PanelBody className="flex items-center justify-center py-12">
            <div className="animate-spin size-8 border-2 border-volt-400 border-t-transparent rounded-full" aria-label="Verifying token" />
          </PanelBody>
        </Panel>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
        <Panel>
          <PanelHeader title="Invalid reset link" description="This link has expired or has already been used." />
          <PanelBody>
            <p className="text-center text-ink-2">Request a new reset link to continue.</p>
          </PanelBody>
          <PanelFooter>
            <Link href="/forgot-password">
              <Button fullWidth>Request new link</Button>
            </Link>
          </PanelFooter>
        </Panel>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <Link href="/" className="inline-flex items-center gap-2 mb-8 text-ink-2 hover:text-ink" aria-label="Voltage home">
        <svg viewBox="0 0 32 32" className="size-8" fill="none" aria-hidden="true">
          <rect x="4" y="4" width="24" height="24" rx="6" fill="url(#resetGrad)" stroke="#22d3ee" strokeWidth="1.5" />
          <defs>
            <linearGradient id="resetGrad" x1="0" y1="0" x2="32" y2="32">
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
          title="Set new password"
          description="Your new password must be different from previous ones."
        />
        <PanelBody className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-bad-500/10 p-3 ring-1 ring-inset ring-bad-500/20 text-sm text-bad-400">
              <AlertCircle className="size-4 shrink-0" aria-hidden />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <PasswordInput
              label="New password"
              placeholder="At least 8 characters with a letter and number"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              hint={issues.length ? issues.join(' · ') : 'Min 8 chars, 1 letter, 1 number'}
            />

            <PasswordInput
              label="Confirm new password"
              placeholder="Re-enter your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <Button type="submit" fullWidth loading={loading} size="lg">
              Update password
            </Button>
          </form>
        </PanelBody>
        <PanelFooter>
          <p className="text-center text-sm text-ink-3">
            <Link href="/login" className="font-medium text-volt-300 hover:text-volt-200 underline underline-offset-2">
              Back to sign in
            </Link>
          </p>
        </PanelFooter>
      </Panel>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-12 sm:py-16" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}