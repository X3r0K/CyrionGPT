import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PentestGPTContext } from '@/context/context';
import { getBillingPortalUrl } from '@/lib/server/stripe-url';
import type { SubscriptionStatus } from '@/types/chat';
import { RefreshCcw, Info, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FC, useContext, useState } from 'react';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';

interface SubscriptionTabProps {
  userEmail: string;
  isMobile: boolean;
}

export const SubscriptionTab: FC<SubscriptionTabProps> = ({
  userEmail,
  isMobile,
}) => {
  const router = useRouter();
  const isLongEmail = userEmail.length > 30;
  const [loading, setLoading] = useState(false);
  const {
    isPremiumSubscription,
    subscriptionStatus,
    updateSubscription,
    fetchStartingData,
  } = useContext(PentestGPTContext);

  const redirectToBillingPortal = async () => {
    setLoading(true);
    const checkoutUrlResult = await getBillingPortalUrl();
    setLoading(false);
    if (checkoutUrlResult.type === 'error') {
      toast.error(checkoutUrlResult.error.message);
    } else {
      router.push(checkoutUrlResult.value);
    }
  };

  const handleRestoreButtonClick = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stripe/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'An error occurred while restoring the subscription',
        );
      }

      await fetchStartingData();

      if (data.message) {
        toast.warning(data.message);
      } else if (data.subscription) {
        toast.success('Your subscription has been restored.');
        updateSubscription(data.subscription);
      }
    } catch (error: any) {
      console.error('Error restoring subscription:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeClick = () => {
    router.push('/upgrade');
  };

  const showRestoreSubscription =
    subscriptionStatus === 'free' &&
    process.env.NEXT_PUBLIC_ENABLE_STRIPE_RESTORE === 'true';

  const handleMigrateClick = () => {
    window.location.href =
      'https://hackerai.co/login?confirm-migrate-pentestgpt=true';
  };

  return (
    <div className="space-y-4">
      {/* Migration Notice - Only show for premium users */}
      {isPremiumSubscription && (
        <div className="rounded-md border border-orange-500/30 bg-orange-500/10 p-3">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 shrink-0 text-orange-500" size={18} />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                <span className="font-semibold">
                  Action Required: PentestGPT is permanently moving to HackerAI
                </span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                This platform will be discontinued. To continue your
                subscription, you must migrate to HackerAI.{' '}
                <span className="font-medium text-foreground">
                  Important: Create your HackerAI account using the same email
                  address ({userEmail})
                </span>{' '}
                to maintain your subscription benefits.
              </p>
              <Button
                variant="default"
                size="sm"
                onClick={handleMigrateClick}
                className="mt-3 flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600"
                tabIndex={0}
                aria-label="Migrate to HackerAI"
              >
                Migrate Now
                <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">Current plan</Label>
          <p className="mt-1">
            <PlanName subscriptionStatus={subscriptionStatus} />
          </p>
        </div>
        {isPremiumSubscription ? (
          <Button
            variant="secondary"
            disabled={loading}
            onClick={redirectToBillingPortal}
            className="flex items-center"
          >
            Manage subscription
          </Button>
        ) : (
          <Button
            variant="secondary"
            disabled={loading}
            onClick={handleUpgradeClick}
            className="flex items-center"
          >
            Upgrade to Pro
          </Button>
        )}
      </div>

      {showRestoreSubscription && (
        <div className="mt-4 flex items-center justify-between">
          <Label className="text-sm font-medium">Restore subscription</Label>
          <Button
            variant="secondary"
            disabled={loading}
            onClick={handleRestoreButtonClick}
            className="flex items-center"
          >
            <RefreshCcw className="mr-2" size={18} />
            Restore
          </Button>
        </div>
      )}

      <Separator className="my-4" />

      <div
        className={
          isLongEmail || isMobile
            ? 'space-y-2'
            : 'flex items-center justify-between'
        }
      >
        <Label htmlFor="email-input">Email address</Label>
        <Input
          id="email-input"
          value={userEmail}
          readOnly
          className="bg-secondary w-full cursor-default truncate sm:w-2/3"
        />
      </div>
    </div>
  );
};

interface PlanNameProps {
  subscriptionStatus: SubscriptionStatus;
}

export const PlanName: FC<PlanNameProps> = ({ subscriptionStatus }) => {
  const planName =
    subscriptionStatus?.charAt(0).toUpperCase() + subscriptionStatus?.slice(1);

  return (
    <span
      className={`text-xl font-bold ${subscriptionStatus !== 'free' ? 'text-primary' : 'text-muted-foreground'}`}
    >
      {planName}
    </span>
  );
};
