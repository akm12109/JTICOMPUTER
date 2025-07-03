'use client';

import Image from 'next/image';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/hooks/use-language';

type CourseCardProps = {
  courseKey: string;
  image: string;
  dataAiHint: string;
};

export default function CourseCard({ courseKey, image, dataAiHint }: CourseCardProps) {
  const { t } = useLanguage();
  const title = t(`courses_data.${courseKey}.title`);
  const description = t(`courses_data.${courseKey}.description`);

  return (
    <Card className="relative group w-full h-80 overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card">
        <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover w-full h-full transition-transform duration-500 ease-in-out group-hover:scale-95"
            data-ai-hint={dataAiHint}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="relative h-full flex flex-col justify-end p-6 text-white">
            <CardTitle className="font-headline text-2xl drop-shadow-md z-10">{title}</CardTitle>
            <p className="mt-2 text-sm text-neutral-200 line-clamp-3 drop-shadow-sm z-10">{description}</p>
            <Button asChild variant="link" className="text-white p-0 h-auto justify-start mt-4 z-10 w-fit hover:no-underline hover:text-neutral-200">
              <Link href="#">
                {t('common.learn_more')} <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
        </div>
    </Card>
  );
}
