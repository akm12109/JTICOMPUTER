
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

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, UserPlus, Upload, FileDown, AlertTriangle, CheckCircle, XCircle, PlusCircle, Trash2 } from 'lucide-react';
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
});

const bulkStudentSchema = singleStudentSchema.extend({
  // The bulk schema is now the same as the single schema, but we will handle qualifications differently
  qualifications: z.union([
    z.string().min(1, { message: "Qualifications are required." }),
    z.array(qualificationSchema)
  ]).refine(val => (typeof val === 'string' && val.length > 0) || (Array.isArray(val) && val.length > 0), {
    message: "Qualifications cannot be empty."
  })
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

  const onSingleSubmit = async (values: SingleStudentFormValues) => {
    setIsSubmittingSingle(true);
    try {
      await admitStudent(values);
      toast({ title: 'Student Added!', description: `${values.name} has been added and their account is created.` });
      form.reset();
    } catch (error: any) {
      console.error("Error admitting student:", error);
      toast({ variant: 'destructive', title: "Admission Failed", description: error.message });
    } finally {
      setIsSubmittingSingle(false);
    }
  };

  const admitStudent = async (studentData: SingleStudentFormValues) => {
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
        
         await logActivity('student_added', {
          description: `Admin added a new student: ${studentData.name}.`,
          link: `/admin/students/${user.uid}`
        });

    } catch(e) {
        console.error("Error in admitStudent:", e);
        throw e;
    }
    finally {
        if (tempApp) await deleteApp(tempApp);
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
          // Convert date objects from Excel to YYYY-MM-DD strings
          cellDates: true,
          dateNF: 'yyyy-mm-dd',
        });

        const students: BulkStudent[] = json.map((row, index) => {
          // If 'dob' is a Date object, format it correctly.
          if (row.dob instanceof Date) {
            row.dob = row.dob.toISOString().split('T')[0];
          }
          return {
            ...row,
            originalRow: index + 2,
          };
        });
        
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
            // Validate the row data
            bulkStudentSchema.parse(student);
            
            // Parse the qualifications string
            let parsedQualifications: any[] = [];
            if (typeof student.qualifications === 'string') {
              parsedQualifications = student.qualifications.split(';').map(q => {
                const parts = q.split('|');
                if (parts.length !== 5) throw new Error("Invalid qualification format. Expected 5 parts separated by '|'.");
                return {
                  examination: parts[0]?.trim(),
                  board: parts[1]?.trim(),
                  passingYear: parts[2]?.trim(),
                  division: parts[3]?.trim(),
                  percentage: parts[4]?.trim(),
                };
              });
            } else {
              // This case should ideally not happen if the file is correct
              parsedQualifications = student.qualifications as any[];
            }
            
            // Re-validate the parsed qualifications
            z.array(qualificationSchema).min(1).parse(parsedQualifications);

            const finalStudentData = {
              ...student,
              qualifications: parsedQualifications,
            } as SingleStudentFormValues;

            await admitStudent(finalStudentData);
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
    const headers = "session,name,fatherName,dob,sex,nationality,phone,address,email,password,courseAppliedFor,qualifications";
    const example = `2024-25,John Doe,Richard Doe,2005-04-15,Male,Indian,1234567890,"123 Main St, Anytown","john.doe@example.com",tempPass123,"Diploma in Computer Application (DCA)","10th|CBSE|2020|1st|85%;12th|JAC|2022|1st|80%"`;
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
                <FormField control={form.control} name="session" render={({ field }) => (<FormItem><FormLabel>{t('admission_page.session')}</FormLabel><FormControl><Input placeholder={t('admission_page.session_placeholder')} {...field} /></FormControl><FormMessage /></FormItem>)} />
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
                        <p>Bulk upload now supports all fields. Please follow the format carefully.</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                            <li>Upload a CSV or XLSX file.</li>
                            <li>The first row must be a header with the exact names: `session`, `name`, `fatherName`, `dob`, `sex`, `nationality`, `phone`, `address`, `email`, `password`, `courseAppliedFor`, and `qualifications`.</li>
                            <li>`courseAppliedFor` must exactly match a course title from the dropdown list.</li>
                            <li>The `qualifications` column must contain all qualifications in a single cell, separated by a semicolon (`;`). Each qualification's details must be separated by a pipe (`|`) in the order: `examination|board|passingYear|division|percentage`.</li>
                            <li>Example for `qualifications`: `10th|CBSE|2020|1st|85%;12th|JAC|2022|1st|80%`</li>
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
