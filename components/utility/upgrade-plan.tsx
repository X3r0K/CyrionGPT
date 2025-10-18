'use client';

import Loading from '@/app/loading';
import { Button } from '@/components/ui/button';
import { PentestGPTContext } from '@/context/context';
import { getSubscriptionByUserId } from '@/db/subscriptions';
import {
  Sparkles,
  Users,
  ArrowLeft,
  LoaderCircle,
  Info,
  MessagesSquare,
  Upload,
  SquareTerminal,
  Brain,
  CreditCard,
  FlaskConical,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FC, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import PentestGPTTextSVG from '@/components/icons/pentestgpt-text-svg';
import { TabGroup, TabList, Tab } from '@headlessui/react';
import { useUIContext } from '@/context/ui-context';

export const UpgradePlan: FC = () => {
  const router = useRouter();
  const { profile, userEmail } = useContext(PentestGPTContext);
  const { isMobile } = useUIContext();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>(
    'monthly',
  );
  const [loadingPlan, setLoadingPlan] = useState<
    'pro' | 'ultra' | 'team' | null
  >(null);
  const { theme } = useTheme();

  useEffect(() => {
    const initialize = async () => {
      if (!profile) {
        setIsLoading(false);
        return;
      }

      try {
        const subscription = await getSubscriptionByUserId(profile.user_id);

        if (subscription) {
          router.push('/login');
          return;
        }
      } catch (error) {
        toast.error((error as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [profile, router]);

  const handleUpgradeClick = async (planType: 'pro' | 'ultra' | 'team') => {
    if (isLoading || !profile) return;

    setLoadingPlan(planType);

    try {
      // Redirect to HackerAI login with pricing redirect
      window.location.href = 'https://hackerai.co/login?intent=pricing';
    } catch (_error) {
      toast.error('Failed to process upgrade. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  if (!profile) {
    return null;
  }

  const planPrices = {
    pro: { monthly: '$20', yearly: '$17' },
    ultra: { monthly: '$200', yearly: '$166' },
    team: { monthly: '$40', yearly: '$33' },
  };

  const getYearlySavingsNote = (plan: 'pro' | 'ultra' | 'team') => {
    if (selectedPlan === 'yearly') {
      if (plan === 'pro') return 'Save $36/year';
      if (plan === 'ultra') return 'Save $408/year';
      if (plan === 'team') return 'Save $84/year';
    }
    return '';
  };

  type PlanFeature = {
    icon: FC<{ size?: number; className?: string }>;
    text: string;
  };

  const proFeatures: Array<PlanFeature> = [
    { icon: Sparkles, text: 'Access to smartest AI model' },
    { icon: MessagesSquare, text: 'Expanded messaging' },
    { icon: Upload, text: 'Access to file uploads' },
    { icon: SquareTerminal, text: 'Agent mode with terminal' },
    { icon: Brain, text: 'Expanded memory and context' },
  ];

  const ultraFeatures: Array<PlanFeature> = [
    { icon: MessagesSquare, text: 'Unlimited messages and uploads' },
    { icon: Brain, text: 'Maximum memory and context' },
    { icon: FlaskConical, text: 'Research preview of new features' },
  ];

  const teamFeatures: Array<PlanFeature> = [
    {
      icon: Sparkles,
      text: 'Everything in Pro: smartest AI model, expanded messaging, file uploads, agent mode with terminal, expanded memory and context',
    },
    { icon: CreditCard, text: 'Centralized billing and invoicing' },
    { icon: Users, text: 'Advanced team + seat management' },
  ];

  return (
    <div className="flex w-full flex-col">
      <div className="relative flex items-center justify-center p-4">
        <Button
          variant="ghost"
          onClick={() => router.push('/login')}
          className="absolute left-4 p-2"
          aria-label="Exit"
        >
          <ArrowLeft size={24} />
        </Button>
        <div className="flex w-full items-center justify-center">
          <PentestGPTTextSVG
            className={`${theme === 'dark' ? 'text-white' : 'text-black'}`}
            scale={0.08}
          />
        </div>
      </div>
      <div className="flex grow flex-col items-center justify-center p-2 md:mt-16 md:p-8">
        {/* Migration Notice */}
        <div className="mb-6 w-full max-w-5xl rounded-md border border-orange-500/30 bg-orange-500/10 p-3 md:p-4">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 shrink-0 text-orange-500" size={20} />
            <div className="flex-1">
              <p className="text-sm md:text-base font-medium text-foreground">
                <span className="font-semibold">
                  PentestGPT has permanently moved to HackerAI
                </span>
              </p>
              <p className="mt-1 text-xs md:text-sm text-muted-foreground">
                This platform is being discontinued. All new subscriptions are
                now handled at{' '}
                <a
                  href="https://hackerai.co"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-orange-500 hover:text-orange-600 underline"
                >
                  hackerai.co
                </a>
                .{' '}
                <span className="font-medium text-foreground">
                  You must create your account using your current email address
                  ({userEmail})
                </span>{' '}
                to ensure proper subscription setup and avoid any billing
                issues.
              </p>
            </div>
          </div>
        </div>

        <span className="mb-6 md:mb-8 text-center text-2xl font-semibold md:text-3xl">
          Upgrade your plan
        </span>

        <TabGroup
          onChange={(index) =>
            setSelectedPlan(index === 0 ? 'monthly' : 'yearly')
          }
        >
          <TabList className="bg-secondary mx-auto mb-6 flex w-64 md:w-72 space-x-2 rounded-xl p-1">
            {['Monthly', 'Yearly'].map((plan) => (
              <Tab
                key={plan}
                className={({ selected }) =>
                  `w-full px-4 py-1.5 text-sm font-medium leading-5 rounded-lg
                  transition-all duration-200 ease-in-out
                  ${
                    selected
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-secondary/20 hover:text-foreground'
                  }`
                }
              >
                {plan}
              </Tab>
            ))}
          </TabList>
        </TabGroup>

        <div
          className={`grid w-full max-w-7xl ${
            isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-3 gap-4'
          } px-3 md:px-6`}
        >
          {/* Pro Plan */}
          <PlanCard
            title="Pro"
            price={`USD ${planPrices.pro[selectedPlan]}/month`}
            buttonText="Upgrade to Pro"
            buttonLoading={loadingPlan === 'pro'}
            onButtonClick={() => handleUpgradeClick('pro')}
            savingsNote={getYearlySavingsNote('pro')}
            features={proFeatures}
          />

          {/* Ultra Plan */}
          <PlanCard
            title="Ultra"
            price={`USD ${planPrices.ultra[selectedPlan]}/month`}
            buttonText="Upgrade to Ultra"
            buttonLoading={loadingPlan === 'ultra'}
            onButtonClick={() => handleUpgradeClick('ultra')}
            savingsNote={getYearlySavingsNote('ultra')}
            features={ultraFeatures}
            footerNote="Unlimited subject to abuse guardrails."
          />

          {/* Team Plan */}
          <PlanCard
            title="Team"
            price={`USD ${planPrices.team[selectedPlan]} per person/month`}
            buttonText="Upgrade to Team"
            buttonLoading={loadingPlan === 'team'}
            onButtonClick={() => handleUpgradeClick('team')}
            savingsNote={getYearlySavingsNote('team')}
            features={teamFeatures}
          />
        </div>
      </div>
      <div className="h-16" /> {/* Increased footer space */}
    </div>
  );
};

interface PlanCardProps {
  title: string;
  price: string;
  buttonText: string;
  buttonLoading?: boolean;
  onButtonClick?: () => void;
  savingsNote?: string;
  features: Array<{
    icon: FC<{ size?: number; className?: string }>;
    text: string;
  }>;
  buttonDisabled?: boolean;
  footerNote?: string;
}

const PlanCard: FC<PlanCardProps> = ({
  title,
  price,
  buttonText,
  buttonLoading,
  onButtonClick,
  savingsNote,
  features,
  buttonDisabled,
  footerNote,
}) => {
  const getIcon = () => {
    if (title === 'Pro') return <Sparkles className="mr-2" size={18} />;
    if (title === 'Ultra') return <FlaskConical className="mr-2" size={18} />;
    return <Users className="mr-2" size={18} />;
  };

  return (
    <div className="bg-popover border-primary/20 flex flex-col rounded-lg border p-6 text-left shadow-md">
      <div className="mb-4">
        <h2 className="flex items-center text-xl font-bold">
          {getIcon()}
          {title}
        </h2>
        <p className="text-muted-foreground mt-1">{price}</p>
        {savingsNote && (
          <p className="mt-1 text-sm font-medium text-green-500">
            {savingsNote}
          </p>
        )}
      </div>
      <Button
        variant="default"
        onClick={onButtonClick}
        disabled={buttonLoading || buttonDisabled}
        className="mb-6 w-full"
      >
        {buttonLoading && (
          <LoaderCircle size={22} className="mr-2 animate-spin" />
        )}
        <span>{buttonText}</span>
      </Button>
      <div className="grow space-y-3">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start gap-3">
            <feature.icon size={18} className="mt-0.5 shrink-0" />
            <span className="text-foreground text-sm">{feature.text}</span>
          </div>
        ))}
      </div>
      {footerNote && (
        <p className="text-muted-foreground text-xs mt-4">{footerNote}</p>
      )}
      {title === 'Pro' && (
        <div className="mb-1 mt-6 text-left">
          <a
            href="https://help.hackerai.co/en/articles/9982061-what-is-pentestgpt-pro"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 text-xs font-medium underline"
          >
            Learn more about usage limits and FAQs
          </a>
        </div>
      )}
    </div>
  );
};
