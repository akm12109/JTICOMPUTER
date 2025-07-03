"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/hooks/use-language';
import { courseKeys } from '@/lib/course-data';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const [name, setName] = useState('');
  const { language, setLanguage, t } = useLanguage();

  const handleLanguageSelect = (lang: 'en' | 'hi' | 'hn') => {
    setLanguage(lang);
  };

  const handleSubmit = () => {
    localStorage.setItem('userName', name);
    // You can also store interested courses here
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('welcome_modal.title')}</DialogTitle>
          <DialogDescription>{t('welcome_modal.greeting')}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              {t('welcome_modal.name_label')}
            </Label>
            <Input
              id="name"
              placeholder={t('welcome_modal.name_placeholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">{t('welcome_modal.language_label')}</Label>
            <div className="col-span-3 flex gap-2">
              <Button variant={language === 'en' ? 'default' : 'outline'} onClick={() => handleLanguageSelect('en')}>English</Button>
              <Button variant={language === 'hi' ? 'default' : 'outline'} onClick={() => handleLanguageSelect('hi')}>हिन्दी</Button>
              <Button variant={language === 'hn' ? 'default' : 'outline'} onClick={() => handleLanguageSelect('hn')}>Hinglish</Button>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="courses" className="text-right">
              {t('welcome_modal.course_label')}
            </Label>
            <div className="col-span-3">
               <Select>
                <SelectTrigger>
                  <SelectValue placeholder={t('welcome_modal.course_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {courseKeys.map(key => (
                     <SelectItem key={key} value={key}>{t(`courses_data.${key}.title`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit}>{t('welcome_modal.start_exploring')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
