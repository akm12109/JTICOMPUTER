'use client';

import { useLanguage } from '@/hooks/use-language';
import { Card, CardContent } from '@/components/ui/card';

const videos = [
  { videoId: 'dQw4w9WgXcQ', title: 'Campus Tour' },
  { videoId: '3JZ_D3pSS4U', title: 'Student Testimonials' },
  { videoId: 'JGwWNGJdvx8', title: 'Annual Function 2023' },
  { videoId: 'Y-x0efG1seA', title: 'A Day at JTI Godda' },
];

export default function VideoGalleryPage() {
  const { t } = useLanguage();
  return (
    <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">{t('video_gallery_page.title')}</h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          {t('video_gallery_page.subtitle')}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {videos.map((video, index) => (
          <Card key={index} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-0">
              <div className="aspect-video w-full">
                <iframe
                  src={`https://www.youtube.com/embed/${video.videoId}`}
                  title={video.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>
              <div className="p-4 bg-card">
                 <h3 className="text-lg font-semibold">{video.title}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
