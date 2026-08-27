'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, ScanFace } from 'lucide-react';

interface BiometricLoginProps {
  onSuccess: () => void;
  className?: string;
}

export function BiometricLogin({ onSuccess, className }: BiometricLoginProps) {
  const [supported, setSupported] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hasWebAuthn = window.PublicKeyCredential !== undefined;
    setSupported(hasWebAuthn);
  }, []);

  const authenticate = useCallback(async () => {
    setAuthenticating(true);
    setError(null);

    try {
      if (window.PublicKeyCredential) {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (available) {
          await navigator.credentials.create({
            publicKey: {
              challenge: crypto.getRandomValues(new Uint8Array(32)),
              rp: { name: 'VOLTAGE' },
              user: {
                id: new Uint8Array(16),
                name: 'user@voltage.store',
                displayName: 'VOLTAGE User',
              },
              pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
              authenticatorSelection: {
                authenticatorAttachment: 'platform',
                userVerification: 'required',
              },
              timeout: 60000,
            },
          });
          onSuccess();
        }
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError('Authentication was cancelled');
      } else {
        setError('Biometric authentication unavailable');
      }
    } finally {
      setAuthenticating(false);
    }
  }, [onSuccess]);

  if (!supported) return null;

  return (
    <div className={className}>
      <motion.button
        onClick={authenticate}
        whileTap={{ scale: 0.95 }}
        disabled={authenticating}
        className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-line/50 bg-panel-2/50 text-ink-2 hover:bg-panel-2 hover:text-ink transition-all disabled:opacity-50"
        aria-label="Sign in with biometrics"
      >
        {authenticating ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <ScanFace className="size-5" />
          </motion.div>
        ) : (
          <Fingerprint className="size-5" />
        )}
        <span className="text-sm font-medium">
          {authenticating ? 'Authenticating...' : 'Sign in with Face ID / Fingerprint'}
        </span>
      </motion.button>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-bad-400 mt-2 text-center"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
