'use client';
import Link from 'next/link';
import { useLanguage } from '@/hooks/use-language';
import JtiLogo from './jti-logo';

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="bg-card border-t">
      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <JtiLogo size="medium" />
          </div>
          <p className="text-sm text-muted-foreground">
            {t('footer.copyright').replace('{year}', new Date().getFullYear().toString())}
          </p>
          <nav className="flex gap-4">
            <Link href="/about" className="text-sm hover:text-primary transition-colors">{t('nav.about')}</Link>
            <Link href="/courses" className="text-sm hover:text-primary transition-colors">{t('nav.courses')}</Link>
            <Link href="/gallery/images" className="text-sm hover:text-primary transition-colors">{t('nav.gallery')}</Link>
            <Link href="/contact" className="text-sm hover:text-primary transition-colors">{t('nav.contact')}</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
