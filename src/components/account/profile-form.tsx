'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BadgeCheck, Save, ShieldAlert } from 'lucide-react';
import { api } from '@/lib/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/misc';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils';

export type ProfileFormValues = {
  name: string | null;
  email: string | null;
  phone: string | null;
  photoUrl: string | null;
  /** ISO strings — Date objects would force this island to re-serialise them. */
  emailVerifiedAt: string | null;
  phoneVerifiedAt: string | null;
};

type Fields = Record<string, string>;

/** Stored numbers carry the +91 the field already prints as a prefix. */
function localDigits(phone: string | null): string {
  return (phone ?? '').replace(/^\+91/, '');
}

export function ProfileForm({ initial }: { initial: ProfileFormValues }) {
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = useState(initial.name ?? '');
  const [email, setEmail] = useState(initial.email ?? '');
  const [phone, setPhone] = useState(localDigits(initial.phone));
  const [photoUrl, setPhotoUrl] = useState(initial.photoUrl ?? '');
  const [errors, setErrors] = useState<Fields>({});
  const [saving, setSaving] = useState(false);

  // Phone OTP is a two-step affair: request, then enter the code we sent.
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpBusy, setOtpBusy] = useState(false);

  const dirty =
    name !== (initial.name ?? '') ||
    email !== (initial.email ?? '') ||
    phone !== localDigits(initial.phone) ||
    photoUrl !== (initial.photoUrl ?? '');

  const phoneChanged = phone !== localDigits(initial.phone);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setErrors({});

    const res = await api<{ id: string }>('/api/account/profile', {
      method: 'PATCH',
      json: { name, email, phone, photoUrl },
    });

    setSaving(false);
    if (!res.ok) {
      setErrors(res.fields ?? {});
      toast.error('Could not save your profile', res.error);
      return;
    }

    toast.success('Profile updated');
    setOtpSent(false);
    setOtpCode('');
    router.refresh();
  }

  async function requestOtp() {
    if (!initial.phone) {
      toast.info('Add your mobile number first', 'Save the number, then verify it.');
      return;
    }
    setOtpBusy(true);
    const res = await api<{ expiresAt: string }>('/api/auth/otp/request', {
      method: 'POST',
      // Both spellings of the identifier — the auth route is owned elsewhere and
      // extra keys are ignored by its schema.
      json: {
        identifier: initial.phone,
        phone: initial.phone,
        channel: 'sms',
        purpose: 'verify_phone',
      },
    });
    setOtpBusy(false);

    if (!res.ok) {
      toast.error('Could not send the code', res.error);
      return;
    }
    setOtpSent(true);
    toast.success('Code sent', `A 6-digit code is on its way to ${initial.phone}.`);
  }

  async function confirmOtp() {
    if (!initial.phone || otpCode.trim().length < 6) return;
    setOtpBusy(true);
    const res = await api('/api/auth/otp/verify', {
      method: 'POST',
      json: {
        identifier: initial.phone,
        phone: initial.phone,
        code: otpCode.trim(),
        purpose: 'verify_phone',
      },
    });
    setOtpBusy(false);

    if (!res.ok) {
      toast.error('That code did not work', res.error);
      return;
    }
    setOtpSent(false);
    setOtpCode('');
    toast.success('Mobile number verified');
    router.refresh();
  }

  return (
    <form onSubmit={save} className="space-y-5" noValidate>
      <div className="flex items-center gap-4">
        <Avatar name={name || 'VOLTAGE'} src={photoUrl || null} size="lg" />
        <div className="min-w-0 text-xs text-ink-3">
          <p className="text-sm font-medium text-ink">Profile photo</p>
          <p className="mt-0.5">
            Paste a link to an image you already host. VOLTAGE does not store uploads.
          </p>
        </div>
      </div>

      <Input
        label="Full name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Aarav Sharma"
        autoComplete="name"
        error={errors.name}
        hint="Printed on your GST invoices and warranty cards."
      />

      <Input
        label="Email"
        type="email"
        inputMode="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        autoComplete="email"
        error={errors.email}
        hint="Invoices, dispatch alerts and password resets go here."
      />
      <div className="-mt-3 flex items-center gap-2">
        {initial.emailVerifiedAt ? (
          <Badge tone="emerald" size="xs">
            <BadgeCheck className="size-3" aria-hidden />
            Email verified {formatDate(initial.emailVerifiedAt)}
          </Badge>
        ) : (
          <Badge tone="slate" size="xs">
            Email not verified
          </Badge>
        )}
      </div>

      <Input
        label="Mobile number"
        type="tel"
        inputMode="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value.replace(/[^\d\s]/g, '').slice(0, 12))}
        placeholder="98765 43210"
        autoComplete="tel"
        prefix="+91"
        className="pl-12"
        error={errors.phone}
        hint="Delivery agents and OTPs use this number. 10 digits, Indian mobile."
      />
      <div className="-mt-3 flex flex-wrap items-center gap-2">
        {initial.phoneVerifiedAt && !phoneChanged ? (
          <Badge tone="emerald" size="xs">
            <BadgeCheck className="size-3" aria-hidden />
            Mobile verified {formatDate(initial.phoneVerifiedAt)}
          </Badge>
        ) : (
          <>
            <Badge tone="amber" size="xs">
              <ShieldAlert className="size-3" aria-hidden />
              Mobile not verified
            </Badge>
            {initial.phone && !phoneChanged && (
              <Button
                type="button"
                variant="link"
                size="xs"
                loading={otpBusy && !otpSent}
                onClick={requestOtp}
              >
                Verify now
              </Button>
            )}
            {phoneChanged && (
              <span className="text-xs text-ink-4">Save the new number, then verify it.</span>
            )}
          </>
        )}
      </div>

      {otpSent && (
        <div className="rounded-xl bg-panel-2 p-4 ring-1 ring-line-2 ring-inset">
          <Field
            label={`Enter the code sent to ${initial.phone}`}
            hint="The code expires in 10 minutes."
          >
            <div className="flex gap-2">
              <Input
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="123456"
                aria-label="Verification code"
                className="tabular tracking-[0.4em]"
                wrapClassName="flex-1"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={confirmOtp}
                loading={otpBusy}
                disabled={otpCode.length < 6}
              >
                Confirm
              </Button>
            </div>
          </Field>
        </div>
      )}

      <Input
        label="Photo URL"
        type="url"
        value={photoUrl}
        onChange={(e) => setPhotoUrl(e.target.value)}
        placeholder="https://…"
        error={errors.photoUrl}
        hint="Leave blank to fall back to your initials."
      />

      {errors.form && <p className="text-xs text-bad-400">{errors.form}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={saving} disabled={!dirty}>
          <Save className="size-4" aria-hidden />
          Save changes
        </Button>
        {dirty && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setName(initial.name ?? '');
              setEmail(initial.email ?? '');
              setPhone(localDigits(initial.phone));
              setPhotoUrl(initial.photoUrl ?? '');
              setErrors({});
            }}
          >
            Discard
          </Button>
        )}
      </div>
    </form>
  );
}
