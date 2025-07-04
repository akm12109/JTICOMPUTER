
'use client';

import CareerForm from '@/components/career-form';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/hooks/use-language';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

// Define a more comprehensive student type that includes the new fields
type StudentProfile = {
  uid: string;
  [key: string]: any; // Allow other properties
};

export default function CareerPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.uid) {
      const fetchProfile = async () => {
        setLoading(true);
        setError(null);
        try {
          if (!db) throw new Error("Firebase is not configured.");
          const docRef = doc(db, 'admissions', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setStudentProfile({ uid: docSnap.id, ...docSnap.data() } as StudentProfile);
          } else {
            setError(t('careers_page.no_profile_error'));
          }
        } catch (e) {
          console.error(e);
          setError(t('careers_page.fetch_error'));
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    }
  }, [user, t]);

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back_to_dashboard')}
        </Button>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline">{t('careers_page.title')}</CardTitle>
          <CardDescription>{t('careers_page.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{t('common.error')}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {!loading && !error && studentProfile && (
            <CareerForm studentProfile={studentProfile} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
