
'use client';

import Image from 'next/image';
import { useLanguage } from '@/hooks/use-language';
import { Camera, ImageOff } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

type GalleryImage = {
  id: string;
  url: string;
  alt: string;
  dataAiHint?: string;
};

export default function ImageGalleryPage() {
  const { t } = useLanguage();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      if (!db) {
        setLoading(false);
        return;
      }
      try {
        const q = query(collection(db, 'gallery'), where('type', '==', 'image'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const fetchedImages = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as GalleryImage[];
        setImages(fetchedImages);
      } catch (error) {
        console.error("Error fetching images: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchImages();
  }, []);

  return (
    <>
      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">{t('image_gallery_page.title')}</h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            {t('image_gallery_page.subtitle')}
          </p>
        </div>
        {loading ? (
             <div className="columns-1 sm:columns-2 md:columns-3 gap-4 space-y-4">
                {[...Array(9)].map((_, i) => <Skeleton key={i} className="h-64 w-full break-inside-avoid" />)}
             </div>
        ) : images.length > 0 ? (
          <div className="columns-1 sm:columns-2 md:columns-3 gap-4 space-y-4">
            {images.map((image) => (
              <div
                key={image.id}
                className="group relative block overflow-hidden rounded-lg cursor-pointer break-inside-avoid"
                onClick={() => setSelectedImage(image.url)}
              >
                <Image
                  src={image.url}
                  alt={image.alt}
                  width={500}
                  height={500}
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                  className="w-full h-auto object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
                  data-ai-hint={image.dataAiHint}
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/50 transition-colors duration-300 flex items-center justify-center">
                  <Camera className="w-12 h-12 text-white opacity-0 group-hover:opacity-75 transition-opacity duration-300" />
                </div>
              </div>
            ))}
          </div>
        ) : (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-64 border-2 border-dashed rounded-lg">
                <ImageOff className="h-16 w-16 mb-4 text-muted-foreground/50" />
                <h3 className="text-xl font-semibold">No Images Yet</h3>
                <p>Check back later to see photos from our campus.</p>
            </div>
        )}
      </div>
      
      <Dialog open={!!selectedImage} onOpenChange={(isOpen) => !isOpen && setSelectedImage(null)}>
        <DialogContent className="max-w-4xl h-[80vh] p-0 border-0 bg-transparent flex items-center justify-center">
          <DialogHeader className="sr-only">
            <DialogTitle>Image Preview</DialogTitle>
            <DialogDescription>A larger view of the selected gallery image.</DialogDescription>
          </DialogHeader>
          {selectedImage && (
            <div className="relative w-full h-full">
                 <Image src={selectedImage} alt="Selected gallery image" fill className="object-contain" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
