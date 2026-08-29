import 'server-only';

import { cookies } from 'next/headers';
import { cache } from 'react';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { db } from './db';
import { referralCode as makeReferralCode } from './ids';
import { hasPermission, type Permission } from './rbac';
import { parseJson } from './utils';

export const SESSION_COOKIE = 'voltage_session';
export const CART_COOKIE = 'voltage_cart';
const SESSION_DAYS = 30;

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    throw new Error('AUTH_SECRET must be set to at least 32 characters');
  }
  return new TextEncoder().encode(s);
}

// ── Passwords ─────────────────────────────────────────────────────────

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 11);
}

export async function verifyPassword(plain: string, hash: string | null): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}

export function passwordIssues(pw: string): string[] {
  const issues: string[] = [];
  if (pw.length < 8) issues.push('At least 8 characters');
  if (!/[A-Za-z]/.test(pw)) issues.push('At least one letter');
  if (!/\d/.test(pw)) issues.push('At least one number');
  return issues;
}

// ── Session tokens ────────────────────────────────────────────────────

type SessionClaims = { sub: string; jti: string; role: string };

async function signSession(claims: SessionClaims, expiresAt: Date): Promise<string> {
  return new SignJWT({ role: claims.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.sub)
    .setJti(claims.jti)
    .setIssuedAt()
    .setIssuer('voltage')
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(secret());
}

export async function readSessionToken(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { issuer: 'voltage' });
    if (!payload.sub || !payload.jti) return null;
    return { sub: payload.sub, jti: payload.jti, role: String(payload.role ?? 'customer') };
  } catch {
    return null;
  }
}

/**
 * Issues a session: persists a revocable Session row, then sets the cookie.
 * The DB row is what makes "log out everywhere" and admin-forced logout work —
 * a bare JWT can't be revoked before expiry.
 */
export async function createSession(
  userId: string,
  meta: { ip?: string | null; userAgent?: string | null; device?: string | null } = {},
): Promise<void> {
  const jti = randomBytes(16).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);

  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });

  await db.session.create({
    data: {
      userId,
      jti,
      expiresAt,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent?.slice(0, 400) ?? null,
      device: meta.device ?? null,
    },
  });
  await db.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });

  const token = await signSession({ sub: userId, jti, role: user?.role ?? 'customer' }, expiresAt);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    const claims = await readSessionToken(token);
    if (claims) {
      await db.session
        .updateMany({ where: { jti: claims.jti }, data: { revokedAt: new Date() } })
        .catch(() => undefined);
    }
  }
  jar.delete(SESSION_COOKIE);
}

