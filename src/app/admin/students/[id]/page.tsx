
'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs, orderBy, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, ArrowLeft, Mail, User, Calendar, Receipt, Phone, Home, BookOpen, GraduationCap, Edit, Trash2, Download, Loader2, Landmark, Percent, Hash, VenetianMask, FileBadge, Image as ImageIcon } from 'lucide-react';
import { format, isValid } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CareerProfilePreview } from '@/components/career-profile-preview';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Image from 'next/image';

type Student = {
  uid: string;
  name: string;
  fatherName: string;
  email: string;
  phone: string;
  address: string;
  dob: { toDate: () => Date };
  courseAppliedFor: string;
  createdAt: { toDate: () => Date };
  slNo?: string;
  session?: string;
  sex?: string;
  nationality?: string;
  photoDataUri?: string;
  signatureDataUri?: string;
  qualifications?: {
    examination: string;
    board: string;
    passingYear: string;
    division: string;
    percentage: string;
  }[];
  [key: string]: any;
};

type Bill = {
  id: string;
  billNumber: string;
  total: number;
  status: 'paid' | 'unpaid';
  paymentMethod?: 'cash' | 'upi' | 'card';
  createdAt: { toDate: () => Date };
};

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;
  const { toast } = useToast();

  const [student, setStudent] = useState<Student | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editableStudent, setEditableStudent] = useState<Partial<Student>>({});

  const [isProfileDialogOpen, setProfileDialogOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (!studentId || !db) {
      if(!db) setError("Firebase not configured.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const studentDocRef = doc(db, 'admissions', studentId);
        const studentDocSnap = await getDoc(studentDocRef);

        if (!studentDocSnap.exists()) {
          setError('Student not found.');
          return;
        }
        const studentData = { uid: studentDocSnap.id, ...studentDocSnap.data() } as Student;
        setStudent(studentData);
        setEditableStudent(studentData);

        const billsQuery = query(
          collection(db, 'bills'),
          where('studentId', '==', studentId),
          orderBy('createdAt', 'desc')
        );
        const billsSnapshot = await getDocs(billsQuery);
        const billsData = billsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Bill[];
        setBills(billsData);

      } catch (err) {
        console.error("Error fetching student details: ", err);
        setError('Failed to fetch student details.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId]);

  const handleGenerateProfilePdf = async () => {
    const element = profileRef.current;
    if (!element || !student) {
        toast({ variant: 'destructive', title: 'Could not find profile to generate PDF.' });
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

        let finalWidth = pdfWidth;
        let finalHeight = finalWidth / ratio;
        
        if (finalHeight > pdfHeight) {
            finalHeight = pdfHeight;
            finalWidth = finalHeight * ratio;
        }

        const xOffset = (pdfWidth - finalWidth) / 2;
        const yOffset = (pdfHeight - finalHeight) / 2;

        pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight);
        pdf.save(`Career-Profile-${student.name}.pdf`);

    } catch (error) {
        console.error("Error generating PDF: ", error);
        toast({ variant: 'destructive', title: 'Failed to generate PDF.' });
    } finally {
        setIsGeneratingPdf(false);
    }
  };


  const handleUpdateStudent = async () => {
    if (!studentId || !db) return;
    setIsUpdating(true);
    try {
        const studentRef = doc(db, 'admissions', studentId);

        const dobValue = editableStudent.dob;

        if (!dobValue) {
            toast({ variant: 'destructive', title: "Validation Error", description: "Date of Birth cannot be empty." });
            setIsUpdating(false);
            return;
        }

        const potentialDate = (dobValue as any).toDate?.() ?? new Date(dobValue as any);

        if (!isValid(potentialDate)) {
            toast({
                variant: 'destructive',
                title: 'Invalid Date',
                description: 'Please enter a valid date of birth in YYYY-MM-DD format.'
            });
            setIsUpdating(false);
            return;
        }

        const dataToUpdate = { ...editableStudent, dob: potentialDate };

        await updateDoc(studentRef, dataToUpdate);

        setStudent(prev => {
            if (!prev) return null;
            return {
                ...prev,
                ...editableStudent,
                dob: { toDate: () => potentialDate }
            } as Student;
        });

        toast({ title: "Success", description: "Student details updated." });
    } catch (error) {
        console.error("Update error: ", error);
        toast({ variant: 'destructive', title: "Error", description: "Failed to update student." });
    } finally {
        setIsUpdating(false);
        setEditDialogOpen(false);
    }
  }


  const handleDeleteStudent = async () => {
      if (!studentId || !db) return;
      try {
        await deleteDoc(doc(db, 'admissions', studentId));
        toast({ title: "Student Removed", description: "Student record has been deleted." });
        router.push('/admin/admissions');
      } catch (error) {
        toast({ variant: 'destructive', title: "Error", description: "Failed to remove student." });
      }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setEditableStudent(prev => ({ ...prev, [id]: value }));
  };


  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/4" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full col-span-1 lg:col-span-3" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!student) {
    return null;
  }
  
  const totalBilled = bills.reduce((sum, bill) => sum + bill.total, 0);
  const totalPaid = bills.filter(b => b.status === 'paid').reduce((sum, bill) => sum + bill.total, 0);
  const amountDue = totalBilled - totalPaid;

  const DetailRow = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | undefined }) => (
    <div className="flex items-start gap-3">
        <div className="bg-muted rounded-full p-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="text-sm font-semibold">{value || 'N/A'}</p>
        </div>
    </div>
  )

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
            </Button>
            <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setEditableStudent(student); setEditDialogOpen(true); }}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
                <Button variant="secondary" onClick={() => setProfileDialogOpen(true)}>
                    <Download className="mr-2 h-4 w-4" /> Download Profile
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <Button variant="destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Remove Student
                       </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently remove the student's record. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteStudent} className="bg-destructive hover:bg-destructive/90">Continue</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>

       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><User /> Personal Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-4">
                        {student.photoDataUri ? (
                            <Image src={student.photoDataUri} alt="Student photo" width={80} height={80} className="rounded-md border p-1" />
                        ) : (
                            <div className="w-20 h-20 rounded-md border p-1 bg-muted flex items-center justify-center">
                                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                            </div>
                        )}
                        {student.signatureDataUri ? (
                            <Image src={student.signatureDataUri} alt="Student signature" width={80} height={80} className="rounded-md border p-1 object-contain" />
                        ) : (
                            <div className="w-20 h-20 rounded-md border p-1 bg-muted flex items-center justify-center">
                                <FileBadge className="h-8 w-8 text-muted-foreground" />
                            </div>
                        )}
                    </div>
                    <DetailRow icon={User} label="Student Name" value={student.name} />
                    <DetailRow icon={User} label="Father's Name" value={student.fatherName} />
                    <DetailRow icon={Calendar} label="Date of Birth" value={student.dob ? format(student.dob.toDate(), 'PPP') : 'N/A'} />
                    <DetailRow icon={VenetianMask} label="Sex" value={student.sex} />
                    <DetailRow icon={Landmark} label="Nationality" value={student.nationality} />
                    <DetailRow icon={Mail} label="Email" value={student.email} />
                    <DetailRow icon={Phone} label="Phone Number" value={student.phone} />
                    <DetailRow icon={Home} label="Address" value={student.address} />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><GraduationCap /> Academic Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <DetailRow icon={Hash} label="Serial No." value={student.slNo} />
                    <DetailRow icon={Calendar} label="Session" value={student.session} />
                    <DetailRow icon={BookOpen} label="Course Applied For" value={student.courseAppliedFor} />
                    <DetailRow icon={Calendar} label="Admission Date" value={format(student.createdAt.toDate(), 'PPP')} />
                </CardContent>
            </Card>
            <Card className="md:col-span-2 lg:col-span-1">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Receipt /> Billing Overview</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-2 bg-muted/50 rounded-lg">
                        <p className="text-xs font-medium text-muted-foreground">Total Billed</p>
                        <p className="text-xl font-bold">₹{totalBilled.toFixed(2)}</p>
                    </div>
                    <div className="p-2 bg-muted/50 rounded-lg">
                        <p className="text-xs font-medium text-muted-foreground">Total Paid</p>
                        <p className="text-xl font-bold text-green-500">₹{totalPaid.toFixed(2)}</p>
                    </div>
                    <div className="p-2 bg-muted/50 rounded-lg col-span-2">
                        <p className="text-xs font-medium text-muted-foreground">Amount Due</p>
                        <p className="text-xl font-bold text-red-500">₹{amountDue.toFixed(2)}</p>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" onClick={() => router.push(`/admin/billing?studentId=${student.uid}&studentName=${student.name}&studentEmail=${student.email}`)}>Generate New Bill</Button>
                </CardFooter>
            </Card>
            <Card className="md:col-span-2 lg:col-span-3">
                <CardHeader>
                    <CardTitle>Educational Qualifications</CardTitle>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Examination</TableHead>
                                <TableHead>Board</TableHead>
                                <TableHead>Passing Year</TableHead>
                                <TableHead>Division</TableHead>
                                <TableHead>% Marks</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {student.qualifications?.length ? (
                                student.qualifications.map((q, i) => (
                                <TableRow key={i}>
                                    <TableCell>{q.examination}</TableCell>
                                    <TableCell>{q.board}</TableCell>
                                    <TableCell>{q.passingYear}</TableCell>
                                    <TableCell>{q.division}</TableCell>
                                    <TableCell>{q.percentage}</TableCell>
                                </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center">No qualification details provided.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
       </div>

        <Card>
            <CardHeader>
                <CardTitle>Invoice History</CardTitle>
                <CardDescription>All bills generated for {student.name}.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Bill #</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Payment Method</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {bills.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center h-24">No bills found for this student.</TableCell>
                        </TableRow>
                        ) : (
                        bills.map(bill => (
                            <TableRow key={bill.id}>
                            <TableCell>{format(bill.createdAt.toDate(), 'PPP')}</TableCell>
                            <TableCell className="font-mono">{bill.billNumber}</TableCell>
                            <TableCell>
                                <Badge variant={bill.status === 'paid' ? 'default' : 'destructive'} className={bill.status === 'paid' ? 'bg-green-600' : ''}>
                                {bill.status}
                                </Badge>
                            </TableCell>
                            <TableCell>{bill.paymentMethod ? bill.paymentMethod.toUpperCase() : 'N/A'}</TableCell>
                            <TableCell className="text-right font-medium">₹{bill.total.toFixed(2)}</TableCell>
                            </TableRow>
                        ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

        <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Student Details</DialogTitle>
                    <DialogDescription>Make changes to the student's information here. Click save when you're done.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="slNo" className="text-right">Sl. No.</Label>
                        <Input id="slNo" value={editableStudent.slNo} onChange={handleInputChange} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="session" className="text-right">Session</Label>
                        <Input id="session" value={editableStudent.session} onChange={handleInputChange} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Name</Label>
                        <Input id="name" value={editableStudent.name} onChange={handleInputChange} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="fatherName" className="text-right">Father's Name</Label>
                        <Input id="fatherName" value={editableStudent.fatherName} onChange={handleInputChange} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">Email</Label>
                        <Input id="email" value={editableStudent.email} readOnly className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="phone" className="text-right">Phone</Label>
                        <Input id="phone" value={editableStudent.phone} onChange={handleInputChange} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="dob" className="text-right">DOB</Label>
                        <Input id="dob" type="date" value={
                            editableStudent.dob 
                            ? format(
                                (editableStudent.dob as any).toDate?.() ?? new Date(editableStudent.dob as any), 
                                'yyyy-MM-dd'
                              ) 
                            : ''
                        } onChange={handleInputChange} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="sex" className="text-right">Sex</Label>
                        <Input id="sex" value={editableStudent.sex} onChange={handleInputChange} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="nationality" className="text-right">Nationality</Label>
                        <Input id="nationality" value={editableStudent.nationality} onChange={handleInputChange} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="address" className="text-right">Address</Label>
                        <Input id="address" value={editableStudent.address} onChange={handleInputChange} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="courseAppliedFor" className="text-right">Course</Label>
                        <Input id="courseAppliedFor" value={editableStudent.courseAppliedFor} onChange={handleInputChange} className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleUpdateStudent} disabled={isUpdating}>{isUpdating ? "Saving..." : "Save Changes"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog open={isProfileDialogOpen} onOpenChange={setProfileDialogOpen}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Student Profile</DialogTitle>
                    <DialogDescription>
                        PDF preview of {student.name}'s full profile.
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[70vh] overflow-y-auto p-1">
                    <div ref={profileRef}>
                        <CareerProfilePreview student={student} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="secondary" onClick={() => setProfileDialogOpen(false)}>Close</Button>
                    <Button onClick={handleGenerateProfilePdf} disabled={isGeneratingPdf}>
                        {isGeneratingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Download PDF
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
