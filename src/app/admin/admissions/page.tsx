'use client';
import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Eye, Search, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import * as XLSX from 'xlsx';

type Admission = {
  id: string;
  uid: string;
  name: string;
  email: string;
  createdAt: { toDate: () => Date };
};

export default function AdmissionsPage() {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [filteredAdmissions, setFilteredAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [firebaseConfigured, setFirebaseConfigured] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
        setFilteredAdmissions(admissionsData);
      } catch (error) {
        console.error("Error fetching admissions: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAdmissions();
  }, []);
  
  useEffect(() => {
    const results = admissions.filter(admission =>
      admission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admission.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredAdmissions(results);
  }, [searchTerm, admissions]);
  
  const handleExport = () => {
    setIsExporting(true);
    // Use the full 'admissions' state, not the filtered one
    const dataToExport = admissions.map(admission => {
      // Flatten and format data for Excel
      const { createdAt, ...rest } = admission;
      return {
        ...rest,
        admissionDate: createdAt ? format(createdAt.toDate(), 'yyyy-MM-dd HH:mm:ss') : 'N/A'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Admissions");
    XLSX.writeFile(workbook, "admissions_export.xlsx");
    setIsExporting(false);
  };


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
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Admitted Students</CardTitle>
          <CardDescription>List of all students who have submitted an admission form.</CardDescription>
        </div>
         <Button onClick={handleExport} disabled={isExporting || admissions.length === 0}>
            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            {isExporting ? 'Exporting...' : 'Export All'}
          </Button>
      </CardHeader>
      <CardContent>
         <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
        </div>
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
              {filteredAdmissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">
                    {searchTerm ? "No matching students found." : "No admission applications yet."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAdmissions.map(admission => (
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
