'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Sheet } from '@/components/ui/overlay';
import { CheckCircle, XCircle, Mail, Phone, Chrome, Apple, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

type OnboardingStep = 'welcome' | 'signin' | 'permissions' | 'completed';

export function Onboarding() {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [locationGranted, setLocationGranted] = useState(false);
  const [notificationGranted, setNotificationGranted] = useState(false);
  const toast = useToast();

  // Persist that onboarding was completed
  useEffect(() => {
    const alreadySeen = localStorage.getItem('onboardingCompleted');
    if (alreadySeen) {
      // Immediately redirect or hide; for now just unmount
      setStep('completed');
    }
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem('onboardingCompleted', 'true');
    setStep('completed');
    toast.success('Welcome to Voltage!', 'Your preferences and cart are saved across sessions.');
  };

  const skipOnboarding = () => {
    localStorage.setItem('onboardingSkipped', 'true');
    setStep('completed');
  };

  const requestLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      setLocationGranted(true);
      return;
    }
    try {
      const pos = await navigator.geolocation.getCurrentPosition(
        () => setLocationGranted(true),
        (err) => {
          console.error(err);
          toast.error('Could not access location');
          setLocationGranted(true);
        },
      );
    } catch (e) {
      toast.error('Location permission denied');
      setLocationGranted(true);
    }
  };

  const requestNotification = async () => {
    if (!('Notification' in window)) {
      setNotificationGranted(true);
      return;
    }
    if (Notification.permission === 'granted') {
      setNotificationGranted(true);
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationGranted(true);
        toast.success('Notifications enabled', 'Youll receive order updates, price-drops and cart-abandon alerts.')
      } else {
        setNotificationGranted(true);
      }
    } catch (e) {
      console.error(e);
      setNotificationGranted(true);
    }
  };

  if (step === 'completed') return null;

  const activeStep = step as Exclude<OnboardingStep, 'completed'>;

  const steps: Record<Exclude<OnboardingStep, 'completed'>, () => React.ReactElement> = {
    welcome: () => (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-ink mb-4">Welcome to Voltage</h2>
        <p className="text-ink-2 mb-6">
          Discover the newest phones, accessories and exclusive deals. To give you a
          personalised experience, please choose how youd like to start.
        </p>
        <div className="flex gap-3">
          <Button onClick={() => setStep('signin')} variant="primary" fullWidth>
            Continue
          </Button>
          <Button onClick={skipOnboarding} variant="outline" fullWidth>
            Skip
          </Button>
        </div>
      </div>
    ),

    signin: () => (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-ink mb-6">How would you like to sign in?</h2>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Button
            onClick={() => {
              // TODO: initiate phone OTP flow
              toast.info('Phone OTP selected', 'Enter your mobile number to receive an OTP.')
            }}
            variant="outline"
            fullWidth
          >
            <Phone className="size-4 mr-2" />
            Phone OTP
          </Button>
          <Button
            onClick={() => {
              // TODO: initiate email sign-in
              toast.info('Email selected', 'Enter your email address.')
            }}
            variant="outline"
            fullWidth
          >
            <Mail className="size-4 mr-2" />
            Email
          </Button>
          <Button
            onClick={() => {
              // TODO: Google sign-in
              toast.info('Chrome selected', 'Sign in with Chrome.')
            }}
            variant="outline"
            fullWidth
          >
            <Chrome className="size-4 mr-2" />
            Chrome
          </Button>
          <Button
            onClick={() => {
              // TODO: Apple sign-in
              toast.info('Apple selected', 'Sign in with Apple.')
            }}
            variant="outline"
            fullWidth
          >
            <Apple className="size-4 mr-2" />
            Apple
          </Button>
        </div>
        <Button onClick={() => setStep('welcome')} variant="link" mt-4>
          Back
        </Button>
      </div>
    ),

    permissions: () => (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-ink mb-6">Permissions</h2>
        <div className="space-y-4">
          <div>
            <p className="text-ink-2 mb-2">Location access</p>
            <p className="text-ink-3 text-sm">
              Allow Voltage to use your location for nearby stores, pincode-based
              serviceability and personalised offers.
            </p>
            <Button onClick={requestLocation} disabled={locationGranted} fullWidth variant="primary">
              {locationGranted ? 'Granted' : 'Allow Location'}
            </Button>
          </div>
          <div>
            <p className="text-ink-2 mb-2">Notification access</p>
            <p className="text-ink-3 text-sm">
              Allow Voltage to send you push notifications about orders, price‑drops,
              cart abandonment and exclusive deals.
            </p>
            <Button onClick={requestNotification} disabled={notificationGranted} fullWidth variant="primary">
              {notificationGranted ? 'Granted' : 'Allow Notifications'}
            </Button>
          </div>
          <div className="mt-6">
            <Button onClick={skipOnboarding} variant="outline" fullWidth>
              Skip (you can enable these in settings later)
            </Button>
            <Button
              onClick={completeOnboarding}
              variant="primary"
              fullWidth
              disabled={!locationGranted || !notificationGranted}
            >
              Finish
            </Button>
          </div>
        </div>
      </div>
    ),
  };

  return (
    <Sheet
      open={step !== 'completed' as OnboardingStep}
      onClose={() => setStep('welcome')}
      title="Onboarding"
      side="left"
    >
      <div className="h-full w-full">
        {steps[activeStep]()}
      </div>
    </Sheet>
  );
}