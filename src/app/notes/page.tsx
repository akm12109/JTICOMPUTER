// src/app/notes/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db_secondary } from '@/lib/firebase';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, ArrowRight, FileText } from 'lucide-react';
import Image from 'next/image';

type Note = {
  id: string;
  title: string;
  description: string;
  createdAt: { toDate: () => Date };
};

export default function PublicNotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotes = async () => {
      if (!db_secondary) {
        setLoading(false);
        return;
      }
      try {
        const q = query(
          collection(db_secondary, 'notes'),
          where('target', '==', 'Public'),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const notesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Note[];
        setNotes(notesData);
      } catch (error) {
        console.error("Error fetching public notes: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  return (
    <>
      <section className="relative py-20 md:py-32">
        <Image
          src="https://raw.githubusercontent.com/akm12109/image_bg_assets/main/JTI/jti%20(8).png"
          alt="Library with books"
          fill
          className="object-cover"
          data-ai-hint="library books"
        />
        <div className="absolute inset-0 bg-black/70" />
        <div className="relative container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold font-headline text-white">Public Notes & Resources</h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-neutral-200">
            Access study materials, important documents, and notes shared by the institute.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
          </div>
        ) : notes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map(note => (
              <Card key={note.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-full mt-1">
                        <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <span>{note.title}</span>
                  </CardTitle>
                  <CardDescription className="line-clamp-2">{note.description || 'No description provided.'}</CardDescription>
                </CardHeader>
                <CardFooter className="mt-auto flex justify-between items-center">
                   <p className="text-xs text-muted-foreground">
                    Published on {format(note.createdAt.toDate(), 'PPP')}
                  </p>
                  <Button asChild size="sm">
                    <Link href={`/notes/${note.id}`}>
                      View Note <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-64 border-2 border-dashed rounded-lg">
            <FileText className="h-16 w-16 mb-4 text-muted-foreground/50" />
            <h3 className="text-xl font-semibold">No Public Notes Available</h3>
            <p>Please check back later for new resources.</p>
          </div>
        )}
      </div>
    </>
  );
}
