'use client';

import React, { useEffect, useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { collection, getDocs, query, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSearchParams } from 'next/navigation';
import QRCode from 'qrcode';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Printer, Loader2, PlusCircle, Trash2, ChevronsUpDown, Save } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import JtiLogo from '@/components/jti-logo';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Admission = {
  uid: string;
  name: string;
  email: string;
};

const lineItemSchema = z.object({
  description: z.string().min(3, { message: 'Description must be at least 3 characters.' }),
  amount: z.coerce.number().positive({ message: 'Amount must be a positive number.' }),
});

const billSchema = z.object({
  studentId: z.string().optional(),
  studentName: z.string().min(2, { message: 'Student name is required.' }),
  studentEmail: z.string().email({ message: "Invalid email" }).optional().or(z.literal('')),
  items: z.array(lineItemSchema).min(1, { message: 'Please add at least one bill item.' }),
  isPaid: z.boolean().default(false),
  paymentMethod: z.enum(['cash', 'upi', 'card']).optional(),
}).refine(data => {
    if (data.isPaid && !data.paymentMethod) {
        return false;
    }
    return true;
}, {
    message: "Payment method is required for paid bills.",
    path: ["paymentMethod"],
});


type BillFormValues = z.infer<typeof billSchema>;

interface BillDetails extends BillFormValues {
  date: string;
  billNumber: string;
  total: number;
}

