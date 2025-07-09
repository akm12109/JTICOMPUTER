

'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db, firebaseConfig } from '@/lib/firebase';
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getApps, initializeApp, getApp, deleteApp } from 'firebase/app';
import * as XLSX from 'xlsx';
import { isValid } from 'date-fns';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, UserPlus, Upload, FileDown, AlertTriangle, CheckCircle, XCircle, PlusCircle, Trash2, FileBadge } from 'lucide-react';
import { courseKeys } from '@/lib/course-data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/hooks/use-language';
import { Textarea } from '@/components/ui/textarea';
import { logActivity } from '@/lib/activity-logger';

const qualificationSchema = z.object({
  examination: z.string().min(1, "Examination is required."),
  board: z.string().min(1, "Board is required."),
  passingYear: z.string().min(4, "Invalid year.").max(4, "Invalid year."),
  division: z.string().min(1, "Division is required."),
  percentage: z.string().min(1, "Percentage is required."),
});

const singleStudentSchema = z.object({
    session: z.string().min(4, { message: "Session is required (e.g., 2024-25)." }),
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    fatherName: z.string().min(2, { message: "Father's name must be at least 2 characters." }),
    dob: z.string().min(1, { message: "A date of birth is required."}).refine(val => isValid(new Date(val)), {message: "Please enter a valid date."}),
    sex: z.string({ required_error: "Please select your gender." }),
    nationality: z.string().min(2, { message: "Nationality is required." }),
    phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }),
    address: z.string().min(10, { message: "Address must be at least 10 characters." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
    courseAppliedFor: z.string({ required_error: "Please select a course." }),
    qualifications: z.array(qualificationSchema).min(1, { message: "Please add at least one qualification." }),
    photoDataUri: z.string().optional(),
    signatureDataUri: z.string().optional(),
});

