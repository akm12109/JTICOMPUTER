'use client';

import Image from 'next/image';
import { useLanguage } from '@/hooks/use-language';
import { Camera } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const images = [
  { src: 'https://raw.githubusercontent.com/akm12109/image_bg_assets/main/JTI/jti%20(1).png', alt: 'JTI Campus', dataAiHint: 'institute campus' },
  { src: 'https://raw.githubusercontent.com/akm12109/image_bg_assets/main/JTI/jti%20(2).png', alt: 'Classroom', dataAiHint: 'classroom students' },
  { src: 'https://raw.githubusercontent.com/akm12109/image_bg_assets/main/JTI/jti%20(3).png', alt: 'Students learning', dataAiHint: 'students learning' },
  { src: 'https://raw.githubusercontent.com/akm12109/image_bg_assets/main/JTI/jti%20(4).png', alt: 'Computer lab', dataAiHint: 'computer lab' },
  { src: 'https://raw.githubusercontent.com/akm12109/image_bg_assets/main/JTI/jti%20(5).png', alt: 'Group discussion', dataAiHint: 'students discussion' },
  { src: 'https://raw.githubusercontent.com/akm12109/image_bg_assets/main/JTI/jti%20(6).png', alt: 'Event celebration', dataAiHint: 'event celebration' },
  { src: 'https://raw.githubusercontent.com/akm12109/image_bg_assets/main/JTI/jti%20(7).png', alt: 'Team photo', dataAiHint: 'team photo' },
  { src: 'https://raw.githubusercontent.com/akm12109/image_bg_assets/main/JTI/jti%20(8).png', alt: 'Seminar', dataAiHint: 'seminar students' },
  { src: 'https://raw.githubusercontent.com/akm12109/image_bg_assets/main/JTI/jti%20(9).png', alt: 'Library', dataAiHint: 'library students' },
];

export default function ImageGalleryPage() {
  const { t } = useLanguage();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <>
      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">{t('image_gallery_page.title')}</h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            {t('image_gallery_page.subtitle')}
          </p>
        </div>
        <div className="columns-1 sm:columns-2 md:columns-3 gap-4 space-y-4">
          {images.map((image, index) => (
            <div
              key={index}
              className="group relative block overflow-hidden rounded-lg cursor-pointer break-inside-avoid"
              onClick={() => setSelectedImage(image.src)}
            >
              <Image
                src={image.src}
                alt={image.alt}
                width={0}
                height={0}
                sizes="100vw"
                className="w-full h-auto transition-transform duration-300 ease-in-out group-hover:scale-105"
                data-ai-hint={image.dataAiHint}
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/50 transition-colors duration-300 flex items-center justify-center">
                <Camera className="w-12 h-12 text-white opacity-0 group-hover:opacity-75 transition-opacity duration-300" />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <Dialog open={!!selectedImage} onOpenChange={(isOpen) => !isOpen && setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0 border-0 bg-transparent">
          {selectedImage && (
            <div className="relative aspect-video">
                 <Image src={selectedImage} alt="Selected gallery image" fill className="object-contain" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