const BillPreview = ({ bill }: { bill: BillDetails }) => {
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

    useEffect(() => {
        if (bill) {
            const billInfo = `Student: ${bill.studentName}\nEmail: ${bill.studentEmail || 'N/A'}\nBill #: ${bill.billNumber}\nTotal: ₹${bill.total.toFixed(2)}`;
            QRCode.toDataURL(billInfo, {
                errorCorrectionLevel: 'H',
                margin: 2,
                color: {
                    dark: '#0077CC', // JTI Primary Blue
                    light: '#FFFFFF'
                }
            })
            .then(url => {
                setQrCodeDataUrl(url);
            })
            .catch(err => {
                console.error("QR Code generation failed:", err);
            });
        }
    }, [bill]);

    return (
        <div className="p-8 border rounded-lg bg-white text-black font-sans">
            <div className="flex justify-between items-center pb-4 mb-4 border-b-2 border-primary">
                <div className="flex items-center gap-4">
                    <JtiLogo size="medium" />
                </div>
                <h1 className="text-4xl font-extrabold text-gray-300 uppercase tracking-widest">Invoice</h1>
            </div>
    
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div>
                    <h3 className="font-semibold mb-2 text-gray-500 text-sm uppercase">Bill To</h3>
                    <p className="font-bold text-lg">{bill.studentName}</p>
                    {bill.studentEmail && <p className="text-gray-700">{bill.studentEmail}</p>}
                </div>
                <div className="text-right">
                    <p><span className="font-semibold text-gray-500">Invoice #: </span> {bill.billNumber}</p>
                    <p><span className="font-semibold text-gray-500">Date: </span> {bill.date}</p>
                    {bill.isPaid && bill.paymentMethod ? (
                        <p><span className="font-semibold text-gray-500">Status: </span> <span className="font-bold text-green-600">PAID</span> via {bill.paymentMethod.toUpperCase()}</p>
                    ) : (
                        <p><span className="font-semibold text-gray-500">Status: </span> <span className="font-bold text-red-600">UNPAID</span></p>
                    )}
                </div>
            </div>
    
            <Table>
                <TableHeader className="bg-primary/10">
                    <TableRow>
                        <TableHead className="w-[70%] text-primary font-bold">Description</TableHead>
                        <TableHead className="text-right text-primary font-bold">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {bill.items.map((item, index) => (
                        <TableRow key={index} className="border-b-gray-100">
                            <TableCell className="font-medium py-3">{item.description}</TableCell>
                            <TableCell className="text-right font-medium">₹{item.amount.toFixed(2)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <Separator className="my-1 bg-gray-200" />
            
            <div className="mt-8 flex justify-between items-end">
                <div>
                    {qrCodeDataUrl ? (
                        <>
                            <img src={qrCodeDataUrl} alt="Bill QR Code" className="w-28 h-28 border p-1" />
                            <p className="text-xs text-gray-500 mt-1 text-center">Scan for details</p>
                        </>
                    ) : <div className="w-28 h-28 bg-gray-100 animate-pulse"></div>}
                </div>
                <div className="w-1/2">
                    <div className="flex justify-between items-center bg-gray-100 p-4 rounded-lg">
                        <span className="font-bold text-lg text-gray-700">Total</span>
                        <span className="font-bold text-2xl text-primary">₹{bill.total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
            
            <div className="mt-10 pt-4 border-t text-center text-xs text-gray-500">
                <p>Thank you for choosing Jharkhand Technical Institute!</p>
                <p>This is a computer-generated invoice and does not require a signature.</p>
            </div>
        </div>
    );
};


export default function BillingPage() {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [firebaseConfigured, setFirebaseConfigured] = useState(true);
  const [billData, setBillData] = useState<BillDetails | null>(null);
  const [billToSave, setBillToSave] = useState<any | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const componentToPrintRef = useRef<HTMLDivElement>(null);

  const handlePrint = async () => {
    const element = componentToPrintRef.current;
    if (!element) {
        toast({ variant: 'destructive', title: 'Could not find bill to print.' });
        return;
    }
    setIsPrinting(true);
    try {
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff'
        });
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

  const form = useForm<BillFormValues>({
    resolver: zodResolver(billSchema),
    defaultValues: {
      studentId: '',
      studentName: '',
      studentEmail: '',
      items: [{ description: '', amount: 0 }],
      isPaid: false,
      paymentMethod: undefined,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });

  useEffect(() => {
    const studentId = searchParams.get('studentId');
    const studentName = searchParams.get('studentName');
    const studentEmail = searchParams.get('studentEmail');
    if (studentId && studentName) {
      form.setValue('studentId', studentId);
      form.setValue('studentName', studentName);
      form.setValue('studentEmail', studentEmail || '');
    }
  }, [searchParams, form]);

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
        const admissionsData = querySnapshot.docs.map(doc => doc.data() as Admission);
        setAdmissions(admissionsData);
      } catch (error) {
        console.error("Error fetching admissions: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAdmissions();
  }, []);
  
  const handleGeneratePreview = (values: BillFormValues) => {
    const total = values.items.reduce((sum, item) => sum + item.amount, 0);
    const billNumber = `JTI-${Date.now()}`;
    
    // For Firestore
    const dbDoc = {
      billNumber,
      studentId: values.studentId || '',
      studentName: values.studentName,
      studentEmail: values.studentEmail || '',
      items: values.items,
      total,
      status: values.isPaid ? 'paid' : 'unpaid',
      paymentMethod: values.isPaid ? values.paymentMethod : null,
      createdAt: serverTimestamp(),
    };
    setBillToSave(dbDoc);

    // For Preview
    setBillData({
      ...values,
      total,
      date: new Date().toLocaleDateString('en-GB'),
      billNumber,
    });
  };

  const handleSaveBill = async () => {
    if (!billToSave || !db) {
      toast({ variant: 'destructive', title: 'Could not save bill.' });
      return;
    }
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "bills"), billToSave);
      toast({ title: "Bill saved successfully!", description: "The bill has been saved to the database." });
      form.reset({
        studentId: '',
        studentName: '',
        studentEmail: '',
        items: [{ description: '', amount: 0 }],
        isPaid: false,
        paymentMethod: undefined,
      });
      setBillData(null);
      setBillToSave(null);
    } catch(e) {
      console.error("Error saving bill: ", e);
      toast({ variant: 'destructive', title: "Failed to save bill.", description: "Please try again." });
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
  const isPaidValue = form.watch("isPaid");

  const filteredAdmissions = studentNameValue
    ? admissions.filter((s) =>
        s.name.toLowerCase().includes(studentNameValue.toLowerCase())
      )
    : admissions;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <Card>
        <CardHeader>
          <CardTitle>Advanced Bill Generator</CardTitle>
          <CardDescription>Create, preview, and save itemized bills for students.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-10 w-full" />
             </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleGeneratePreview)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="studentName"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Student</FormLabel>
                      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value || "Select or enter a student name"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                           <Input
                              placeholder="Enter or search for a student..."
                              value={field.value}
                              onChange={(e) => {
                                field.onChange(e.target.value);
                                form.setValue('studentId', undefined);
                                form.setValue('studentEmail', '');
                              }}
                              className="m-2 w-[calc(100%-1rem)]"
                            />
                            <div className="max-h-60 overflow-y-auto">
                              {filteredAdmissions.length > 0 ? (
                                filteredAdmissions.map((admission) => (
                                <div
                                    key={admission.uid}
                                    onClick={() => {
                                      form.setValue("studentId", admission.uid);
                                      form.setValue("studentName", admission.name);
                                      form.setValue("studentEmail", admission.email);
                                      setPopoverOpen(false);
                                    }}
                                    className="text-sm p-2 hover:bg-accent cursor-pointer"
                                  >
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
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="studentEmail"
                  render={({ field }) => (
                  <FormItem>
                      <FormLabel>Student Email (optional)</FormLabel>
                      <FormControl>
                      <Input placeholder="Auto-filled if student is selected from list" {...field} disabled={!!form.watch('studentId')} />
                      </FormControl>
                      <FormMessage />
                  </FormItem>
                  )}
                />
                
                <div>
                    <FormLabel>Bill Items</FormLabel>
                    <div className="space-y-2 mt-2">
                        {fields.map((item, index) => (
                           <div key={item.id} className="flex gap-2 items-start">
                             <FormField
                                control={form.control}
                                name={`items.${index}.description`}
                                render={({ field }) => (
                                    <FormItem className="flex-grow">
                                    <FormControl>
                                        <Input placeholder="Item Description (e.g. Tuition Fee)" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`items.${index}.amount`}
                                render={({ field }) => (
                                    <FormItem>
                                    <FormControl>
                                        <Input type="number" placeholder="Amount" {...field} className="w-32" />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                              />
                              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                           </div>
                        ))}
                    </div>
                    <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append({ description: '', amount: 0 })}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Item
                    </Button>
                </div>

                <FormField
                  control={form.control}
                  name="isPaid"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Mark as Paid</FormLabel>
                        <FormDescription>
                          Check this if the student has already paid this bill.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {isPaidValue && (
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Payment Method</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Select a payment method" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="upi">UPI</SelectItem>
                                <SelectItem value="card">Card</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

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
              <CardTitle>Bill Preview</CardTitle>
              <CardDescription>Review the bill before saving or printing.</CardDescription>
            </div>
            {billData && (
              <Button onClick={handlePrint} variant="secondary" disabled={isPrinting}>
                {isPrinting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                {isPrinting ? 'Generating PDF...' : 'Print / Download'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {billData ? (
            <>
              <div ref={componentToPrintRef}>
                <BillPreview bill={billData} />
              </div>
              <Button onClick={handleSaveBill} disabled={isSubmitting || isPrinting} className="w-full mt-4">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save className="mr-2 h-4 w-4"/> Save Bill</>}
              </Button>
            </>
          ) : (
            <div className="flex items-center justify-center h-96 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">Fill out the form to see a bill preview</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
