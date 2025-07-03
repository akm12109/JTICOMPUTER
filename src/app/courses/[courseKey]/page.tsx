'use client';

import { useParams, useRouter } from 'next/navigation';
import { useLanguage } from '@/hooks/use-language';
import { courseImages } from '@/lib/course-data';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, CheckCircle, Clock, Tag } from 'lucide-react';
import Link from 'next/link';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const courseKey = params.courseKey as string;

  const courseData = courseImages[courseKey];

  if (!courseData) {
    // You can render a 404 page or redirect
    return <div className="container py-20 text-center">Course not found.</div>;
  }

  const title = t(`courses_data.${courseKey}.title`);
  const longDescription = t(`courses_details.${courseKey}.long_description`);
  const duration = t(`courses_details.${courseKey}.duration`);
  const fee = t(`courses_details.${courseKey}.fee`);
  const syllabus = t(`courses_details.${courseKey}.syllabus`).split('|'); // Assuming syllabus is pipe-separated string in JSON

  return (
    <div className="bg-muted/30">
        {/* Hero Section */}
        <section className="relative w-full h-[400px]">
            <Image
                src={courseData.image}
                alt={title}
                fill
                className="object-cover"
                data-ai-hint={courseData.dataAiHint}
                priority
            />
            <div className="absolute inset-0 bg-black/60 z-10" />
            <div className="container relative z-20 mx-auto px-4 md:px-6 h-full flex flex-col justify-center text-white">
                <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tighter max-w-3xl">
                {title}
                </h1>
                <p className="mt-4 text-lg text-neutral-200 max-w-2xl">{longDescription}</p>
            </div>
        </section>

        <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
            <div className="grid md:grid-cols-3 gap-8">
                {/* Left Column for Key Info */}
                <div className="md:col-span-1 space-y-8 sticky top-24 self-start">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Course Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Clock className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="font-semibold">Duration</p>
                                    <p className="text-muted-foreground">{duration}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Tag className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="font-semibold">Course Fee</p>
                                    <p className="text-muted-foreground">{fee}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Button asChild size="lg" className="w-full">
                        <Link href="/register">
                            {t('common.get_admission')} <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                </div>

                {/* Right Column for Syllabus */}
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Syllabus</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-4">
                                {syllabus.map((item, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    </div>
  );
}
