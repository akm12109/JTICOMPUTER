
'use client';
import { useEffect, useState, useRef } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db_secondary as db } from '@/lib/firebase';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Download, Eye, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EnquiryPreview } from '@/components/enquiry-preview';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Input } from '@/components/ui/input';
import * as XLSX from 'xlsx';

type Enquiry = {
  id: string;
  name: string;
  fatherName: string;
  email: string;
  phone: string;
  courseAppliedFor: string;
  enquiryDate: { toDate: () => Date };
  dob: { toDate: () => Date };
  slNo?: number;
  [key: string]: any;
};

const DetailRow = ({ label, value }: { label: string, value: string | undefined }) => (
    <div className="text-sm">
        <p className="font-semibold text-muted-foreground">{label}:</p>
        <p>{value || 'N/A'}</p>
    </div>
);


export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [filteredEnquiries, setFilteredEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [firebaseConfigured, setFirebaseConfigured] = useState(true);
  const { toast } = useToast();
  
  const [isPreviewOpen, setPreviewOpen] = useState(false);
  const [enquiryToPreview, setEnquiryToPreview] = useState<Enquiry | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const enquiryRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');


  useEffect(() => {
    const fetchEnquiries = async () => {
      if (!db) {
        setFirebaseConfigured(false);
        setLoading(false);
        return;
      }
      try {
        const q = query(collection(db, 'enquiries'), orderBy('enquiryDate', 'desc'));
        const querySnapshot = await getDocs(q);
        const enquiriesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Enquiry[];
        setEnquiries(enquiriesData);
        setFilteredEnquiries(enquiriesData);
      } catch (error) {
        console.error("Error fetching enquiries: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEnquiries();
  }, []);

  useEffect(() => {
    const results = enquiries.filter(enquiry =>
      enquiry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.courseAppliedFor.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEnquiries(results);
  }, [searchTerm, enquiries]);

  const handleExport = () => {
    setIsExporting(true);
    const dataToExport = enquiries.map(enq => {
      const { enquiryDate, dob, ...rest } = enq;
      return {
        ...rest,
        enquiryDate: enquiryDate ? format(enquiryDate.toDate(), 'yyyy-MM-dd HH:mm:ss') : 'N/A',
        dob: dob ? format(dob.toDate(), 'yyyy-MM-dd') : 'N/A'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Enquiries");
    XLSX.writeFile(workbook, "enquiries_export.xlsx");
    setIsExporting(false);
  };

  const handleGeneratePdf = async () => {
    const element = enquiryRef.current;
    if (!element || !enquiryToPreview) {
        toast({ variant: 'destructive', title: 'Could not find enquiry to generate PDF.' });
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

        let finalWidth = pdfWidth - 20;
        let finalHeight = finalWidth / ratio;

        if (finalHeight > pdfHeight - 20) {
            finalHeight = pdfHeight - 20;
            finalWidth = finalHeight * ratio;
        }

        const xOffset = (pdfWidth - finalWidth) / 2;
        const yOffset = 10;

        pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight);
        pdf.save(`Enquiry-Form-${enquiryToPreview.name}.pdf`);

    } catch (error) {
        console.error("Error generating PDF: ", error);
        toast({ variant: 'destructive', title: 'Failed to generate PDF.' });
    } finally {
        setIsGeneratingPdf(false);
    }
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
    <>
        <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Course Enquiries</CardTitle>
              <CardDescription>List of all enquiries submitted through the form.</CardDescription>
            </div>
            <Button onClick={handleExport} disabled={isExporting || enquiries.length === 0}>
              {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              {isExporting ? 'Exporting...' : 'Export All'}
            </Button>
        </CardHeader>
        <CardContent>
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                placeholder="Search by name, email, or course..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                />
            </div>
            {loading ? (
            <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
            ) : (
                filteredEnquiries.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                        {searchTerm ? 'No matching enquiries found.' : 'No enquiries yet.'}
                    </p>
                ) : (
                    <Accordion type="single" collapsible className="w-full">
                        {filteredEnquiries.map((enquiry) => (
                            <AccordionItem value={enquiry.id} key={enquiry.id}>
                                <AccordionTrigger>
                                    <div className="flex justify-between w-full pr-4">
                                        <div className="text-left">
                                            <p className="font-medium">{enquiry.name} <span className="text-sm font-normal text-muted-foreground">(#{enquiry.slNo})</span></p>
                                            <p className="text-sm text-muted-foreground">{enquiry.courseAppliedFor}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm text-muted-foreground self-center">
                                                {format(enquiry.enquiryDate.toDate(), 'PP')}
                                            </p>
                                            <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setEnquiryToPreview(enquiry); setPreviewOpen(true);}}>
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="p-4 bg-muted/50 rounded-md">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <DetailRow label="Father's Name" value={enquiry.fatherName} />
                                        <DetailRow label="Email" value={enquiry.email} />
                                        <DetailRow label="Phone" value={enquiry.phone} />
                                        <DetailRow label="Date of Birth" value={format(enquiry.dob.toDate(), 'PPP')} />
                                        <DetailRow label="Gender" value={enquiry.gender} />
                                        <DetailRow label="Category" value={enquiry.category} />
                                        <DetailRow label="Nationality" value={enquiry.nationality} />
                                        <DetailRow label="Highest Qualification" value={enquiry.qualification} />
                                        <DetailRow label="Preferred Batch Time" value={enquiry.batchTime} />
                                        <div className="md:col-span-2">
                                            <DetailRow label="Current Address" value={enquiry.currentAddress} />
                                        </div>
                                        <div className="md:col-span-2">
                                            <DetailRow label="Permanent Address" value={enquiry.permanentAddress} />
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                )
            )}
        </CardContent>
        </Card>

        <Dialog open={isPreviewOpen} onOpenChange={setPreviewOpen}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Enquiry Preview</DialogTitle>
                    <DialogDescription>
                        PDF preview of {enquiryToPreview?.name}'s enquiry form.
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[70vh] overflow-y-auto p-1">
                    <div ref={enquiryRef}>
                        {enquiryToPreview && <EnquiryPreview enquiry={{...enquiryToPreview, enquiryDate: enquiryToPreview.enquiryDate.toDate()}} />}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="secondary" onClick={() => setPreviewOpen(false)}>Close</Button>
                    <Button onClick={handleGeneratePdf} disabled={isGeneratingPdf}>
                        {isGeneratingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Download PDF
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </>
  );
}
