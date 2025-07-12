

'use client';

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import * as z from "zod"
import { collection, serverTimestamp, doc, runTransaction } from "firebase/firestore"
import { db } from "@/lib/firebase"
import React, { useRef } from "react"
import { isValid } from "date-fns"
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { UserPlus, PlusCircle, Trash2, Loader2 } from "lucide-react"
import { useLanguage } from "@/hooks/use-language";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { courseKeys } from "@/lib/course-data"
import { Textarea } from "./ui/textarea"
import { ApplicationPreview } from "./application-preview";
import { logActivity } from "@/lib/activity-logger";

const qualificationSchema = z.object({
  examination: z.string().min(1, "Examination is required."),
  board: z.string().min(1, "Board is required."),
  passingYear: z.string().min(4, "Invalid year.").max(4, "Invalid year."),
  division: z.string().min(1, "Division is required."),
  percentage: z.string().min(1, "Percentage is required."),
});

const formSchema = z.object({
    session: z.string().min(4, { message: "Session is required (e.g., 2024-25)." }),
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    fatherName: z.string().min(2, { message: "Father's name must be at least 2 characters." }),
    dob: z.string().min(1, { message: "A date of birth is required."}).refine(val => isValid(new Date(val)), {message: "Please enter a valid date."}),
    sex: z.string({ required_error: "Please select your gender." }),
    nationality: z.string().min(2, { message: "Nationality is required." }),
    phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }),
    address: z.string().min(10, { message: "Address must be at least 10 characters." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    courseAppliedFor: z.string({ required_error: "Please select a course." }),
    qualifications: z.array(qualificationSchema).min(1, { message: "Please add at least one qualification." }),
});

type FormValues = z.infer<typeof formSchema>;
type ApplicationForPdf = FormValues & { slNo: number; createdAt: Date; photoDataUri?: string; signatureDataUri?: string; };

const getCurrentSession = () => {
    const currentYear = new Date().getFullYear();
    return `${currentYear}-${currentYear + 1}`;
};

