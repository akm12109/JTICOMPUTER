
'use client';

import { Mail, Phone, MapPin, MessageCircle } from 'lucide-react';
import ContactForm from '@/components/contact-form';
import { useLanguage } from '@/hooks/use-language';
import Image from 'next/image';

export default function ContactPage() {
  const { t } = useLanguage();

  return (
    <section className="relative py-16 md:py-24">
      <Image
        src="https://raw.githubusercontent.com/akm12109/image_bg_assets/main/JTI/jti%20(4).png"
        alt="Abstract blue background"
        fill
        className="object-cover"
        data-ai-hint="abstract blue"
      />
      <div className="absolute inset-0 bg-black/80" />
      <div className="relative container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-headline text-white">{t('contact_page.title')}</h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-neutral-200">
            {t('contact_page.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
          <div className="bg-primary/10 backdrop-blur-md border border-primary/20 p-8 rounded-lg text-white">
            <h2 className="text-2xl font-bold font-headline mb-6">{t('contact_page.info_title')}</h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <MapPin className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white">{t('contact_page.corporate_office_title')}</h3>
                  <p className="text-neutral-300">{t('contact_page.address_value')}</p>
                </div>
              </div>
               <div className="flex items-start gap-4">
                <MapPin className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white">{t('contact_page.asc_address_title')}</h3>
                  <p className="text-neutral-300">{t('contact_page.asc_address_value')}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Mail className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white">{t('contact_page.email_title')}</h3>
                  <p className="text-neutral-300">{t('contact_page.email_value')}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Phone className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white">{t('contact_page.call_title')}</h3>
                  <p className="text-neutral-300">{t('contact_page.call_value')}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <MessageCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white">{t('contact_page.whatsapp_title')}</h3>
                  <p className="text-neutral-300">{t('contact_page.whatsapp_value')}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-primary/10 backdrop-blur-md border border-primary/20 p-8 rounded-lg text-white">
             <h2 className="text-2xl font-bold font-headline mb-6">{t('contact_page.form_title')}</h2>
             <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}