export async function revokeAllSessions(userId: string): Promise<void> {
  await db.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

// ── Current user ──────────────────────────────────────────────────────

export type CurrentUser = {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  photoUrl: string | null;
  role: string;
  status: string;
  referralCode: string;
  loyaltyTier: string;
  loyaltyPoints: number;
  permissions: string[];
  staffRoleName: string | null;
  walletBalancePaise: number;
  walletPendingPaise: number;
};

/**
 * Resolves the signed-in user. `cache()` dedupes this across every server
 * component in a single render — the layout, nav and page all call it but only
 * one query runs.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const claims = await readSessionToken(token);
  if (!claims) return null;

  const session = await db.session.findUnique({
    where: { jti: claims.jti },
    select: { revokedAt: true, expiresAt: true },
  });
  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;

  const user = await db.user.findUnique({
    where: { id: claims.sub },
    select: {
      id: true,
      email: true,
      phone: true,
      name: true,
      photoUrl: true,
      role: true,
      status: true,
      referralCode: true,
      loyaltyTier: true,
      loyaltyPoints: true,
      staffRole: { select: { name: true, permissions: true } },
      wallet: { select: { balancePaise: true, pendingPaise: true } },
    },
  });
  if (!user || user.status !== 'active') return null;

  // Superadmin implicitly holds every permission even without a role row.
  const permissions =
    user.role === 'admin'
      ? ['*']
      : parseJson<string[]>(user.staffRole?.permissions, []);

  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    name: user.name,
    photoUrl: user.photoUrl,
    role: user.role,
    status: user.status,
    referralCode: user.referralCode,
    loyaltyTier: user.loyaltyTier,
    loyaltyPoints: user.loyaltyPoints,
    permissions,
    staffRoleName: user.staffRole?.name ?? null,
    walletBalancePaise: user.wallet?.balancePaise ?? 0,
    walletPendingPaise: user.wallet?.pendingPaise ?? 0,
  };
});

export class AuthError extends Error {
  constructor(
    message: string,
    readonly status: number = 401,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError('You need to sign in to continue.', 401);
  return user;
}

export async function requireStaff(permission?: Permission): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== 'admin' && user.role !== 'staff') {
    throw new AuthError('Admin access required.', 403);
  }
  if (permission && !hasPermission(user.permissions, permission)) {
    throw new AuthError(`Your role lacks the "${permission}" permission.`, 403);
  }
  return user;
}

export function isStaff(user: CurrentUser | null): boolean {
  return !!user && (user.role === 'admin' || user.role === 'staff');
}

// ── OTP ───────────────────────────────────────────────────────────────

function sha256(v: string): string {
  return createHash('sha256').update(v).digest('hex');
}

export type OtpPurpose = 'login' | 'signup' | 'reset' | 'verify_phone';

/**
 * Issues a 6-digit OTP. The code is hashed at rest so a database dump can't be
 * replayed. In dev (OTP_DRIVER=console) the plaintext is returned so the flow
 * is testable without an SMS provider; in production it is never returned.
 */
export async function issueOtp(
  identifier: string,
  channel: 'sms' | 'email',
  purpose: OtpPurpose,
  ip?: string | null,
): Promise<{ expiresAt: Date; devCode?: string }> {
  // Invalidate any live codes for this identifier+purpose.
  await db.otpCode.updateMany({
    where: { identifier, purpose, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  const code = String(randomInt(100000, 999999));
  const expiresAt = new Date(Date.now() + 10 * 60000);

  await db.otpCode.create({
    data: { identifier, channel, purpose, codeHash: sha256(code), expiresAt, ip: ip ?? null },
  });

  const isConsole = (process.env.OTP_DRIVER ?? 'console') === 'console';
  if (isConsole) {
    console.info(`\n  ┌─ VOLTAGE OTP ──────────────────────────\n  │  ${identifier}  (${purpose})\n  │  CODE: ${code}\n  └────────────────────────────────────────\n`);
  }

  return { expiresAt, devCode: isConsole ? code : undefined };
}

export async function verifyOtp(
  identifier: string,
  purpose: OtpPurpose,
  code: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const row = await db.otpCode.findFirst({
    where: { identifier, purpose, consumedAt: null },
    orderBy: { createdAt: 'desc' },
  });
  if (!row) return { ok: false, reason: 'No active code. Request a new one.' };
  if (row.expiresAt < new Date()) return { ok: false, reason: 'This code has expired.' };
  if (row.attempts >= row.maxAttempts) {
    return { ok: false, reason: 'Too many incorrect attempts. Request a new code.' };
  }

  const expected = Buffer.from(row.codeHash, 'hex');
  const actual = Buffer.from(sha256(code), 'hex');
  const match = expected.length === actual.length && timingSafeEqual(expected, actual);

  if (!match) {
    await db.otpCode.update({ where: { id: row.id }, data: { attempts: { increment: 1 } } });
    const left = row.maxAttempts - row.attempts - 1;
    return {
      ok: false,
      reason: left > 0 ? `Incorrect code. ${left} attempt${left === 1 ? '' : 's'} left.` : 'Incorrect code. Request a new one.',
    };
  }

  await db.otpCode.update({ where: { id: row.id }, data: { consumedAt: new Date() } });
  return { ok: true };
}

// ── Password reset ────────────────────────────────────────────────────

export async function issueResetToken(userId: string): Promise<string> {
  const raw = randomBytes(32).toString('hex');
  await db.passwordResetToken.create({
    data: { userId, tokenHash: sha256(raw), expiresAt: new Date(Date.now() + 30 * 60000) },
  });
  if ((process.env.MAIL_DRIVER ?? 'console') === 'console') {
    console.info(`\n  VOLTAGE reset link: /reset-password?token=${raw}\n`);
  }
  return raw;
}

export async function consumeResetToken(raw: string): Promise<string | null> {
  const row = await db.passwordResetToken.findUnique({ where: { tokenHash: sha256(raw) } });
  if (!row || row.usedAt || row.expiresAt < new Date()) return null;
  await db.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: new Date() } });
  return row.userId;
}

// ── Unique referral code allocation ───────────────────────────────────

export async function allocateReferralCode(name?: string | null): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const code = makeReferralCode(name);
    const clash = await db.user.findUnique({ where: { referralCode: code }, select: { id: true } });
    if (!clash) return code;
  }
  // Astronomically unlikely; fall back to a longer random tail.
  return makeReferralCode(`${name ?? ''}${randomBytes(2).toString('hex')}`);
}
