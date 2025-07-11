'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { GraduationCap } from 'lucide-react';

type Placement = {
  id: string;
  name: string;
  company: string;
  role: string;
  year: string;
  photoUrl: string;
};

export default function PlacementsPage() {
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlacements = async () => {
      if (!db) {
        setLoading(false);
        return;
      }
      try {
        const q = query(collection(db, 'placements'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Placement));
        setPlacements(data);
      } catch (error) {
        console.error("Error fetching placements:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlacements();
  }, []);

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">Our Placements</h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          We are proud of our students who have secured positions in leading companies.
        </p>
      </div>
      
      {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
             {[...Array(4)].map((_, i) => (
                <Card key={i}><Skeleton className="h-80 w-full" /></Card>
            ))}
          </div>
      ) : placements.length === 0 ? (
           <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-64 border-2 border-dashed rounded-lg">
                <GraduationCap className="h-16 w-16 mb-4 text-muted-foreground/50" />
                <h3 className="text-xl font-semibold">No Placements to Show Yet</h3>
                <p>Check back later to see our students' success stories.</p>
            </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {placements.map((placement) => (
            <Card key={placement.id} className="text-center">
              <CardHeader className="p-0">
                  <Image src={placement.photoUrl} alt={placement.name} width={400} height={400} className="rounded-t-lg object-cover aspect-square" />
              </CardHeader>
              <CardContent className="p-4">
                <CardTitle className="text-xl font-headline">{placement.name}</CardTitle>
                <p className="text-primary font-semibold">{placement.role}</p>
                <p className="text-muted-foreground">{placement.company}</p>
                <p className="text-sm text-muted-foreground">Batch of {placement.year}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}