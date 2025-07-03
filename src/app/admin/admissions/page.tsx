'use client';
import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type Admission = {
  id: string;
  uid: string;
  name: string;
  email: string;
  createdAt: { toDate: () => Date };
};

export default function AdmissionsPage() {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  const [firebaseConfigured, setFirebaseConfigured] = useState(true);

  useEffect(() => {
    const fetchAdmissions = async () => {
      if (!db) {
        setFirebaseConfigured(false);
        setLoading(false);
        return;
      }
      try {
        const q = query(collection(db, 'admissions'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const admissionsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Admission[];
        setAdmissions(admissionsData);
      } catch (error) {
        console.error("Error fetching admissions: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAdmissions();
  }, []);

  if (!firebaseConfigured) {
    return (
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Firebase Not Configured</AlertTitle>
            <AlertDescription>
                The backend is not configured correctly. Please provide Firebase credentials in your environment variables.
            </AlertDescription>
        </Alert>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admitted Students</CardTitle>
        <CardDescription>List of all students who have submitted an admission form.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admission Date</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">No admission applications yet.</TableCell>
                </TableRow>
              ) : (
                admissions.map(admission => (
                  <TableRow key={admission.id}>
                    <TableCell>{format(admission.createdAt.toDate(), 'PPP')}</TableCell>
                    <TableCell className="font-medium">{admission.name}</TableCell>
                    <TableCell>{admission.email}</TableCell>
                    <TableCell className="text-right">
                       <Button asChild variant="ghost" size="icon">
                        <Link href={`/admin/students/${admission.uid}`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View Details</span>
                        </Link>
                       </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