const bulkStudentSchema = z.object({
  name: z.string().min(2, { message: 'Name is required' }),
  email: z.string().email({ message: 'A valid email is required' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  fatherName: z.string().min(2, { message: "Father's name is required" }),
  phone: z.string().min(10, { message: "Phone number is required" }),
  courseAppliedFor: z.string({ required_error: 'Please select a course' }),
  session: z.string().min(4, { message: 'Session is required (e.g., 2024-25)' }),
});

type SingleStudentFormValues = z.infer<typeof singleStudentSchema>;
type BulkStudent = z.infer<typeof bulkStudentSchema> & { originalRow: number };

const getCurrentSession = () => {
    const currentYear = new Date().getFullYear();
    return `${currentYear}-${currentYear + 1}`;
};

export default function AddStudentsPage() {
  const [activeTab, setActiveTab] = useState('single');
  const [isSubmittingSingle, setIsSubmittingSingle] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);

  const [parsedData, setParsedData] = useState<BulkStudent[]>([]);
  const [fileName, setFileName] = useState('');
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [bulkResults, setBulkResults] = useState<{ successful: any[], failed: (any & { error: string })[] } | null>(null);

  const form = useForm<SingleStudentFormValues>({
    resolver: zodResolver(singleStudentSchema),
    defaultValues: {
      name: "", fatherName: "", dob: "", phone: "", address: "", email: "", password: "",
      session: getCurrentSession(),
      nationality: "Indian",
      qualifications: [{ examination: "", board: "", passingYear: "", division: "", percentage: "" }]
    },
  });

  const { fields, append, remove } = useFieldArray({
      control: form.control,
      name: "qualifications"
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, setter: (dataUri: string) => void, fieldName: "photoDataUri" | "signatureDataUri") => {
    const file = event.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUri = reader.result as string;
            setter(dataUri);
            form.setValue(fieldName, dataUri);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleAdmitStudent = async (studentData: SingleStudentFormValues | z.infer<typeof bulkStudentSchema>): Promise<string | null> => {
    if (!db) throw new Error("Firebase not configured");

    let tempApp;
    const tempAppName = `studentCreation_${Date.now()}`;
    try {
        tempApp = initializeApp(firebaseConfig, tempAppName);
        const tempAuth = getAuth(tempApp);
        const userCredential = await createUserWithEmailAndPassword(tempAuth, studentData.email, studentData.password);
        const user = userCredential.user;

        const { password, ...admissionData } = studentData;

        await setDoc(doc(db, "admissions", user.uid), {
            ...admissionData,
            dob: 'dob' in admissionData ? new Date(admissionData.dob as string) : null,
            uid: user.uid,
            status: 'admitted',
            admissionDate: serverTimestamp(),
            createdAt: serverTimestamp(),
        });

        return user.uid; // Return the new user's UID
    } catch(e) {
        console.error("Error in handleAdmitStudent:", e);
        throw e; // re-throw the error to be caught by the caller
    }
    finally {
        if (tempApp) await deleteApp(tempApp);
    }
  };


  const uploadProfileMedia = async (dataUri: string): Promise<string | null> => {
    try {
        const response = await fetch('/api/upload-profile-media', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file: dataUri }),
        });
        const responseData = await response.json();
        if (!response.ok) {
            throw new Error(responseData.error || 'Failed to upload profile media.');
        }
        return responseData.secure_url;
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Upload Failed', description: (error as Error).message });
        return null;
    }
  };

  const onSingleSubmit = async (values: SingleStudentFormValues) => {
    setIsSubmittingSingle(true);
    try {
      const dataToSubmit = { ...values };

      if (dataToSubmit.photoDataUri && dataToSubmit.photoDataUri.startsWith('data:')) {
          const photoUrl = await uploadProfileMedia(dataToSubmit.photoDataUri);
          if (!photoUrl) {
              setIsSubmittingSingle(false);
              return;
          }
          dataToSubmit.photoDataUri = photoUrl;
      }
      
      if (dataToSubmit.signatureDataUri && dataToSubmit.signatureDataUri.startsWith('data:')) {
          const signatureUrl = await uploadProfileMedia(dataToSubmit.signatureDataUri);
          if (!signatureUrl) {
              setIsSubmittingSingle(false);
              return;
          }
          dataToSubmit.signatureDataUri = signatureUrl;
      }

      const newStudentUid = await handleAdmitStudent(dataToSubmit);
      if (newStudentUid) {
        await logActivity('student_added', {
          description: `Admin added a new student: ${values.name}.`,
          link: `/admin/students/${newStudentUid}`
        });
      }

      toast({ title: 'Student Added!', description: `${values.name} has been added and their account is created.` });
      form.reset();
      setPhotoPreview(null);
      setSignaturePreview(null);
    } catch (error: any) {
      console.error("Error admitting student:", error);
      toast({ variant: 'destructive', title: "Admission Failed", description: error.message });
    } finally {
      setIsSubmittingSingle(false);
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
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        const students: BulkStudent[] = json.map((row, index) => ({
            ...row,
            originalRow: index + 2
        }));
        
        setParsedData(students);
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
    if (parsedData.length === 0) {
        toast({ variant: 'destructive', title: 'No data to process' });
        return;
    }
    setIsProcessingBulk(true);
    setBulkResults(null);

    const results = { successful: [] as any[], failed: [] as (any & { error: string })[] };

    for (const student of parsedData) {
        try {
            bulkStudentSchema.parse(student);
            await handleAdmitStudent(student);
            results.successful.push(student);
        } catch (error: any) {
            let errorMessage = "An unknown error occurred.";
            if (error instanceof z.ZodError) {
                errorMessage = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
            } else if (error.message) {
                errorMessage = error.message;
            }
            results.failed.push({ ...student, error: errorMessage });
        }
    }
    
    if (results.successful.length > 0) {
      await logActivity('student_added', {
        description: `Admin bulk-added ${results.successful.length} new students.`
      });
    }

    setBulkResults(results);
    setIsProcessingBulk(false);
  };

  const downloadSampleCSV = () => {
    const headers = "name,email,password,fatherName,phone,courseAppliedFor,session";
    const example = "John Doe,john.doe@example.com,tempPass123,Richard Doe,1234567890,Diploma in Computer Application (DCA),2024-25";
    const csvContent = `data:text/csv;charset=utf-8,${headers}\n${example}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "jti_bulk_student_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Students</CardTitle>
        <CardDescription>Add students individually or upload a file for bulk creation.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">Add Single Student</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Add Students</TabsTrigger>
          </TabsList>
          
          <TabsContent value="single" className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSingleSubmit)} className="space-y-4">
                <FormField control={form.control} name="session" render={({ field }) => (<FormItem><FormLabel>{t('admission_page.session')}</FormLabel><FormControl><Input placeholder={t('admission_page.session_placeholder')} {...field} disabled /></FormControl><FormMessage /></FormItem>)} />
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>{t('admission_page.email_label')}</FormLabel><FormControl><Input type="email" placeholder={t('admission_page.email_placeholder')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="password" render={({ field }) => ( <FormItem><FormLabel>Temporary Password</FormLabel><FormControl><Input type="text" {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
                    <div className="space-y-2">
                        <FormLabel>{t('admission_page.photo')}</FormLabel>
                        <div className="flex items-center gap-4">
                            <div className="w-24 h-32 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted overflow-hidden">
                                {photoPreview ? (
                                    <Image src={photoPreview} alt="Photo preview" width={96} height={128} className="object-cover w-full h-full" />
                                ) : ( <Upload className="h-8 w-8 text-muted-foreground" /> )}
                            </div>
                            <FormField control={form.control} name="photoDataUri" render={({ field }) => (
                                <FormItem><FormControl>
                                    <Button asChild variant="outline" type="button"><label>
                                        <Upload className="mr-2 h-4 w-4" /> {t('admission_page.upload_photo')}
                                        <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setPhotoPreview, 'photoDataUri')} className="hidden" />
                                    </label></Button>
                                </FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <FormLabel>{t('admission_page.signature')}</FormLabel>
                        <div className="flex items-center gap-4">
                            <div className="w-32 h-20 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted overflow-hidden">
                                {signaturePreview ? (
                                    <Image src={signaturePreview} alt="Signature preview" width={128} height={80} className="object-contain w-full h-full" />
                                ) : ( <FileBadge className="h-8 w-8 text-muted-foreground" /> )}
                            </div>
                            <FormField control={form.control} name="signatureDataUri" render={({ field }) => (
                                <FormItem><FormControl>
                                    <Button asChild variant="outline" type="button"><label>
                                        <Upload className="mr-2 h-4 w-4" /> {t('admission_page.upload_signature')}
                                        <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setSignaturePreview, 'signatureDataUri')} className="hidden" />
                                    </label></Button>
                                </FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                    </div>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmittingSingle}>
                  {isSubmittingSingle ? <Loader2 className="animate-spin" /> : <UserPlus className="mr-2" />}
                  Add Student
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
                        <p>Bulk upload only supports essential fields. More details like address, DOB, qualifications, and photos can be added later by editing the student's profile.</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                            <li>Upload a CSV or XLSX file.</li>
                            <li>The first row must be a header with the exact names: `name`, `email`, `password`, `fatherName`, `phone`, `courseAppliedFor`, `session`.</li>
                            <li>`courseAppliedFor` must exactly match a course title from the dropdown list.</li>
                        </ul>
                        <Button variant="link" size="sm" onClick={downloadSampleCSV} className="p-0 h-auto mt-2">
                           <FileDown className="mr-2" /> Download sample CSV template
                        </Button>
                    </AlertDescription>
                </Alert>

                <div className="flex items-center gap-4">
                    <Label htmlFor="bulk-upload" className="flex-shrink-0">Upload File</Label>
                    <Input id="bulk-upload" type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleFileChange} />
                </div>
                
                {parsedData.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="font-semibold">{fileName} - Data Preview ({parsedData.length} rows)</h3>
                         <div className="max-h-60 overflow-y-auto border rounded-lg">
                           <Table>
                                <TableHeader className="sticky top-0 bg-muted">
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Course</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {parsedData.slice(0, 10).map((row, i) => (
                                        <TableRow key={i}>
                                            <TableCell>{row.name}</TableCell>
                                            <TableCell>{row.email}</TableCell>
                                            <TableCell>{row.courseAppliedFor}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                           </Table>
                         </div>
                        {parsedData.length > 10 && <p className="text-sm text-center text-muted-foreground">Showing first 10 rows...</p>}
                        <Button onClick={handleBulkSubmit} disabled={isProcessingBulk} className="w-full">
                           {isProcessingBulk ? <Loader2 className="animate-spin"/> : <UserPlus className="mr-2" />}
                           {isProcessingBulk ? `Processing ${parsedData.length} records...` : `Confirm & Add ${parsedData.length} Students`}
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
                                Successfully added: {bulkResults.successful.length} students. <br/>
                                Failed to add: {bulkResults.failed.length} students.
                            </AlertDescription>
                        </Alert>
                        {bulkResults.failed.length > 0 && (
                             <div className="max-h-60 overflow-y-auto border rounded-lg">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-muted">
                                        <TableRow>
                                            <TableHead>Row</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Reason for Failure</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {bulkResults.failed.map((row, i) => (
                                            <TableRow key={i} variant="destructive">
                                                <TableCell>{row.originalRow}</TableCell>
                                                <TableCell>{row.name}</TableCell>
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
  );
}
