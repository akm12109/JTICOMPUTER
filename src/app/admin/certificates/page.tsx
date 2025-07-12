// src/app/admin/certificates/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Trash2, FileText, CheckCircle, Download, Upload, FileDown, AlertTriangle, XCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { format, isValid } from 'date-fns';
import * as XLSX from 'xlsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';

const certificateSchema = z.object({
  serialNo: z.string().min(1, "Serial No. is required."),
  registrationNo: z.string().min(1, "Registration No. is required."),
  studentName: z.string().min(2, "Student name is required."),
  guardianName: z.string().min(2, "Guardian name is required."),
  courseName: z.string().min(2, "Course name is required."),
  duration: z.string().min(1, "Duration is required."),
  grade: z.string().min(1, "Grade is required."),
  issueDate: z.string().refine(val => isValid(new Date(val)), {message: "Please enter a valid date."}),
  place: z.string().min(2, "Place is required."),
});

type CertificateFormValues = z.infer<typeof certificateSchema>;

type Certificate = CertificateFormValues & {
  id: string;
  createdAt: { toDate: () => Date };
};

type BulkCertificate = CertificateFormValues & { originalRow: number };

export default function CertificatesPage() {
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [activeTab, setActiveTab] = useState('single');
    
    // Bulk state
    const [parsedData, setParsedData] = useState<BulkCertificate[]>([]);
    const [fileName, setFileName] = useState('');
    const [isProcessingBulk, setIsProcessingBulk] = useState(false);
    const [bulkResults, setBulkResults] = useState<{ successful: any[], failed: (any & { error: string })[] } | null>(null);

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
    
    const handleExport = () => {
        setIsExporting(true);
        const dataToExport = certificates.map(cert => {
          const { createdAt, id, ...rest } = cert;
          return {
            ...rest,
            createdDate: createdAt ? format(createdAt.toDate(), 'yyyy-MM-dd HH:mm:ss') : 'N/A'
          };
        });
    
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Certificates");
        XLSX.writeFile(workbook, "issued_certificates_export.xlsx");
        setIsExporting(false);
    };
    
    const issueSingleCertificate = async (values: CertificateFormValues) => {
        if (!db) throw new Error("Firebase not configured");
        try {
            const docRef = await addDoc(collection(db, "certificates"), {
                ...values,
                issueDate: new Date(values.issueDate),
                createdAt: serverTimestamp(),
            });
            return { ...values, id: docRef.id, createdAt: { toDate: () => new Date() } } as Certificate;
        } catch (error) {
            console.error("Error issuing single certificate", error);
            throw error;
        }
    };
    
    const onSingleSubmit = async (values: CertificateFormValues) => {
        setIsSubmitting(true);
        try {
            const newCert = await issueSingleCertificate(values);
            setCertificates(prev => [newCert, ...prev]);
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
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setParsedData([]);
        setBulkResults(null);

        const reader = new FileReader();
        reader.onload = (e) => {
        try {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json: any[] = XLSX.utils.sheet_to_json(worksheet, {
              cellDates: true,
              dateNF: 'yyyy-mm-dd',
            });

            const certs: BulkCertificate[] = json.map((row, index) => {
              if (row.issueDate instanceof Date) {
                row.issueDate = row.issueDate.toISOString().split('T')[0];
              }
              return {
                ...row,
                originalRow: index + 2,
              };
            });
            
            setParsedData(certs);
        } catch (error) {
            toast({ variant: 'destructive', title: 'File Read Error', description: 'Could not parse the uploaded file. Please check the format.' });
        }
        };
        reader.onerror = () => {
            toast({ variant: 'destructive', title: 'File Read Error', description: 'Failed to read the file.' });
        }
        reader.readAsArrayBuffer(file);
    };

    const handleBulkSubmit = async () => {
        if (parsedData.length === 0 || !db) return;
        setIsProcessingBulk(true);
        setBulkResults(null);

        const results = { successful: [] as any[], failed: [] as (any & { error: string })[] };
        const newCertsToUI: Certificate[] = [];

        const batch = writeBatch(db);

        for (const cert of parsedData) {
            try {
                certificateSchema.parse(cert); // Validate each row
                const certRef = doc(collection(db, "certificates"));
                batch.set(certRef, {
                    ...cert,
                    issueDate: new Date(cert.issueDate),
                    createdAt: serverTimestamp()
                });
                results.successful.push(cert);
                newCertsToUI.push({ ...cert, id: certRef.id, createdAt: { toDate: () => new Date() } });
            } catch (error: any) {
                let errorMessage = "An unknown error occurred.";
                if (error instanceof z.ZodError) {
                    errorMessage = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
                } else if (error.message) {
                    errorMessage = error.message;
                }
                results.failed.push({ ...cert, error: errorMessage });
            }
        }
        
        try {
            await batch.commit();
            setCertificates(prev => [...newCertsToUI, ...prev]);
            toast({ title: "Bulk Issue Complete", description: `${results.successful.length} certificates issued successfully.` });
        } catch(e) {
             console.error("Bulk commit failed: ", e);
             toast({ variant: 'destructive', title: "Bulk Issue Failed", description: "Could not save certificates to the database." });
             // In case of commit failure, we need to mark all as failed.
             results.failed.push(...results.successful.map(s => ({...s, error: "Database commit failed"})));
             results.successful = [];
        }

        setBulkResults(results);
        setIsProcessingBulk(false);
    };

    const downloadSampleCSV = () => {
        const headers = "serialNo,registrationNo,studentName,guardianName,courseName,duration,grade,issueDate,place";
        const example = `046/2023,JTI-GOD-PRO-046-2023,"RUPESH KUMAR","YOGENDRA MAL","DIPLOMA IN COMPUTER PROGRAMMING (DCP)","06TH MONTHS","A+",2023-12-28,"GODDA"`;
        const csvContent = `data:text/csv;charset=utf-8,${headers}\n${example}`;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "jti_bulk_certificate_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="grid gap-8 md:grid-cols-3">
            <Card className="md:col-span-1">
                <CardHeader>
                    <CardTitle>Issue Certificate(s)</CardTitle>
                    <CardDescription>Enter details for a new certificate or bulk upload a file.</CardDescription>
                </CardHeader>
                <CardContent>
                   <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="single">Single</TabsTrigger>
                            <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
                        </TabsList>
                        <TabsContent value="single" className="pt-6">
                            <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSingleSubmit)} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField name="serialNo" control={form.control} render={({ field }) => (
                                        <FormItem><FormLabel>Serial No.</FormLabel><FormControl><Input {...field} placeholder="e.g., 046/2023" /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField name="registrationNo" control={form.control} render={({ field }) => (
                                        <FormItem><FormLabel>Registration No.</FormLabel><FormControl><Input {...field} placeholder="e.g., JTI-GOD-..." /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                                <FormField name="studentName" control={form.control} render={({ field }) => (
                                    <FormItem><FormLabel>Student Name</FormLabel><FormControl><Input {...field} placeholder="e.g., RUPESH KUMAR" /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField name="guardianName" control={form.control} render={({ field }) => (
                                    <FormItem><FormLabel>Guardian Name</FormLabel><FormControl><Input {...field} placeholder="e.g., YOGENDRA MAL" /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField name="courseName" control={form.control} render={({ field }) => (
                                    <FormItem><FormLabel>Course Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField name="duration" control={form.control} render={({ field }) => (
                                        <FormItem><FormLabel>Duration</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField name="grade" control={form.control} render={({ field }) => (
                                        <FormItem><FormLabel>Grade</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField name="issueDate" control={form.control} render={({ field }) => (
                                        <FormItem><FormLabel>Issue Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField name="place" control={form.control} render={({ field }) => (
                                        <FormItem><FormLabel>Place</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                                
                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                                    {isSubmitting ? 'Saving...' : 'Save Certificate'}
                                </Button>
                            </form>
                            </Form>
                        </TabsContent>
                        <TabsContent value="bulk" className="pt-6">
                             <div className="space-y-6">
                                <Alert>
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle>Instructions for Bulk Upload</AlertTitle>
                                    <AlertDescription>
                                        <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                                            <li>Upload a CSV or XLSX file.</li>
                                            <li>The first row must be a header with exact names matching the form fields (e.g., `serialNo`, `studentName`).</li>
                                            <li>`issueDate` must be in `YYYY-MM-DD` format.</li>
                                        </ul>
                                        <Button variant="link" size="sm" onClick={downloadSampleCSV} className="p-0 h-auto mt-2">
                                        <FileDown className="mr-2" /> Download sample CSV template
                                        </Button>
                                    </AlertDescription>
                                </Alert>

                                <div className="flex items-center gap-4">
                                    <Label htmlFor="bulk-upload" className="flex-shrink-0">Upload File</Label>
                                    <Input id="bulk-upload" type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={handleFileChange} />
                                </div>
                                
                                {parsedData.length > 0 && (
                                    <div className="space-y-4">
                                        <h3 className="font-semibold">{fileName} - Data Preview ({parsedData.length} rows)</h3>
                                        <div className="max-h-60 overflow-y-auto border rounded-lg">
                                        <Table>
                                            <TableHeader className="sticky top-0 bg-muted">
                                                <TableRow><TableHead>Name</TableHead><TableHead>Reg. No.</TableHead></TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {parsedData.slice(0, 10).map((row, i) => (
                                                    <TableRow key={i}><TableCell>{row.studentName}</TableCell><TableCell>{row.registrationNo}</TableCell></TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                        </div>
                                        {parsedData.length > 10 && <p className="text-sm text-center text-muted-foreground">Showing first 10 rows...</p>}
                                        <Button onClick={handleBulkSubmit} disabled={isProcessingBulk} className="w-full">
                                        {isProcessingBulk ? <Loader2 className="animate-spin"/> : <Upload className="mr-2" />}
                                        {isProcessingBulk ? `Processing ${parsedData.length}...` : `Confirm & Issue ${parsedData.length} Certificates`}
                                        </Button>
                                    </div>
                                )}
                                
                                {bulkResults && (
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold">Import Results</h3>
                                        <Alert variant={bulkResults.failed.length > 0 ? 'destructive' : 'default'} className={bulkResults.failed.length === 0 ? 'border-green-500' : ''}>
                                            <AlertTitle className="flex items-center gap-2">
                                            {bulkResults.failed.length > 0 ? <XCircle className="text-destructive"/> : <CheckCircle className="text-green-500"/>}
                                            Processing Complete
                                            </AlertTitle>
                                            <AlertDescription>
                                                Successfully issued: {bulkResults.successful.length}. <br/>
                                                Failed: {bulkResults.failed.length}.
                                            </AlertDescription>
                                        </Alert>
                                        {bulkResults.failed.length > 0 && (
                                            <div className="max-h-60 overflow-y-auto border rounded-lg">
                                                <Table>
                                                    <TableHeader className="sticky top-0 bg-muted">
                                                        <TableRow><TableHead>Row</TableHead><TableHead>Name</TableHead><TableHead>Reason</TableHead></TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {bulkResults.failed.map((row, i) => (
                                                            <TableRow key={i} variant="destructive">
                                                                <TableCell>{row.originalRow}</TableCell>
                                                                <TableCell>{row.studentName}</TableCell>
                                                                <TableCell>{row.error}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                   </Tabs>
                </CardContent>
            </Card>

            <Card className="md:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Issued Certificates</CardTitle>
                        <CardDescription>Manage existing verifiable certificates.</CardDescription>
                    </div>
                     <Button onClick={handleExport} disabled={isExporting || certificates.length === 0}>
                        {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        {isExporting ? 'Exporting...' : 'Export All'}
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto">
                    {loading ? <p>Loading...</p> : certificates.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            <FileText className="mx-auto h-12 w-12" />
                            <p className="mt-2">No certificates have been issued yet.</p>
                        </div>
                    ) : certificates.map(cert => {
                        const issueDate = cert.issueDate ? (cert.issueDate as any).toDate ? (cert.issueDate as any).toDate() : new Date(cert.issueDate) : null;
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
