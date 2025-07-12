'use client';
import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { format, isValid } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Eye, Search, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import * as XLSX from 'xlsx';

type Profile = {
  uid: string;
  name: string;
  email: string;
  courseAppliedFor: string;
  updatedAt: { toDate: () => Date };
};

export default function CareerProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [firebaseConfigured, setFirebaseConfigured] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchProfiles = async () => {
      if (!db) {
        setFirebaseConfigured(false);
        setLoading(false);
        return;
      }
      try {
        const q = query(collection(db, 'admissions'), orderBy('updatedAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const profilesData = querySnapshot.docs
            .map(doc => ({ uid: doc.id, ...doc.data() }))
            .filter(doc => doc.updatedAt) as Profile[];

        setProfiles(profilesData);
        setFilteredProfiles(profilesData);
      } catch (error) {
        console.error("Error fetching career profiles: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfiles();
  }, []);
  
  useEffect(() => {
    const results = profiles.filter(profile =>
      profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProfiles(results);
  }, [searchTerm, profiles]);
  
  const handleExport = () => {
    setIsExporting(true);
    const dataToExport = profiles.map(profile => {
      const { updatedAt, ...rest } = profile;
      return {
        ...rest,
        profileUpdatedAt: updatedAt ? format(updatedAt.toDate(), 'yyyy-MM-dd HH:mm:ss') : 'N/A'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "CareerProfiles");
    XLSX.writeFile(workbook, "career_profiles_export.xlsx");
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
          <CardTitle>Career Profiles</CardTitle>
          <CardDescription>List of students who have filled out their detailed career profile.</CardDescription>
        </div>
        <Button onClick={handleExport} disabled={isExporting || profiles.length === 0}>
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
                <TableHead>Last Updated</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Course</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProfiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    {searchTerm ? 'No matching profiles found.' : 'No career profiles submitted yet.'}
                    </TableCell>
                </TableRow>
              ) : (
                filteredProfiles.map(profile => (
                  <TableRow key={profile.uid}>
                    <TableCell>
                      {profile.updatedAt && isValid(profile.updatedAt.toDate()) ? format(profile.updatedAt.toDate(), 'PPP') : 'N/A'}
                    </TableCell>
                    <TableCell className="font-medium">{profile.name}</TableCell>
                    <TableCell>{profile.email}</TableCell>
                    <TableCell>{profile.courseAppliedFor}</TableCell>
                    <TableCell className="text-right">
                       <Button asChild variant="ghost" size="icon">
                        <Link href={`/admin/students/${profile.uid}`}>
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
