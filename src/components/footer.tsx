'use client';
import Link from 'next/link';
import { useLanguage } from '@/hooks/use-language';
import JtiLogo from './jti-logo';
import { Mail, MapPin, Phone } from 'lucide-react';

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="bg-card border-t">
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Section */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <JtiLogo size="large" />
            </Link>
            <p className="text-sm text-muted-foreground">
              {t('footer.about_jti')}
            </p>
          </div>

          {/* Quick Links Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold font-headline">{t('footer.quick_links')}</h3>
            <nav className="flex flex-col space-y-2">
              <Link href="/about" className="text-sm hover:text-primary transition-colors">{t('nav.about')}</Link>
              <Link href="/courses" className="text-sm hover:text-primary transition-colors">{t('nav.courses')}</Link>
              <Link href="/gallery/images" className="text-sm hover:text-primary transition-colors">{t('nav.gallery')}</Link>
              <Link href="/contact" className="text-sm hover:text-primary transition-colors">{t('nav.contact')}</Link>
              <Link href="/login" className="text-sm hover:text-primary transition-colors">{t('common.login')}</Link>
            </nav>
          </div>

          {/* Contact Us Section */}
          <div className="space-y-4 lg:col-span-2">
            <h3 className="text-lg font-semibold font-headline">{t('footer.contact_us')}</h3>
            <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <p className="text-muted-foreground">{t('contact_page.asc_address_value')}</p>
                </div>
                 <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <p className="text-muted-foreground">{t('contact_page.call_value')}</p>
                </div>
                 <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                     <p className="text-muted-foreground">{t('contact_page.email_value')}</p>
                </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t">
          <p className="text-center text-sm text-muted-foreground">
            {t('footer.copyright').replace('{year}', new Date().getFullYear().toString())}
          </p>
        </div>
      </div>
    </footer>
  );
}
