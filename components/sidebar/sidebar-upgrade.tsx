import type { FC } from 'react';
import { useRouter } from 'next/navigation';
import { LockOpen, ArrowRight } from 'lucide-react';

interface SidebarUpgradeProps {
  title?: string;
  subtitle?: string;
  redirectUrl?: string;
  icon?: 'lockOpen' | 'arrowRight';
}

export const SidebarUpgrade: FC<SidebarUpgradeProps> = ({
  title = 'Upgrade plan',
  subtitle = 'Upgrade for file upload, smarter AI, and more',
  redirectUrl = '/upgrade',
  icon = 'lockOpen',
}) => {
  const router = useRouter();

  const handleUpgradeClick = () => {
    if (redirectUrl.startsWith('http')) {
      window.location.href = redirectUrl;
    } else {
      router.push(redirectUrl);
    }
  };

  const IconComponent = icon === 'arrowRight' ? ArrowRight : LockOpen;

  return (
    <div className="mt-2">
      <div
        className="hover:bg-accent -mb-2 flex cursor-pointer flex-col items-start rounded px-1 py-2 hover:opacity-50"
        onClick={handleUpgradeClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleUpgradeClick();
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={title}
      >
        <div className="flex items-center">
          <IconComponent className="mr-2" size={28} />
          <div className="flex flex-col">
            <div className="text-sm font-semibold">{title}</div>
            <div className="text-muted-foreground mt-1 text-xs">{subtitle}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