export default function RegisterForm() {
    const { toast } = useToast()
    const { t } = useLanguage()
    const [loading, setLoading] = React.useState(false)
    
    const [submittedData, setSubmittedData] = React.useState<ApplicationForPdf | null>(null);
    const previewRef = useRef<HTMLDivElement>(null);


    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            fatherName: "",
            dob: "",
            phone: "",
            address: "",
            email: "",
            session: getCurrentSession(),
            nationality: "Indian",
            qualifications: [
              { examination: "", board: "", passingYear: "", division: "", percentage: "" }
            ]
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "qualifications"
    });

     const generateAndOpenPdf = React.useCallback(async (data: ApplicationForPdf) => {
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
            toast({ variant: 'destructive', title: 'Application Failed', description: 'Firebase not configured.' });
            setLoading(false);
            return;
        }

        try {
            const dataToSubmit = { ...values };

            const counterRef = doc(db, 'counters', 'admissionCounter');

            const newSlNo = await runTransaction(db, async (transaction) => {
                const counterDoc = await transaction.get(counterRef);
                const lastSlNo = counterDoc.exists() ? counterDoc.data().lastSlNo : 0;
                const newSlNo = lastSlNo + 1;

                const newApplicationRef = doc(collection(db, "applications"));
                transaction.set(newApplicationRef, {
                    ...dataToSubmit,
                    slNo: newSlNo,
                    dob: new Date(dataToSubmit.dob),
                    createdAt: serverTimestamp(),
                    status: 'pending'
                });

                transaction.set(counterRef, { lastSlNo: newSlNo }, { merge: true });
                return newSlNo;
            });
            
            await logActivity('new_application', {
                description: `New application from ${dataToSubmit.name} for ${dataToSubmit.courseAppliedFor}.`
            });

            toast({ title: t('admission_page.success_title'), description: t('admission_page.success_desc') });
            
            const dataForPdf = { ...dataToSubmit, slNo: newSlNo, createdAt: new Date() };
            setSubmittedData(dataForPdf);

            form.reset();

        } catch (error: any) {
            console.error("Application submission error:", error);
            toast({ variant: 'destructive', title: 'Application Failed', description: error.message || 'An error occurred. Please try again.' });
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField control={form.control} name="session" render={({ field }) => (<FormItem><FormLabel>{t('admission_page.session')}</FormLabel><FormControl><Input placeholder={t('admission_page.session_placeholder')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>{t('admission_page.name_label')}</FormLabel><FormControl><Input placeholder={t('admission_page.name_placeholder')} {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="fatherName" render={({ field }) => ( <FormItem><FormLabel>{t('admission_page.father_name_label')}</FormLabel><FormControl><Input placeholder={t('admission_page.father_name_placeholder')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="dob"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('admission_page.dob_label')}</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField control={form.control} name="sex" render={({ field }) => (
                            <FormItem><FormLabel>{t('admission_page.sex')}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder={t('admission_page.sex_placeholder')} /></SelectTrigger></FormControl>
                                <SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent>
                            </Select><FormMessage /></FormItem>)} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField control={form.control} name="nationality" render={({ field }) => (<FormItem><FormLabel>{t('admission_page.nationality')}</FormLabel><FormControl><Input placeholder={t('admission_page.nationality_placeholder')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>{t('admission_page.phone_label')}</FormLabel><FormControl><Input placeholder={t('admission_page.phone_placeholder')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>{t('admission_page.address_label')}</FormLabel><FormControl><Textarea placeholder={t('admission_page.address_placeholder')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>{t('admission_page.email_label')}</FormLabel><FormControl><Input type="email" placeholder={t('admission_page.email_placeholder')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="courseAppliedFor" render={({ field }) => (<FormItem><FormLabel>{t('admission_page.course_label')}</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder={t('admission_page.course_placeholder')} /></SelectTrigger></FormControl><SelectContent>{courseKeys.map(key => (<SelectItem key={key} value={t(`courses_data.${key}.title`)}>{t(`courses_data.${key}.title`)}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                    
                    <div>
                        <FormLabel>{t('admission_page.qualifications_label')}</FormLabel>
                        <div className="space-y-4 mt-2">
                            {fields.map((item, index) => (
                            <div key={item.id} className="p-4 border rounded-lg space-y-4 relative">
                                    <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => remove(index)} disabled={fields.length <= 1}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                <FormField control={form.control} name={`qualifications.${index}.examination`} render={({ field }) => (<FormItem><FormLabel>{t('admission_page.examination')}</FormLabel><FormControl><Input placeholder="e.g. 10th/Matric" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name={`qualifications.${index}.board`} render={({ field }) => ( <FormItem><FormLabel>{t('admission_page.board')}</FormLabel><FormControl><Input placeholder="e.g. CBSE, JAC" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name={`qualifications.${index}.passingYear`} render={({ field }) => (<FormItem><FormLabel>{t('admission_page.passing_year')}</FormLabel><FormControl><Input placeholder="e.g. 2020" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name={`qualifications.${index}.division`} render={({ field }) => (<FormItem><FormLabel>{t('admission_page.division')}</FormLabel><FormControl><Input placeholder="e.g. 1st, 2nd" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name={`qualifications.${index}.percentage`} render={({ field }) => (<FormItem><FormLabel>{t('admission_page.percentage_marks')}</FormLabel><FormControl><Input placeholder="e.g. 85%" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                </div>
                            </div>
                            ))}
                        </div>
                        <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append({ examination: "", board: "", passingYear: "", division: "", percentage: "" })}>
                            <PlusCircle className="mr-2 h-4 w-4" /> {t('admission_page.add_qualification')}
                        </Button>
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                        {loading ? t('admission_page.submitting_button') : t('common.submit_application')}
                    </Button>
                </form>
            </Form>
            {submittedData && (
                 <div className="absolute -z-10 -left-[9999px] -top-[9999px]">
                    <div ref={previewRef}>
                        <ApplicationPreview application={submittedData} />
                    </div>
                </div>
            )}
        </>
    )
}
