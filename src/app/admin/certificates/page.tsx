// src/app/admin/certificates/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Trash2, FileText, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { format, isValid } from 'date-fns';

const certificateSchema = z.object({
  serialNo: z.string().min(1, "Serial No. is required."),
  registrationNo: z.string().min(1, "Registration No. is required.").refine(val => !val.includes('/'), "Registration number cannot contain slashes."),
  studentName: z.string().min(2, "Student name is required."),
  guardianName: z.string().min(2, "Guardian name is required."),
  courseName: z.string().min(2, "Course name is required."),
  duration: z.string().min(1, "Duration is required."),
  grade: z.string().min(1, "Grade is required."),
  issueDate: z.string().min(1, "Issue date is required."),
  place: z.string().min(2, "Place is required."),
});

type CertificateFormValues = z.infer<typeof certificateSchema>;

type Certificate = CertificateFormValues & {
  id: string;
  issueDate: { toDate: () => Date }; // Changed to match Firestore timestamp
  createdAt: { toDate: () => Date };
};

export default function CertificatesPage() {
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const form = useForm<CertificateFormValues>({
        resolver: zodResolver(certificateSchema),
        defaultValues: {
            serialNo: "",
            registrationNo: "",
            studentName: "",
            guardianName: "",
            courseName: "DIPLOMA IN COMPUTER PROGRAMMING (DCP)",
            duration: "06TH MONTHS",
            grade: "A+",
            issueDate: new Date().toISOString().split('T')[0],
            place: "GODDA",
        },
    });

    useEffect(() => {
        const fetchCertificates = async () => {
            if (!db) return;
            setLoading(true);
            try {
                const q = query(collection(db, 'certificates'), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Certificate[];
                setCertificates(items);
            } catch (error) {
                console.error("Error fetching certificates: ", error);
                toast({ variant: 'destructive', title: 'Error fetching certificates.' });
            } finally {
                setLoading(false);
            }
        };
        fetchCertificates();
    }, [toast]);
    
    const onSubmit = async (values: CertificateFormValues) => {
        setIsSubmitting(true);
        
        try {
            const docRef = await addDoc(collection(db, "certificates"), {
                ...values,
                issueDate: new Date(values.issueDate),
                createdAt: serverTimestamp(),
            });
            
            // Optimistically add to UI, ensuring types match
            const newCertForUI: Certificate = {
                ...values,
                id: docRef.id,
                issueDate: { toDate: () => new Date(values.issueDate) },
                createdAt: { toDate: () => new Date() }
            };

            setCertificates(prev => [newCertForUI, ...prev]);

            toast({ title: 'Certificate Added!', description: `Certificate for ${values.studentName} has been saved.` });
            form.reset();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDelete = async (certificate: Certificate) => {
        if (!db) return;
        
        const originalCertificates = [...certificates];
        setCertificates(prev => prev.filter(c => c.id !== certificate.id));

        try {
            await deleteDoc(doc(db, 'certificates', certificate.id));
            toast({ title: 'Certificate Deleted', description: `${certificate.studentName}'s certificate has been removed.` });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Deletion Failed', description: error.message });
            setCertificates(originalCertificates);
        }
    };

    return (
        <div className="grid gap-8 md:grid-cols-3">
            <Card className="md:col-span-1">
                <CardHeader>
                    <CardTitle>Issue New Certificate</CardTitle>
                    <CardDescription>Enter the details for a new certificate to make it verifiable.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                            <FormField name="serialNo" control={form.control} render={({ field }) => (
                                <FormItem><FormLabel>Serial No.</FormLabel><Input {...field} placeholder="e.g., 046/2023" /></FormItem>
                            )} />
                            <FormField name="registrationNo" control={form.control} render={({ field }) => (
                                <FormItem><FormLabel>Registration No.</FormLabel><Input {...field} placeholder="e.g., JTI-GOD-PRO-..." /></FormItem>
                            )} />
                       </div>
                        <FormField name="studentName" control={form.control} render={({ field }) => (
                            <FormItem><FormLabel>Student Name</FormLabel><Input {...field} placeholder="e.g., RUPESH KUMAR" /></FormItem>
                        )} />
                        <FormField name="guardianName" control={form.control} render={({ field }) => (
                            <FormItem><FormLabel>Guardian Name</FormLabel><Input {...field} placeholder="e.g., YOGENDRA MAL" /></FormItem>
                        )} />
                        <FormField name="courseName" control={form.control} render={({ field }) => (
                            <FormItem><FormLabel>Course Name</FormLabel><Input {...field} /></FormItem>
                        )} />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField name="duration" control={form.control} render={({ field }) => (
                                <FormItem><FormLabel>Duration</FormLabel><Input {...field} /></FormItem>
                            )} />
                            <FormField name="grade" control={form.control} render={({ field }) => (
                                <FormItem><FormLabel>Grade</FormLabel><Input {...field} /></FormItem>
                            )} />
                            <FormField name="issueDate" control={form.control} render={({ field }) => (
                                <FormItem><FormLabel>Issue Date</FormLabel><Input type="date" {...field} /></FormItem>
                            )} />
                            <FormField name="place" control={form.control} render={({ field }) => (
                                <FormItem><FormLabel>Place</FormLabel><Input {...field} /></FormItem>
                            )} />
                        </div>
                        
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                            {isSubmitting ? 'Saving...' : 'Save Certificate'}
                        </Button>
                    </form>
                    </Form>
                </CardContent>
            </Card>

            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle>Issued Certificates</CardTitle>
                    <CardDescription>Manage existing verifiable certificates.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto">
                    {loading ? <p>Loading...</p> : certificates.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            <FileText className="mx-auto h-12 w-12" />
                            <p className="mt-2">No certificates have been issued yet.</p>
                        </div>
                    ) : certificates.map(cert => {
                        const issueDate = cert.issueDate?.toDate ? cert.issueDate.toDate() : null;
                        return (
                            <Card key={cert.id} className="p-4 relative group flex justify-between items-center">
                                <div>
                                    <p className="font-bold">{cert.studentName}</p>
                                    <p className="text-sm text-primary">{cert.courseName}</p>
                                    <p className="text-xs text-muted-foreground">Reg No: {cert.registrationNo} | Issued: {issueDate && isValid(issueDate) ? format(issueDate, 'PPP') : 'Invalid Date'}</p>
                                </div>
                                <Button
                                    size="icon"
                                    variant="destructive"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleDelete(cert)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </Card>
                        )
                    })}
                </CardContent>
            </Card>
        </div>
    );
}
