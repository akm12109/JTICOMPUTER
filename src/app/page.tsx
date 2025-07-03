'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, BookOpen, UserCheck, Briefcase } from 'lucide-react';
import CourseCard from '@/components/course-card';
import Image from 'next/image';
import { useLanguage } from '@/hooks/use-language';
import { courseImages } from '@/lib/course-data';

const featuredCourseKeys = ['dca', 'adca', 'python'];

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full py-20 md:py-32 lg:py-40">
          <Image
            src="https://raw.githubusercontent.com/akm12109/image_bg_assets/main/JTI/jti%20(1).png"
            alt="JTI Godda Institute campus"
            fill
            className="object-cover"
            data-ai-hint="institute campus"
            priority
          />
          <div className="absolute inset-0 bg-black/60 z-10" />
          <div className="container relative z-20 mx-auto px-4 md:px-6 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-headline tracking-tighter text-white">
              {t('home_page.hero_title')}
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-neutral-200 md:text-xl">
              {t('home_page.hero_subtitle')}
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/courses">
                  {t('home_page.explore_courses')} <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary">
                <Link href="/contact">{t('home_page.contact_us')}</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="w-full py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-3xl font-bold font-headline text-center">{t('home_page.why_jti_title')}</h2>
            <p className="mt-4 text-center text-muted-foreground max-w-2xl mx-auto">
              {t('home_page.why_jti_subtitle')}
            </p>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                    <UserCheck className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="font-headline mt-4">{t('home_page.expert_instructors_title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{t('home_page.expert_instructors_desc')}</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                    <BookOpen className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="font-headline mt-4">{t('home_page.practical_curriculum_title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{t('home_page.practical_curriculum_desc')}</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                    <Briefcase className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="font-headline mt-4">{t('home_page.job_assistance_title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{t('home_page.job_assistance_desc')}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Featured Courses Section */}
        <section className="relative w-full py-12 md:py-20">
          <Image
            src="https://raw.githubusercontent.com/akm12109/image_bg_assets/main/JTI/jti%20(10).png"
            alt="Students learning in a computer lab"
            fill
            className="object-cover"
            data-ai-hint="students computer lab"
          />
          <div className="absolute inset-0 bg-black/70 z-10" />
          <div className="container relative z-20 mx-auto px-4 md:px-6">
            <h2 className="text-3xl font-bold font-headline text-center text-white">{t('home_page.featured_courses_title')}</h2>
            <p className="mt-4 text-center text-neutral-200 max-w-2xl mx-auto">
              {t('home_page.featured_courses_subtitle')}
            </p>
            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {featuredCourseKeys.map((key) => (
                <CourseCard
                  key={key}
                  courseKey={key}
                  image={courseImages[key].image}
                  dataAiHint={courseImages[key].dataAiHint}
                />
              ))}
            </div>
            <div className="mt-12 text-center">
              <Button asChild variant="link" className="text-lg text-white hover:text-neutral-300">
                <Link href="/courses">{t('common.view_all_courses')} <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
            </div>
          </div>
        </section>
        
        {/* Testimonials Section */}
        <section className="w-full py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-3xl font-bold font-headline text-center">{t('home_page.testimonials_title')}</h2>
            <div className="mt-12 grid gap-8 md:grid-cols-1 lg:grid-cols-2 max-w-4xl mx-auto">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Image src="https://placehold.co/100x100.png" data-ai-hint="student profile" alt="Student 1" width={60} height={60} className="rounded-full" />
                    <div>
                      <p className="text-muted-foreground italic">{t('home_page.testimonial1_text')}</p>
                      <p className="font-bold mt-4">{t('home_page.testimonial1_author')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                   <div className="flex items-start gap-4">
                    <Image src="https://placehold.co/100x100.png" data-ai-hint="student profile" alt="Student 2" width={60} height={60} className="rounded-full" />
                    <div>
                      <p className="text-muted-foreground italic">{t('home_page.testimonial2_text')}</p>
                      <p className="font-bold mt-4">{t('home_page.testimonial2_author')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
