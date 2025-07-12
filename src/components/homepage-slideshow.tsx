'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db_secondary as db } from '@/lib/firebase';
import { Skeleton } from './ui/skeleton';

type SlideshowImage = {
  id: string;
  url: string;
};

export default function HomepageSlideshow() {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [count, setCount] = useState(0)
  const [images, setImages] = useState<SlideshowImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
        if (!db) { setLoading(false); return; }
        try {
            const q = query(collection(db, 'slideshowImages'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const fetchedImages = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SlideshowImage[];
            setImages(fetchedImages);
        } catch (error) {
            console.error("Error fetching slideshow images: ", error);
        } finally {
            setLoading(false);
        }
    };
    fetchImages();
  }, []);

  useEffect(() => {
    if (!api) {
      return
    }

    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap() + 1)

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1)
    })
  }, [api])

  if (loading) {
    return (
        <section className="w-full py-16 md:py-24 bg-muted/40">
            <div className="container mx-auto px-4 md:px-6">
                <Skeleton className="h-[400px] w-full" />
            </div>
        </section>
    );
  }

  if (images.length === 0) {
    return null; // Don't render anything if there are no images
  }

  return (
    <section className="w-full py-16 md:py-24 bg-muted/40">
        <div className="container mx-auto px-4 md:px-6 grid md:grid-cols-3 gap-8 items-center">
            <div className="md:col-span-1 space-y-4">
                <h2 className="text-3xl font-bold font-headline">A Glimpse of JTI</h2>
                <p className="text-muted-foreground">
                    Explore moments from our classrooms, events, and student life. See our vibrant community in action.
                </p>
                <div className="text-sm text-muted-foreground pt-4">
                  Slide {current} of {count}
                </div>
            </div>
            <div className="md:col-span-2">
                <Carousel 
                    setApi={setApi} 
                    className="w-full"
                    plugins={[Autoplay({ delay: 4000, stopOnInteraction: true })]}
                    opts={{
                      loop: true,
                    }}
                >
                    <CarouselContent>
                        {images.map((image) => (
                        <CarouselItem key={image.id}>
                            <div className="aspect-video relative overflow-hidden rounded-lg">
                                <Image
                                    src={image.url}
                                    alt="JTI Slideshow Image"
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, 66vw"
                                />
                            </div>
                        </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="absolute left-4" />
                    <CarouselNext className="absolute right-4" />
                </Carousel>
            </div>
        </div>
    </section>
  );
}
