
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Megaphone } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { Timestamp } from 'firebase/firestore';

type Notice = {
  id: string;
  title: string;
  message: string;
  createdAt: Timestamp;
};

interface NoticePopupProps {
  notice: Notice | null;
}

export default function NoticePopup({ notice }: NoticePopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (notice) {
      const dismissedNoticeId = localStorage.getItem('dismissedNoticeId');
      if (dismissedNoticeId !== notice.id) {
        setIsOpen(true);
      }
    }
  }, [notice]);

  const handleClose = () => {
    if (notice) {
      localStorage.setItem('dismissedNoticeId', notice.id);
    }
    setIsOpen(false);
  };

  if (!isOpen || !notice) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            {t('dashboard_page.notice_board_title')}
          </DialogTitle>
          <DialogDescription>
            {notice.title}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 whitespace-pre-wrap text-sm max-h-[60vh] overflow-y-auto">
          {notice.message}
        </div>
        <DialogFooter>
          <Button onClick={handleClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
