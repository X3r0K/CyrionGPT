import { Button } from '@/components/ui/button';
import { type FC, useContext, useState } from 'react';
import { Label } from '../../ui/label';
import { PentestGPTContext } from '@/context/context';
import { exportChatHistory } from '@/lib/utils/export-chat-history';
import { toast } from 'sonner';
import { Download } from 'lucide-react';
// import { SharedChatsPopup } from './shared-chats-popup';

interface DataControlsTabProps {
  onDeleteAccount: () => void;
  isDeleting?: boolean;
}

export const DataControlsTab: FC<DataControlsTabProps> = ({
  onDeleteAccount,
  isDeleting = false,
}) => {
  const { profile } = useContext(PentestGPTContext);
  const [isExporting, setIsExporting] = useState(false);
  // const [isSharedChatsPopupOpen, setIsSharedChatsPopupOpen] = useState(false);

  const handleDownloadChatHistory = async (format: 'json' | 'csv') => {
    if (!profile?.user_id) {
      toast.error('User ID not found');
      return;
    }

    setIsExporting(true);
    toast.loading('Preparing chat export...', { id: 'export-progress' });

    try {
      await exportChatHistory(profile.user_id, format);

      toast.dismiss('export-progress');
      toast.success(`Chat history exported as ${format.toUpperCase()}!`, {
        duration: 3000,
      });
    } catch (error) {
      console.error('Error downloading chat history:', error);
      toast.dismiss('export-progress');
      toast.error('Failed to download chat history. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {/* <div className="flex items-center justify-between">
          <Label>Shared links</Label>
          <Button
            variant="secondary"
            onClick={() => setIsSharedChatsPopupOpen(true)}
            className="w-[120px]"
          >
            Manage
          </Button>
        </div> */}

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label>Download chat history</Label>
            <p className="text-muted-foreground text-xs">
              Export all your chats and messages
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => handleDownloadChatHistory('json')}
              disabled={isExporting}
              className="min-w-[100px]"
            >
              <Download className="mr-2" size={16} />
              {isExporting ? 'Exporting...' : 'JSON'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleDownloadChatHistory('csv')}
              disabled={isExporting}
              className="min-w-[100px]"
            >
              <Download className="mr-2" size={16} />
              {isExporting ? 'Exporting...' : 'CSV'}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Delete account</Label>
            <Button
              variant="destructive"
              onClick={onDeleteAccount}
              disabled={isDeleting}
              className="w-[120px]"
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
      {/* <SharedChatsPopup
        isOpen={isSharedChatsPopupOpen}
        onClose={() => setIsSharedChatsPopupOpen(false)}
      /> */}
    </div>
  );
};
