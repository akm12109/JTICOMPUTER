'use client';

import CourseCard from '@/components/course-card';
import { useLanguage } from '@/hooks/use-language';
import { courseKeys, courseImages } from '@/lib/course-data';

export default function CoursesPage() {
  const { t } = useLanguage();
  return (
    <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">{t('courses_page.title')}</h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          {t('courses_page.subtitle')}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {courseKeys.map((key) => (
          <CourseCard 
            key={key} 
            courseKey={key}
            image={courseImages[key].image}
            dataAiHint={courseImages[key].dataAiHint}
          />
        ))}
      </div>
    </div>
  );
}
