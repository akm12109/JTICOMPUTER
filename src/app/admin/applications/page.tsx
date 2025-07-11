

'use client';
import { useEffect, useState, useRef } from 'react';
import { collection, getDocs, orderBy, query, where, deleteDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, firebaseConfig } from '@/lib/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { format, isValid } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, UserCheck, Trash2, Eye, Loader2, Download, Search, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ApplicationPreview } from '@/components/application-preview';
import { logActivity } from '@/lib/activity-logger';

type Application = {
  id: string;
  name: string;
  email: string;
  courseAppliedFor: string;
  createdAt: { toDate: () => Date };
  [key: string]: any;
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [firebaseConfigured, setFirebaseConfigured] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isAdmitting, setIsAdmitting] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const { toast } = useToast();

  const [isPreviewOpen, setPreviewOpen] = useState(false);
  const [appToPreview, setAppToPreview] = useState<Application | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const applicationRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchApplications = async () => {
      if (!db) {
        setFirebaseConfigured(false);
        setLoading(false);
        return;
      }
      try {
        const q = query(collection(db, 'applications'), where('status', '==', 'pending'));
        const querySnapshot = await getDocs(q);
        const appsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Application[];
        
        appsData.sort((a, b) => {
            const dateA = a.createdAt?.toDate()?.getTime() || 0;
            const dateB = b.createdAt?.toDate()?.getTime() || 0;
            return dateB - dateA;
        });
        
        setApplications(appsData);
        setFilteredApplications(appsData);
      } catch (error) {
        console.error("Error fetching applications: ", error);
        toast({
          variant: "destructive",
          title: "Could not fetch applications",
          description: "There was an error fetching data. Please check the browser console for more details."
        });
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, [toast]);

  useEffect(() => {
    const results = applications.filter(app =>
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.courseAppliedFor.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredApplications(results);
  }, [searchTerm, applications]);

  const handleGenerateApplicationPdf = async () => {
    const element = applicationRef.current;
    if (!element || !appToPreview) {
        toast({ variant: 'destructive', title: 'Could not find application to generate PDF.' });
        return;
    }
    setIsGeneratingPdf(true);
    try {
        const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;

        let finalWidth = pdfWidth - 20; // 10mm margin on each side
        let finalHeight = finalWidth / ratio;

        if (finalHeight > pdfHeight - 20) { // 10mm margin top/bottom
            finalHeight = pdfHeight - 20;
            finalWidth = finalHeight * ratio;
        }

        const xOffset = (pdfWidth - finalWidth) / 2;
        const yOffset = 10;

        pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight);
        pdf.save(`Application-Form-${appToPreview.name}.pdf`);

    } catch (error) {
        console.error("Error generating PDF: ", error);
        toast({ variant: 'destructive', title: 'Failed to generate PDF.' });
    } finally {
        setIsGeneratingPdf(false);
    }
  };

  const handleAdmitStudent = async () => {
    if (!selectedApp || !tempPassword || !db) return;

    setIsAdmitting(true);
    let tempApp;
    const tempAppName = `studentCreation_${Date.now()}`;
    try {
        tempApp = initializeApp(firebaseConfig, tempAppName);

        const tempAuth = getAuth(tempApp);
        const userCredential = await createUserWithEmailAndPassword(tempAuth, selectedApp.email, tempPassword);
        const user = userCredential.user;

        const { id, ...appData } = selectedApp;

        await setDoc(doc(db, "admissions", user.uid), {
            ...appData,
            uid: user.uid,
            status: 'admitted',
            admissionDate: serverTimestamp()
        });
        await deleteDoc(doc(db, "applications", selectedApp.id));
        
        await logActivity('student_admitted', {
          description: `${selectedApp.name} was admitted to ${selectedApp.courseAppliedFor}.`,
          link: `/admin/students/${user.uid}`
        });

        const subject = `Admission Approved at JTI Godda`;
        const body = `Dear ${selectedApp.name},\n\nCongratulations! Your application for the ${selectedApp.courseAppliedFor} course has been approved.\n\nYou can now log in to your student dashboard using the following credentials:\nEmail: ${selectedApp.email}\nTemporary Password: ${tempPassword}\n\nPlease log in and change your password as soon as possible.\nLogin here: ${window.location.origin}/login\n\nWelcome to Jharkhand Technical Institute!\n\nBest regards,\nJTI Godda Admission Team`;
        
        const isDesktop = typeof window !== 'undefined' && !/Mobi|Android/i.test(navigator.userAgent);
        
        if (isDesktop) {
            const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(selectedApp.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            window.open(gmailUrl, '_blank', 'noopener,noreferrer');
        } else {
            const mailtoLink = `mailto:${selectedApp.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            window.location.href = mailtoLink;
        }

        setApplications(prev => prev.filter(app => app.id !== selectedApp.id));
        setFilteredApplications(prev => prev.filter(app => app.id !== selectedApp.id));
        toast({ title: "Student Admitted!", description: `${selectedApp.name} has been admitted and their account is created.` });
    } catch (error: any) {
      console.error("Error admitting student:", error);
      toast({ variant: 'destructive', title: "Admission Failed", description: error.message });
    } finally {
      setIsAdmitting(false);
      setModalOpen(false);
      setSelectedApp(null);
      setTempPassword('');
      if (tempApp) await deleteApp(tempApp);
    }
  };

  if (!firebaseConfigured) {
    return (
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Firebase Not Configured</AlertTitle>
            <AlertDescription>
                The backend is not configured correctly. Please provide Firebase credentials.
            </AlertDescription>
        </Alert>
    )
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      );
    }

    if (applications.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-64 border-2 border-dashed rounded-lg">
          <Inbox className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold">No Pending Applications</h3>
          <p>The application queue is empty.</p>
        </div>
      );
    }
    
    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                placeholder="Search by name, email, or course..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                />
            </div>
             {filteredApplications.length > 0 ? (
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Application Date</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Course Applied For</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredApplications.map(app => (
                        <TableRow key={app.id}>
                            <TableCell>{app.createdAt?.toDate ? format(app.createdAt.toDate(), 'PPP') : 'N/A'}</TableCell>
                            <TableCell className="font-medium">{app.name}</TableCell>
                            <TableCell>{app.email}</TableCell>
                            <TableCell>{app.courseAppliedFor}</TableCell>
                            <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => { setAppToPreview(app); setPreviewOpen(true);}}>
                                <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" onClick={() => { setSelectedApp(app); setModalOpen(true); }}>
                                <UserCheck className="mr-2 h-4 w-4" /> Admit
                            </Button>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
             ) : (
                <p className="text-center text-muted-foreground py-8">No matching applications found.</p>
             )}
        </div>
    )
  }

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Pending Applications</CardTitle>
        <CardDescription>Review and approve new student admission applications.</CardDescription>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>

    <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admit Student</DialogTitle>
            <DialogDescription>
              Create an account for {selectedApp?.name} by setting a temporary password. An email will be prepared for you to send to the student.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">Email</Label>
                <Input id="email" value={selectedApp?.email ?? ''} readOnly className="col-span-3" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password"  className="text-right">Temp. Password</Label>
                <Input id="password" value={tempPassword} onChange={(e) => setTempPassword(e.target.value)} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAdmitStudent} disabled={isAdmitting || !tempPassword}>
              {isAdmitting ? 'Admitting...' : 'Confirm Admission'}
            </Button>
          </DialogFooter>
        </DialogContent>
    </Dialog>

    <Dialog open={isPreviewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl">
            <DialogHeader>
                <DialogTitle>Application Preview</DialogTitle>
                <DialogDescription>
                    PDF preview of {appToPreview?.name}'s application form.
                </DialogDescription>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-y-auto p-1">
                <div ref={applicationRef}>
                    {appToPreview && <ApplicationPreview application={{...appToPreview, createdAt: appToPreview.createdAt.toDate()}} />}
                </div>
            </div>
            <DialogFooter>
                <Button variant="secondary" onClick={() => setPreviewOpen(false)}>Close</Button>
                <Button onClick={handleGenerateApplicationPdf} disabled={isGeneratingPdf}>
                    {isGeneratingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Download PDF
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
