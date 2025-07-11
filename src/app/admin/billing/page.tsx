

'use client';

import React, { useEffect, useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { collection, getDocs, query, runTransaction, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Printer, Loader2, Save, ChevronsUpDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import JtiLogo from '@/components/jti-logo';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

type Admission = {
  uid: string;
  name: string;
  fatherName: string;
  email: string;
  phone: string;
  courseAppliedFor: string;
  session?: string;
  slNo?: string;
};

const receiptSchema = z.object({
  studentId: z.string().optional(),
  studentName: z.string().min(2, { message: 'Name is required' }),
  sonDaughterWifeOf: z.string().min(2, { message: "Father/Husband's name is required" }),
  rollNo: z.string().optional(),
  courseName: z.string().min(2, { message: 'Course is required' }),
  contactNo: z.string().optional(),
  session: z.string().min(4, { message: 'Session is required' }),
  
  feeType: z.enum(['Admission', 'Tution', 'Examination', 'Certification', 'Others']),
  feeForMonths: z.string().optional(),
  amount: z.coerce.number().positive({ message: 'Amount must be a positive number.' }),
  amountInWords: z.string().min(3, { message: "Amount in words is required." }),
  paymentMethod: z.enum(['Cash', 'DD', 'Cheque', 'UPI']),
});

type ReceiptFormValues = z.infer<typeof receiptSchema>;

interface ReceiptDetails extends ReceiptFormValues {
  date: string;
  receiptNo: string;
}

const ReceiptPreview = ({ receipt }: { receipt: ReceiptDetails }) => (
    <div className="p-4 bg-yellow-100 text-black font-serif border-2 border-black">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
            <div className="flex-shrink-0">
                <JtiLogo size="large" />
            </div>
            <div className="text-right text-xs flex-grow">
                <p className="font-bold">Estd.:2001</p>
                <p className="font-bold">Reg. No.-U72900JH2001PTC012042</p>
            </div>
        </div>
        <div className="text-center mb-4">
            <h1 className="text-2xl font-bold tracking-wider">JTI COMPUTER EDUCATION</h1>
            <p className="text-xs font-bold">EDUCATION & TRAINING DIVISION, JHARKHAND TECHNICAL INSTITUTE (P) LTD</p>
            <p className="text-xs">H.O.- KUSHWAHA SADAN, PAKUR ROAD, GODDA</p>
            <p className="text-xs">GAYTRI NAGAR, NAHAR CHOWK, GODDA</p>
        </div>

        {/* Body */}
        <div className="relative border-y-2 border-dashed border-gray-400 py-2 my-2">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black text-white px-4 py-1 text-lg font-bold">RECEIPT</div>
            <div className="flex justify-between text-sm">
                <p>Receipt No.: <span className="font-semibold">{receipt.receiptNo}</span></p>
                <p>Date: <span className="font-semibold">{receipt.date}</span></p>
            </div>
        </div>

        <div className="mt-4 space-y-2 text-sm">
            <div className="flex">
                <span className="w-40 shrink-0">Mr/Ms/Mrs:</span>
                <span className="border-b border-dotted border-black flex-grow font-semibold">{receipt.studentName}</span>
            </div>
            <div className="flex">
                <span className="w-40 shrink-0">Son/Daughter/Wife of:</span>
                <span className="border-b border-dotted border-black flex-grow font-semibold">{receipt.sonDaughterWifeOf}</span>
            </div>
            <div className="flex">
                <div className="flex w-1/2 pr-2">
                    <span className="w-24 shrink-0">Roll No.:</span>
                    <span className="border-b border-dotted border-black flex-grow font-semibold">{receipt.rollNo}</span>
                </div>
                 <div className="flex w-1/2 pl-2">
                    <span className="w-28 shrink-0">Course Name:</span>
                    <span className="border-b border-dotted border-black flex-grow font-semibold">{receipt.courseName}</span>
                </div>
            </div>
             <div className="flex">
                <div className="flex w-1/2 pr-2">
                    <span className="w-24 shrink-0">Contact No.:</span>
                    <span className="border-b border-dotted border-black flex-grow font-semibold">{receipt.contactNo}</span>
                </div>
                 <div className="flex w-1/2 pl-2">
                    <span className="w-28 shrink-0">Session:</span>
                    <span className="border-b border-dotted border-black flex-grow font-semibold">{receipt.session}</span>
                </div>
            </div>
             <p className="pt-2">
                Paid the {receipt.feeType} Fee for the month of 
                <span className="font-semibold px-2 inline-block border-b border-dotted border-black min-w-[100px] text-center">{receipt.feeForMonths}</span>
                By {receipt.paymentMethod}.
            </p>

             <div className="flex pt-2">
                <span className="w-40 shrink-0">Amount in Words:</span>
                <span className="border-b border-dotted border-black flex-grow font-semibold">{receipt.amountInWords}</span>
            </div>
             <div className="flex items-center">
                <div className="border border-black p-2 w-48 mt-2">
                    Rs. <span className="font-bold text-lg ml-4">{receipt.amount.toFixed(2)}</span> Only
                </div>
            </div>
        </div>

        {/* Footer */}
         <div className="flex justify-between mt-6 pt-2 text-xs">
            <div>
                <p className="mb-8">Student Signature</p>
                 <div className="font-bold">Note:-</div>
                <ol className="list-decimal list-inside">
                    <li>Fee must be paid the first week of the Month.</li>
                    <li>Fee once paid not refundable under any circumstance whatsoever.</li>
                    <li>This receipt must be produced when demanded.</li>
                </ol>
            </div>
            <div className="self-end">
                <p className="mt-8 pt-4 border-t border-black">Received by</p>
            </div>
        </div>
    </div>
);


export default function BillingPage() {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [firebaseConfigured, setFirebaseConfigured] = useState(true);
  const [receiptData, setReceiptData] = useState<ReceiptDetails | null>(null);
  const [receiptToSave, setReceiptToSave] = useState<any | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const componentToPrintRef = useRef<HTMLDivElement>(null);

  const handlePrint = async () => {
    const element = componentToPrintRef.current;
    if (!element) {
        toast({ variant: 'destructive', title: 'Could not find receipt to print.' });
        return;
    }
    setIsPrinting(true);
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
        
        const pdfBlob = pdf.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        window.open(url, '_blank');

    } catch (error) {
        console.error("Error generating PDF: ", error);
        toast({ variant: 'destructive', title: 'Failed to generate PDF.' });
    } finally {
        setIsPrinting(false);
    }
  };

  const form = useForm<ReceiptFormValues>({
    resolver: zodResolver(receiptSchema),
    defaultValues: {
      studentName: '',
      sonDaughterWifeOf: '',
      rollNo: '',
      courseName: '',
      contactNo: '',
      session: '',
      amount: 0,
      amountInWords: '',
      paymentMethod: 'Cash',
      feeType: 'Tution',
    },
  });

  useEffect(() => {
    const studentId = searchParams.get('studentId');
    if (studentId) {
      const student = admissions.find(s => s.uid === studentId);
       if (student) {
         form.setValue('studentId', student.uid);
         form.setValue('studentName', student.name);
         form.setValue('sonDaughterWifeOf', student.fatherName || '');
         form.setValue('rollNo', student.slNo || '');
         form.setValue('courseName', student.courseAppliedFor || '');
         form.setValue('contactNo', student.phone || '');
         form.setValue('session', student.session || '');
       }
    }
  }, [searchParams, form, admissions]);

  useEffect(() => {
    const fetchAdmissions = async () => {
      if (!db) {
        setFirebaseConfigured(false);
        setLoading(false);
        return;
      }
      try {
        const q = query(collection(db, 'admissions'));
        const querySnapshot = await getDocs(q);
        const admissionsData = querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }) as Admission);
        setAdmissions(admissionsData);
      } catch (error) {
        console.error("Error fetching admissions: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAdmissions();
  }, []);
  
  const handleGeneratePreview = async (values: ReceiptFormValues) => {
    if (!db) return;
    const counterRef = doc(db, 'counters', 'receiptCounter');
    
    try {
        const newReceiptNo = await runTransaction(db, async (transaction) => {
            const counterDoc = await transaction.get(counterRef);
            const lastReceiptNo = counterDoc.exists() ? counterDoc.data().lastNo : 1400; // Start from 1400 if not exists
            return lastReceiptNo + 1;
        });

        // For Firestore
        const dbDoc = {
          receiptNo: newReceiptNo.toString(),
          ...values,
          createdAt: serverTimestamp(),
        };
        setReceiptToSave(dbDoc);

        // For Preview
        setReceiptData({
          ...values,
          receiptNo: newReceiptNo.toString(),
          date: new Date().toLocaleDateString('en-GB'),
        });

    } catch (error) {
       console.error("Error generating receipt number: ", error);
       toast({ variant: 'destructive', title: "Failed to generate receipt number." });
    }
  };

  const handleSaveReceipt = async () => {
    if (!receiptToSave || !db) {
      toast({ variant: 'destructive', title: 'Could not save receipt.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const counterRef = doc(db, 'counters', 'receiptCounter');
      
      await runTransaction(db, async (transaction) => {
          transaction.set(doc(collection(db, "receipts")), receiptToSave);
          transaction.set(counterRef, { lastNo: parseInt(receiptToSave.receiptNo) }, { merge: true });
      });

      toast({ title: "Receipt saved successfully!", description: "The receipt has been saved to the database." });
      form.reset({
          studentName: '',
          sonDaughterWifeOf: '',
          rollNo: '',
          courseName: '',
          contactNo: '',
          session: '',
          amount: 0,
          amountInWords: '',
          paymentMethod: 'Cash',
          feeType: 'Tution',
          feeForMonths: '',
      });
      setReceiptData(null);
      setReceiptToSave(null);
    } catch(e) {
      console.error("Error saving receipt: ", e);
      toast({ variant: 'destructive', title: "Failed to save receipt.", description: "Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!firebaseConfigured) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Firebase Not Configured</AlertTitle>
        <AlertDescription>
          The backend is not configured correctly. Please provide Firebase credentials.
        </AlertDescription>
      </Alert>
    );
  }

  const studentNameValue = form.watch("studentName");

  const filteredAdmissions = studentNameValue
    ? admissions.filter((s) =>
        s.name.toLowerCase().includes(studentNameValue.toLowerCase())
      )
    : admissions;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <Card>
        <CardHeader>
          <CardTitle>Receipt Generator</CardTitle>
          <CardDescription>Create receipts that match the physical copy.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="space-y-4"> <Skeleton className="h-10 w-full" /> <Skeleton className="h-10 w-full" /> <Skeleton className="h-24 w-full" /> <Skeleton className="h-10 w-full" /> </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleGeneratePreview)} className="space-y-6">
                
                <FormItem className="flex flex-col">
                  <FormLabel>Student</FormLabel>
                  <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className={cn("w-full justify-between font-normal", !form.watch('studentName') && "text-muted-foreground")}>
                          {form.watch('studentName') || "Select or enter a student name"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                       <Input
                          placeholder="Search for a student..."
                          value={form.watch("studentName")}
                          onChange={(e) => {
                            form.setValue('studentName', e.target.value);
                            form.setValue('studentId', undefined);
                          }}
                          className="m-2 w-[calc(100%-1rem)]"
                        />
                        <div className="max-h-60 overflow-y-auto">
                          {filteredAdmissions.length > 0 ? (
                            filteredAdmissions.map((admission) => (
                            <div key={admission.uid} onClick={() => {
                                form.setValue("studentId", admission.uid);
                                form.setValue("studentName", admission.name);
                                form.setValue("sonDaughterWifeOf", admission.fatherName || '');
                                form.setValue("rollNo", admission.slNo || '');
                                form.setValue("courseName", admission.courseAppliedFor || '');
                                form.setValue("contactNo", admission.phone || '');
                                form.setValue("session", admission.session || '');
                                setPopoverOpen(false);
                            }} className="text-sm p-2 hover:bg-accent cursor-pointer">
                                {admission.name} ({admission.email})
                              </div>
                            ))
                          ) : (
                            <p className="p-2 text-center text-sm text-muted-foreground">No students found.</p>
                          )}
                        </div>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>

                <FormField control={form.control} name="sonDaughterWifeOf" render={({ field }) => ( <FormItem><FormLabel>Son/Daughter/Wife of</FormLabel><FormControl><Input placeholder="Father's Name" {...field} /></FormControl><FormMessage /></FormItem> )} />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="rollNo" render={({ field }) => ( <FormItem><FormLabel>Roll No.</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="contactNo" render={({ field }) => ( <FormItem><FormLabel>Contact No.</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="courseName" render={({ field }) => ( <FormItem><FormLabel>Course Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="session" render={({ field }) => ( <FormItem><FormLabel>Session</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
                
                <Separator />
                
                <FormField
                  control={form.control}
                  name="feeType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fee Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a fee type" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Admission">Admission</SelectItem>
                                <SelectItem value="Tution">Tution</SelectItem>
                                <SelectItem value="Examination">Examination</SelectItem>
                                <SelectItem value="Certification">Certification</SelectItem>
                                <SelectItem value="Others">Others</SelectItem>
                            </SelectContent>
                        </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField control={form.control} name="feeForMonths" render={({ field }) => ( <FormItem><FormLabel>For Month(s)</FormLabel><FormControl><Input placeholder="e.g., June or June-July" {...field} /></FormControl><FormMessage /></FormItem> )} />
                
                <div className="grid grid-cols-2 gap-4">
                   <FormField control={form.control} name="amount" render={({ field }) => ( <FormItem><FormLabel>Amount (Rs.)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                   <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Method</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Cash">Cash</SelectItem>
                              <SelectItem value="DD">DD</SelectItem>
                              <SelectItem value="Cheque">Cheque</SelectItem>
                              <SelectItem value="UPI">UPI</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                 
                 <FormField 
                    control={form.control} 
                    name="amountInWords" 
                    render={({ field }) => ( 
                        <FormItem>
                            <FormLabel>Amount in Words</FormLabel>
                            <FormControl><Input placeholder="e.g., Five Hundred" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem> 
                    )} 
                />


                <Button type="submit" className="w-full">
                  Generate Preview
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
      
      <Card className="sticky top-24">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Receipt Preview</CardTitle>
              <CardDescription>Review the receipt before saving or printing.</CardDescription>
            </div>
            {receiptData && (
              <Button onClick={handlePrint} variant="secondary" disabled={isPrinting}>
                {isPrinting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                {isPrinting ? 'Generating PDF...' : 'Print / Download'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {receiptData ? (
            <>
              <div ref={componentToPrintRef}>
                <ReceiptPreview receipt={receiptData} />
              </div>
              <Button onClick={handleSaveReceipt} disabled={isSubmitting || isPrinting} className="w-full mt-4">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save className="mr-2 h-4 w-4"/> Save Receipt</>}
              </Button>
            </>
          ) : (
            <div className="flex items-center justify-center h-96 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">Fill out the form to see a receipt preview</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
