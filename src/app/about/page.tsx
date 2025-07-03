
'use client';

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Target, History, Building, Landmark, Info } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

const directorKeys = ['mritunjay', 'sadanand'];
const directorImages: { [key: string]: { image: string, dataAiHint: string } } = {
  mritunjay: { image: 'https://placehold.co/300x300.png', dataAiHint: 'male director' },
  sadanand: { image: 'https://placehold.co/300x300.png', dataAiHint: 'male director suit' },
}

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <>
      <section className="relative py-20 md:py-32">
        <Image
          src="https://raw.githubusercontent.com/akm12109/image_bg_assets/main/JTI/jti%20(7).png"
          alt="JTI Godda Team"
          fill
          className="object-cover"
          data-ai-hint="team working"
        />
        <div className="absolute inset-0 bg-black/70" />
        
        <div className="relative container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold font-headline text-white">{t('about_page.title')}</h1>
            <p className="mt-4 max-w-3xl mx-auto text-lg text-neutral-200">
              {t('about_page.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 text-white">
            <div className="bg-white/10 backdrop-blur-sm p-8 rounded-lg">
              <div className="flex gap-4 items-start">
                <Target className="w-10 h-10 text-primary flex-shrink-0" />
                <div>
                  <h2 className="text-2xl font-bold font-headline">{t('about_page.mission_title')}</h2>
                  <p className="text-neutral-200 mt-2">
                    {t('about_page.mission_desc')}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-8 rounded-lg">
              <div className="flex gap-4 items-start">
                <History className="w-10 h-10 text-primary flex-shrink-0" />
                <div>
                  <h2 className="text-2xl font-bold font-headline">{t('about_page.history_title')}</h2>
                  <p className="text-neutral-200 mt-2">
                    {t('about_page.history_desc')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Corporate Information Section */}
      <section className="relative py-16 md:py-24">
        <Image
            src="https://raw.githubusercontent.com/akm12109/image_bg_assets/main/JTI/jti%20(10).png"
            alt="Abstract corporate background"
            fill
            className="object-cover"
            data-ai-hint="abstract technology"
        />
        <div className="absolute inset-0 bg-black/80" />
        <div className="relative container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-headline text-white">{t('about_page.corporate_info_title')}</h2>
            <p className="mt-4 max-w-2xl mx-auto text-neutral-200">
              {t('about_page.corporate_info_subtitle')}
            </p>
          </div>
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-8">
              <Card className="bg-card/20 backdrop-blur-md border border-primary/20 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-headline text-white"><Info /> {t('about_page.basic_info.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <InfoRow label={t('about_page.basic_info.cin')} value="U72900JH2001PTC012042" />
                  <InfoRow label={t('about_page.basic_info.inc_date')} value={t('about_page.basic_info.inc_date_value')} />
                </CardContent>
              </Card>
              <Card className="bg-card/20 backdrop-blur-md border border-primary/20 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-headline text-white"><Landmark /> {t('about_page.capital_info.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <InfoRow label={t('about_page.capital_info.authorised_capital')} value="₹ 100,000.00" />
                  <InfoRow label={t('about_page.capital_info.paidup_capital')} value="₹ 100,000.00" />
                </CardContent>
              </Card>
            </div>
             <Card className="overflow-hidden bg-card/20 backdrop-blur-md border border-primary/20 text-white">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-headline text-white"><Building /> {t('about_page.location_title')}</CardTitle>
                    <CardDescription className="text-neutral-300">{t('contact_page.address_value')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="aspect-video w-full rounded-md overflow-hidden">
                        <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3621.3979039956384!2d87.2115508!3d24.816062600000002!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f0f4c5787f123f%3A0x744a5904b3976353!2sJharkhand%20Technical%20Institute%20Pvt.ltd!5e0!3m2!1sen!2sin!4v1751354619312!5m2!1sen!2sin" width="100%" height="100%" style={{ border:0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
                    </div>
                </CardContent>
             </Card>
          </div>
        </div>
      </section>

      {/* Leadership Section */}
      <section className="relative py-16 md:py-24">
         <Image
            src="https://raw.githubusercontent.com/akm12109/image_bg_assets/main/JTI/jti%20(1).png"
            alt="Abstract leadership background"
            fill
            className="object-cover"
            data-ai-hint="abstract dark"
        />
        <div className="absolute inset-0 bg-black/80" />
        <div className="relative container mx-auto px-4 md:px-6">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold font-headline text-white">{t('about_page.directors_title')}</h2>
            <p className="mt-4 max-w-2xl mx-auto text-neutral-200">
              {t('about_page.directors_subtitle')}
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {directorKeys.map((key) => {
              const memberName = t(`about_page.directors.${key}.name`);
              return (
                <Card key={key} className="text-center bg-card/20 backdrop-blur-md border border-primary/20 text-white">
                  <CardContent className="p-6">
                    <Image
                      src={directorImages[key].image}
                      alt={memberName}
                      width={120}
                      height={120}
                      className="rounded-full mx-auto mb-4 border-4 border-primary/20"
                      data-ai-hint={directorImages[key].dataAiHint}
                    />
                    <h3 className="text-xl font-bold font-headline text-white">{memberName}</h3>
                    <p className="text-primary font-medium">{t(`about_page.directors.${key}.role`)}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>
    </>
  );
}

const InfoRow = ({ label, value }: { label: string, value: string }) => (
  <div className="flex justify-between items-center text-sm">
    <p className="text-neutral-300">{label}</p>
    <p className="font-medium text-right text-white">{value}</p>
  </div>
);
