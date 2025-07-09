
'use client';
import { useEffect, useState } from 'react';
import DashboardClient from "@/components/dashboard-client";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

type Student = {
  uid: string;
  name: string;
  fatherName: string;
  email: string;
  phone: string;
  address: string;
  dob: { toDate: () => Date };
  lastQualification: string;
  courseAppliedFor: string;
  createdAt: { toDate: () => Date };
};

type Receipt = {
  id: string;
  receiptNo: string;
  amount: number;
  feeType: string;
  feeForMonths?: string;
  createdAt: { toDate: () => Date };
};

type Notice = {
  id: string;
  title: string;
  message: string;
  createdAt: { toDate: () => Date };
}

type Note = {
  id: string;
  title: string;
  description: string;
  url: string;
  createdAt: { toDate: () => Date };
}


export default function DashboardPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [bills, setBills] = useState<Receipt[]>([]); // Changed to Receipt
  const [notices, setNotices] = useState<Notice[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [firebaseConfigured, setFirebaseConfigured] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchDashboardData = async () => {
        if (!db) {
          setFirebaseConfigured(false);
          setLoading(false);
          return;
        }
        try {
            const studentDocRef = doc(db, 'admissions', user.uid);
            const studentDocSnap = await getDoc(studentDocRef);
            if (studentDocSnap.exists()) {
                const studentData = {uid: studentDocSnap.id, ...studentDocSnap.data()} as Student;
                setStudent(studentData);

                const billsQuery = query(
                  collection(db, 'receipts'),
                  where('studentId', '==', user.uid),
                  orderBy('createdAt', 'desc')
                );
                const billsSnapshot = await getDocs(billsQuery);
                const billsData = billsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Receipt[];
                setBills(billsData);

                const noticesQuery = query(collection(db, 'notices'), orderBy('createdAt', 'desc'));
                const noticesSnapshot = await getDocs(noticesQuery);
                const noticesData = noticesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Notice[];
                setNotices(noticesData);

                const notesQuery = query(
                    collection(db, 'notes'),
                    where('target', 'in', ['Public', studentData.courseAppliedFor]),
                    orderBy('createdAt', 'desc')
                );
                const notesSnapshot = await getDocs(notesQuery);
                const notesData = notesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Note[];
                setNotes(notesData);
            }

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
      };
      fetchDashboardData();
    } else {
        setLoading(false)
    }
  }, [user]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="mb-8">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-6 w-1/3 mt-2" />
        </div>
        <div className="grid lg:grid-cols-3 gap-8 items-start">
            <Skeleton className="h-96 lg:col-span-1" />
            <Skeleton className="h-80 lg:col-span-2" />
        </div>
    </div>
    )
  }

  if (!firebaseConfigured) {
    return (
        <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
           <Alert variant="destructive">
               <AlertTriangle className="h-4 w-4" />
               <AlertTitle>Firebase Not Configured</AlertTitle>
               <AlertDescription>
                   Cannot load student data because the backend is not configured correctly. Please contact support.
               </AlertDescription>
           </Alert>
       </div>
   )
  }

  if (!student) {
    return (
         <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
            <h1 className="text-2xl font-bold">Could not load student data.</h1>
            <p>You may not have an admission record. Please fill the admission form or contact support if this issue persists.</p>
        </div>
    )
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold font-headline">{t('dashboard_page.welcome').replace('{name}', student.name)}</h1>
            <p className="text-muted-foreground mt-2">{t('dashboard_page.subtitle')}</p>
        </div>
        <DashboardClient student={student} bills={bills} notices={notices} notes={notes} />
    </div>
  );
}
