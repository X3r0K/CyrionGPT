'use client';

import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { usePentestGPT } from '@/context/context';
import { ExternalLink } from 'lucide-react';
import { HACKERAI_MIGRATION_URL } from '@/lib/utils';

const DEPRECATION_KEY = 'pentestgpt_deprecation_shown';

export const DeprecationPopup = () => {
  const { isPremiumSubscription, subscriptionLoaded } = usePentestGPT();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      return;
    }

    // Wait for subscription to load
    if (!subscriptionLoaded) {
      return;
    }

    // Only show for premium users
    if (!isPremiumSubscription) {
      return;
    }

    // Check if user has already seen the popup
    try {
      const hasSeenPopup = localStorage.getItem(DEPRECATION_KEY);
      if (!hasSeenPopup) {
        setIsOpen(true);
      }
    } catch (error) {
      // localStorage might be disabled or throw an error
      console.warn('Failed to check deprecation popup status:', error);
    }
  }, [isPremiumSubscription, subscriptionLoaded]);

  const handleClose = () => {
    setIsOpen(false);
    try {
      localStorage.setItem(DEPRECATION_KEY, 'true');
    } catch (error) {
      // localStorage might be disabled
      console.warn('Failed to save deprecation popup status:', error);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setIsOpen(true);
    } else {
      handleClose();
    }
  };

  const handleMigrate = () => {
    handleClose();
    window.open(HACKERAI_MIGRATION_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl">
            Important: PentestGPT Migration to HackerAI
          </AlertDialogTitle>
          <AlertDialogDescription className="pt-2 text-base">
            <span className="block mb-3">
              PentestGPT will be deprecated by{' '}
              <strong>November 30, 2025</strong>.
            </span>
            <span className="block mb-3">
              We&apos;ve migrated to HackerAI, our new platform with better features
              and improvements currently in development.
            </span>
            <span className="block mb-3">
              To migrate your subscription, simply create an account on HackerAI
              using the same email address, then click &quot;Migrate Subscription&quot;.
            </span>
            <span className="block text-sm">
              Have questions?{' '}
              <a
                href="https://help.hackerai.co/en/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary inline-flex items-center gap-1 hover:underline"
              >
                Contact us via chat
                <ExternalLink className="h-3 w-3" />
              </a>
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose}>Close</AlertDialogCancel>
          <Button onClick={handleMigrate} className="gap-2">
            Migrate Now
            <ExternalLink className="h-4 w-4" />
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
