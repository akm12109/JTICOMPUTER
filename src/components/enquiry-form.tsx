

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { collection, serverTimestamp, addDoc, doc, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase";
import React, { useRef } from "react";
import { format, isValid } from "date-fns";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2 } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { courseKeys } from "@/lib/course-data";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import { EnquiryPreview } from "./enquiry-preview";
import { cn } from "@/lib/utils";
import { logActivity } from "@/lib/activity-logger";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  fatherName: z.string().min(2, { message: "Father's name must be at least 2 characters." }),
  currentAddress: z.string().min(10, { message: "Current address must be at least 10 characters." }),
  isSameAddress: z.boolean().default(false),
  permanentAddress: z.string().optional(),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  dob: z.string()
    .min(1, { message: "A date of birth is required."})
    .refine(val => isValid(new Date(val)), {message: "Please enter a valid date."}),
  nationality: z.string().min(2, { message: "Nationality is required." }),
  category: z.string({ required_error: "Please select a category." }),
  gender: z.string({ required_error: "Please select a gender." }),
  courseAppliedFor: z.string({ required_error: "Please select a course." }),
  batchTime: z.string().min(2, { message: "Batch time is required." }),
  qualification: z.string().min(2, { message: "Qualification is required." }),
}).refine(data => {
    if (data.isSameAddress) return true;
    return data.permanentAddress && data.permanentAddress.length >= 10;
}, {
  message: "Permanent address must be at least 10 characters.",
  path: ['permanentAddress'],
});

type FormValues = z.infer<typeof formSchema>;
type EnquiryForPdf = FormValues & { slNo: number; enquiryDate: Date };


