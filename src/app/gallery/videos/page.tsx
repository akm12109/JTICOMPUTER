'use client';

import { useLanguage } from '@/hooks/use-language';
import { Card, CardContent } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { VideoOff } from 'lucide-react';

type GalleryVideo = {
  id: string;
  url: string;
  title: string;
};

export default function VideoGalleryPage() {
  const { t } = useLanguage();
  const [videos, setVideos] = useState<GalleryVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      if (!db) {
        setLoading(false);
        return;
      }
      try {
        const q = query(collection(db, 'gallery'), where('type', '==', 'video'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const fetchedVideos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as GalleryVideo[];
        setVideos(fetchedVideos);
      } catch (error) {
        console.error("Error fetching videos: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">{t('video_gallery_page.title')}</h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          {t('video_gallery_page.subtitle')}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {loading ? (
            <>
              <Skeleton className="h-80 w-full" />
              <Skeleton className="h-80 w-full" />
            </>
        ) : videos.length > 0 ? (
            videos.map((video) => (
              <Card key={video.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-0">
                  <div className="aspect-video w-full bg-black">
                    <video
                      controls
                      preload="metadata"
                      className="w-full h-full"
                    >
                      <source src={video.url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                  <div className="p-4 bg-card">
                    <h3 className="text-lg font-semibold">{video.title}</h3>
                  </div>
                </CardContent>
              </Card>
            ))
        ) : (
            <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center text-center text-muted-foreground h-64 border-2 border-dashed rounded-lg">
                <VideoOff className="h-16 w-16 mb-4 text-muted-foreground/50" />
                <h3 className="text-xl font-semibold">No Videos Yet</h3>
                <p>Check back later to see videos from our campus.</p>
            </div>
        )}
      </div>
    </div>
  );
}