export default function EnquiryForm() {
    const { toast } = useToast();
    const { t } = useLanguage();
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    const [submittedData, setSubmittedData] = React.useState<EnquiryForPdf | null>(null);
    const previewRef = useRef<HTMLDivElement>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            fatherName: "",
            currentAddress: "",
            isSameAddress: false,
            permanentAddress: "",
            phone: "",
            email: "",
            dob: "",
            nationality: "Indian",
            batchTime: "",
            qualification: "",
        },
    });
    
    const isSameAddress = form.watch("isSameAddress");
    const currentAddressValue = form.watch("currentAddress");

    React.useEffect(() => {
        if (isSameAddress) {
            form.setValue("permanentAddress", currentAddressValue);
        }
    }, [isSameAddress, currentAddressValue, form]);

    const generateAndOpenPdf = React.useCallback(async (data: EnquiryForPdf) => {
        const element = previewRef.current;
        if (!element) {
            toast({ variant: 'destructive', title: 'Could not generate PDF. Preview element not found.' });
            return;
        }

        const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;

        let finalWidth = pdfWidth - 20; // 10mm margin
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
        URL.revokeObjectURL(url);
    }, [toast]);

     React.useEffect(() => {
        if (submittedData && previewRef.current) {
            generateAndOpenPdf(submittedData).finally(() => {
                setSubmittedData(null); // Clear data after PDF generation
            });
        }
    }, [submittedData, generateAndOpenPdf]);


    async function onSubmit(values: FormValues) {
        setLoading(true);
        if (!db) {
            toast({ variant: 'destructive', title: t('enquiry_form.error_title'), description: 'Firebase not configured.' });
            setLoading(false);
            return;
        }

        const { isSameAddress, ...submissionData } = values;
        const dobForFirestore = new Date(values.dob);

        try {
            const counterRef = doc(db, 'counters', 'enquiryCounter');

            const newSlNo = await runTransaction(db, async (transaction) => {
                const counterDoc = await transaction.get(counterRef);
                const currentSlNo = counterDoc.exists() ? counterDoc.data().lastSlNo : 0;
                const newSlNo = currentSlNo + 1;

                const newEnquiryRef = doc(collection(db, "enquiries"));
                transaction.set(newEnquiryRef, {
                    ...submissionData,
                    slNo: newSlNo,
                    dob: dobForFirestore,
                    enquiryDate: serverTimestamp(),
                });
                
                transaction.set(counterRef, { lastSlNo: newSlNo }, { merge: true });

                return newSlNo;
            });

            await logActivity('new_enquiry', {
              description: `New enquiry from ${values.name} for ${values.courseAppliedFor}.`
            });
            
            toast({ title: t('enquiry_form.success_title'), description: t('enquiry_form.success_desc') });
            
            setSubmittedData({ ...values, slNo: newSlNo, enquiryDate: new Date() });
            
            form.reset();
        } catch (error: any) {
            console.error("Enquiry submission error:", error);
            toast({ variant: 'destructive', title: t('enquiry_form.error_title'), description: t('enquiry_form.error_desc') });
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>{t('enquiry_form.name_label')}</FormLabel><FormControl><Input placeholder={t('enquiry_form.name_placeholder')} {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="fatherName" render={({ field }) => ( <FormItem><FormLabel>{t('enquiry_form.father_name_label')}</FormLabel><FormControl><Input placeholder={t('enquiry_form.father_name_placeholder')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    
                    <FormField control={form.control} name="currentAddress" render={({ field }) => (<FormItem><FormLabel>{t('enquiry_form.current_address_label')}</FormLabel><FormControl><Textarea placeholder={t('enquiry_form.current_address_placeholder')} {...field} /></FormControl><FormMessage /></FormItem>)} />

                    <FormField
                        control={form.control}
                        name="isSameAddress"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>{t('enquiry_form.same_address_label')}</FormLabel>
                            </div>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="permanentAddress"
                        render={({ field }) => (
                            <FormItem className={cn(isSameAddress && 'hidden')}>
                                <FormLabel>{t('enquiry_form.permanent_address_label')}</FormLabel>
                                <FormControl>
                                    <Textarea placeholder={t('enquiry_form.permanent_address_placeholder')} {...field} disabled={isSameAddress} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>{t('enquiry_form.phone_label')}</FormLabel><FormControl><Input placeholder={t('enquiry_form.phone_placeholder')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>{t('enquiry_form.email_label')}</FormLabel><FormControl><Input type="email" placeholder={t('enquiry_form.email_placeholder')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="dob"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('enquiry_form.dob_label')}</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField control={form.control} name="nationality" render={({ field }) => (<FormItem><FormLabel>{t('enquiry_form.nationality_label')}</FormLabel><FormControl><Input placeholder={t('enquiry_form.nationality_placeholder')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <FormField control={form.control} name="category" render={({ field }) => (
                            <FormItem><FormLabel>{t('enquiry_form.category_label')}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder={t('enquiry_form.category_placeholder')} /></SelectTrigger></FormControl>
                                <SelectContent><SelectItem value="General">General</SelectItem><SelectItem value="OBC">OBC</SelectItem><SelectItem value="SC">SC</SelectItem><SelectItem value="ST">ST</SelectItem></SelectContent>
                            </Select><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="gender" render={({ field }) => (
                            <FormItem><FormLabel>{t('enquiry_form.gender_label')}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder={t('enquiry_form.gender_placeholder')} /></SelectTrigger></FormControl>
                                <SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent>
                            </Select><FormMessage /></FormItem>)} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <FormField control={form.control} name="courseAppliedFor" render={({ field }) => (<FormItem><FormLabel>{t('enquiry_form.course_label')}</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder={t('enquiry_form.course_placeholder')} /></SelectTrigger></FormControl><SelectContent>{courseKeys.map(key => (<SelectItem key={key} value={t(`courses_data.${key}.title`)}>{t(`courses_data.${key}.title`)}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="batchTime" render={({ field }) => ( <FormItem><FormLabel>{t('enquiry_form.batch_time_label')}</FormLabel><FormControl><Input placeholder={t('enquiry_form.batch_time_placeholder')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <FormField control={form.control} name="qualification" render={({ field }) => ( <FormItem><FormLabel>{t('enquiry_form.qualification_label')}</FormLabel><FormControl><Input placeholder={t('enquiry_form.qualification_placeholder')} {...field} /></FormControl><FormMessage /></FormItem>)} />

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        {loading ? t('enquiry_form.submitting_button') : t('enquiry_form.submit_button')}
                    </Button>
                </form>
            </Form>
             {submittedData && (
                <div className="absolute -z-10 -left-[9999px] -top-[9999px]">
                    <div ref={previewRef}>
                        <EnquiryPreview enquiry={submittedData} />
                    </div>
                </div>
            )}
        </>
    );
}
