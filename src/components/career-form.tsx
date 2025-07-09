
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import React from "react";
import Image from "next/image";

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
import { Save, Loader2, Upload } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Textarea } from "./ui/textarea";
import { uploadDataUriWithProgress } from "@/lib/uploader";
import { Progress } from "./ui/progress";

// Schemas
const academicDetailsSchema = z.object({
    boardOfExam: z.string().optional(),
    nameOfSchool: z.string().optional(),
    examSeatNo: z.string().optional(),
    totalMarksObtained: z.string().optional(),
    maximumMarks: z.string().optional(),
    passingMonth: z.string().optional(),
    passingYear: z.string().optional(),
    percentageMarksScored: z.string().optional(),
    grade: z.string().optional(),
}).optional();

const addressSchema = z.object({
  address: z.string().optional(),
  city: z.string().optional(),
  pin: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  parentsLandline: z.string().optional(),
  parentsMobile: z.string().optional(),
  nearestBusStation: z.string().optional(),
  railwayStation: z.string().optional(),
}).optional();

const guardianAddressSchema = z.object({
    guardianName: z.string().optional(),
    guardianOccupation: z.string().optional(),
    relationWithGuardian: z.string().optional(),
    guardianEmail: z.string().email({message: "Invalid email"}).optional().or(z.literal('')),
    address: z.string().optional(),
    landline: z.string().optional(),
    pin: z.string().optional(),
    mobile: z.string().optional(),
}).optional();

const lastQualifyingExamSchema = z.object({
    lastExamName: z.string().optional(),
    examYear: z.string().optional(),
    boardOrUnivName: z.string().optional(),
    durationOfYear: z.string().optional(),
    totalMarksObtained: z.string().optional(),
    totalMaxMarks: z.string().optional(),
    class: z.string().optional(),
    percentageOfMarks: z.string().optional(),
}).optional();


const careerFormSchema = z.object({
  photoDataUri: z.string().optional(),
  motherName: z.string().min(1, "Mother's name is required."),
  admissionDate: z.string().min(1, "Admission date is required."),
  category: z.string().optional(),
  caste: z.string().optional(),
  religion: z.string().optional(),
  nationality: z.string().optional(),
  motherTongue: z.string().optional(),
  bloodGroup: z.string().optional(),
  fatherOccupation: z.string().optional(),
  motherOccupation: z.string().optional(),
  identificationMarks: z.string().optional(),
  candidateMobile: z.string().optional(),
  sex: z.enum(['male', 'female'], { required_error: "Please select your sex." }),
  maritalStatus: z.enum(['yes', 'no'], { required_error: "Please select your marital status." }),
  
  academic10th: academicDetailsSchema,
  academic12th: academicDetailsSchema,

  localAddress: addressSchema,
  permanentAddress: addressSchema,
  isSameAddress: z.boolean().default(false),
  guardianAddress: guardianAddressSchema,
  lastQualifyingExam: lastQualifyingExamSchema,
  declarationDate: z.string().optional(),
  declarationPlace: z.string().optional(),
});

type CareerFormValues = z.infer<typeof careerFormSchema>;

type CareerFormProps = {
  studentProfile: { uid: string, [key: string]: any };
};

export default function CareerForm({ studentProfile }: CareerFormProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<number | null>(null);
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(studentProfile.photoDataUri || null);

  const form = useForm<CareerFormValues>({
    resolver: zodResolver(careerFormSchema),
    defaultValues: {
      photoDataUri: studentProfile.photoDataUri || '',
      motherName: studentProfile.motherName || '',
      admissionDate: studentProfile.admissionDate ? new Date(studentProfile.admissionDate.toDate()).toISOString().split('T')[0] : (studentProfile.createdAt ? new Date(studentProfile.createdAt.toDate()).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
      category: studentProfile.category || '',
      caste: studentProfile.caste || '',
      religion: studentProfile.religion || '',
      nationality: studentProfile.nationality || 'Indian',
      motherTongue: studentProfile.motherTongue || '',
      bloodGroup: studentProfile.bloodGroup || '',
      fatherOccupation: studentProfile.fatherOccupation || '',
      motherOccupation: studentProfile.motherOccupation || '',
      identificationMarks: studentProfile.identificationMarks || '',
      candidateMobile: studentProfile.candidateMobile || '',
      sex: studentProfile.sex,
      maritalStatus: studentProfile.maritalStatus,
      academic10th: studentProfile.academic10th || {},
      academic12th: studentProfile.academic12th || {},
      localAddress: studentProfile.localAddress || {},
      permanentAddress: studentProfile.permanentAddress || {},
      isSameAddress: studentProfile.isSameAddress || false,
      guardianAddress: studentProfile.guardianAddress || {},
      lastQualifyingExam: studentProfile.lastQualifyingExam || {},
      declarationDate: studentProfile.declarationDate || '',
      declarationPlace: studentProfile.declarationPlace || '',
    },
  });
  
  const isSameAddress = form.watch("isSameAddress");
  const localAddressValues = form.watch("localAddress");

  React.useEffect(() => {
      if (isSameAddress && localAddressValues) {
          form.setValue("permanentAddress", localAddressValues);
      }
  }, [isSameAddress, localAddressValues, form]);


  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setPhotoPreview(dataUri);
        form.setValue('photoDataUri', dataUri);
      };
      reader.readAsDataURL(file);
    }
  };

  async function onSubmit(values: CareerFormValues) {
    setLoading(true);
    if (!db) {
      toast({ variant: 'destructive', title: 'Error', description: 'Firebase not configured.' });
      setLoading(false);
      return;
    }
    try {
      const dataToUpdate = { ...values };

      // Check if photo is a new upload (data URI)
      if (dataToUpdate.photoDataUri && dataToUpdate.photoDataUri.startsWith('data:')) {
        setUploadProgress(0);
        const response = await uploadDataUriWithProgress('/api/upload-profile-media', dataToUpdate.photoDataUri, {
          onProgress: setUploadProgress
        });
        dataToUpdate.photoDataUri = response.secure_url;
      }
      
      const profileRef = doc(db, 'admissions', studentProfile.uid);
      await setDoc(profileRef, {
        ...dataToUpdate,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      toast({
        title: t('careers_form.success_title'),
        description: t('careers_form.success_desc'),
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update profile.' });
      console.error(error);
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  }
  
  const AddressSection = ({ type }: { type: 'localAddress' | 'permanentAddress' }) => (
    <Card>
      <CardHeader>
        <CardTitle>{t(`careers_form.address_title_${type}`)}</CardTitle>
        {type === 'permanentAddress' && (
             <FormField
                control={form.control}
                name="isSameAddress"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-2">
                    <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                        <FormLabel>{t('careers_form.same_as_local')}</FormLabel>
                    </div>
                    </FormItem>
                )}
            />
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField control={form.control} name={`${type}.address`} render={({ field }) => ( <FormItem><FormLabel>{t('careers_form.address')}</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name={`${type}.city`} render={({ field }) => ( <FormItem><FormLabel>{t('careers_form.city')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name={`${type}.pin`} render={({ field }) => ( <FormItem><FormLabel>{t('careers_form.pin')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name={`${type}.district`} render={({ field }) => ( <FormItem><FormLabel>{t('careers_form.district')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name={`${type}.state`} render={({ field }) => ( <FormItem><FormLabel>{t('careers_form.state')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name={`${type}.parentsLandline`} render={({ field }) => ( <FormItem><FormLabel>{t('careers_form.parents_landline')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name={`${type}.parentsMobile`} render={({ field }) => ( <FormItem><FormLabel>{t('careers_form.parents_mobile')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name={`${type}.nearestBusStation`} render={({ field }) => ( <FormItem><FormLabel>{t('careers_form.nearest_bus_station')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name={`${type}.railwayStation`} render={({ field }) => ( <FormItem><FormLabel>{t('careers_form.railway_station')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
        </div>
      </CardContent>
    </Card>
  );

  const AcademicSection = ({ gradeLevel }: { gradeLevel: '10th' | '12th' }) => (
    <Card>
      <CardHeader>
        <CardTitle>{t(`careers_form.academic_title_${gradeLevel}`)}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FormField control={form.control} name={`academic${gradeLevel}.boardOfExam`} render={({ field }) => ( <FormItem><FormLabel>{t('careers_form.board_of_exam')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
          <FormField control={form.control} name={`academic${gradeLevel}.nameOfSchool`} render={({ field }) => ( <FormItem><FormLabel>{t('careers_form.name_of_school')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
          <FormField control={form.control} name={`academic${gradeLevel}.examSeatNo`} render={({ field }) => ( <FormItem><FormLabel>{t('careers_form.exam_seat_no')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
          <FormField control={form.control} name={`academic${gradeLevel}.totalMarksObtained`} render={({ field }) => ( <FormItem><FormLabel>{t('careers_form.total_marks_obtained')}</FormLabel><FormControl><Input type="text" {...field} /></FormControl><FormMessage /></FormItem> )} />
          <FormField control={form.control} name={`academic${gradeLevel}.maximumMarks`} render={({ field }) => ( <FormItem><FormLabel>{t('careers_form.maximum_marks')}</FormLabel><FormControl><Input type="text" {...field} /></FormControl><FormMessage /></FormItem> )} />
          <FormField control={form.control} name={`academic${gradeLevel}.passingMonth`} render={({ field }) => ( <FormItem><FormLabel>{t('careers_form.passing_month')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
          <FormField control={form.control} name={`academic${gradeLevel}.passingYear`} render={({ field }) => ( <FormItem><FormLabel>{t('careers_form.passing_year')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
          <FormField control={form.control} name={`academic${gradeLevel}.percentageMarksScored`} render={({ field }) => ( <FormItem><FormLabel>{t('careers_form.percentage')}</FormLabel><FormControl><Input type="text" {...field} /></FormControl><FormMessage /></FormItem> )} />
          <FormField control={form.control} name={`academic${gradeLevel}.grade`} render={({ field }) => ( <FormItem><FormLabel>{t('careers_form.grade')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
        </div>
      </CardContent>
    </Card>
  );


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>{t('careers_form.personal_details_title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Pre-filled fields shown as disabled */}
                    <FormItem> <FormLabel>{t('admission_page.name_label')}</FormLabel> <Input disabled value={studentProfile.name} /> </FormItem>
                    <FormItem> <FormLabel>{t('admission_page.father_name_label')}</FormLabel> <Input disabled value={studentProfile.fatherName} /> </FormItem>
                    <FormItem> <FormLabel>{t('admission_page.email_label')}</FormLabel> <Input disabled value={studentProfile.email} /> </FormItem>
                    <FormItem> <FormLabel>{t('admission_page.phone_label')}</FormLabel> <Input disabled value={studentProfile.phone} /> </FormItem>
                    <FormItem> <FormLabel>{t('admission_page.dob_label')}</FormLabel> <Input disabled value={studentProfile.dob ? new Date(studentProfile.dob.toDate()).toLocaleDateString() : ''} /> </FormItem>
                    <FormItem> <FormLabel>{t('careers_form.course')}</FormLabel> <Input disabled value={studentProfile.courseAppliedFor} /> </FormItem>
                    
                    {/* Editable fields */}
                    <FormField control={form.control} name="motherName" render={({ field }) => ( <FormItem> <FormLabel>{t('careers_form.mother_name')}</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                    <FormField control={form.control} name="candidateMobile" render={({ field }) => ( <FormItem> <FormLabel>{t('careers_form.candidate_mobile')}</FormLabel> <FormControl><Input placeholder="+91 12345 67890" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                    <FormField control={form.control} name="admissionDate" render={({ field }) => ( <FormItem> <FormLabel>{t('careers_form.admission_date')}</FormLabel> <FormControl><Input type="date" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                    <FormField control={form.control} name="category" render={({ field }) => ( <FormItem> <FormLabel>{t('careers_form.category')}</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                    <FormField control={form.control} name="caste" render={({ field }) => ( <FormItem> <FormLabel>{t('careers_form.caste')}</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                    <FormField control={form.control} name="religion" render={({ field }) => ( <FormItem> <FormLabel>{t('careers_form.religion')}</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                    <FormField control={form.control} name="nationality" render={({ field }) => ( <FormItem> <FormLabel>{t('careers_form.nationality')}</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                    <FormField control={form.control} name="motherTongue" render={({ field }) => ( <FormItem> <FormLabel>{t('careers_form.mother_tongue')}</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                    <FormField control={form.control} name="bloodGroup" render={({ field }) => ( <FormItem> <FormLabel>{t('careers_form.blood_group')}</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                    <FormField control={form.control} name="fatherOccupation" render={({ field }) => ( <FormItem> <FormLabel>{t('careers_form.father_occupation')}</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                    <FormField control={form.control} name="motherOccupation" render={({ field }) => ( <FormItem> <FormLabel>{t('careers_form.mother_occupation')}</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                    <FormField control={form.control} name="identificationMarks" render={({ field }) => ( <FormItem className="md:col-span-2"> <FormLabel>{t('careers_form.identification_marks')}</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                </div>
                
                <div className="space-y-4">
                    <FormLabel>{t('careers_form.photo_title')}</FormLabel>
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-32 h-40 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted overflow-hidden">
                           {photoPreview ? (
                             <Image src={photoPreview} alt="Student photo" width={128} height={160} className="object-cover w-full h-full" />
                           ) : (
                             <span className="text-xs text-muted-foreground text-center p-2">{t('careers_form.photo_placeholder')}</span>
                           )}
                        </div>
                        <FormField control={form.control} name="photoDataUri" render={({ field }) => (
                          <FormItem>
                            <FormControl>
                                <Button asChild variant="outline" type="button">
                                    <label>
                                        <Upload className="mr-2 h-4 w-4" />
                                        {t('careers_form.upload_photo')}
                                        <Input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                                    </label>
                                </Button>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                <FormField
                    control={form.control}
                    name="sex"
                    render={({ field }) => (
                         <FormItem className="space-y-3">
                            <FormLabel>{t('careers_form.sex')}</FormLabel>
                            <FormControl>
                                <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex items-center gap-4"
                                >
                                    <FormItem className="flex items-center space-x-2">
                                        <RadioGroupItem value="male" id="male" />
                                        <Label htmlFor="male" className="font-normal">{t('careers_form.male')}</Label>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-2">
                                        <RadioGroupItem value="female" id="female" />
                                        <Label htmlFor="female" className="font-normal">{t('careers_form.female')}</Label>
                                    </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="maritalStatus"
                    render={({ field }) => (
                         <FormItem className="space-y-3">
                            <FormLabel>{t('careers_form.marital_status')}</FormLabel>
                            <FormControl>
                                <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex items-center gap-4"
                                >
                                    <FormItem className="flex items-center space-x-2">
                                        <RadioGroupItem value="yes" id="married_yes" />
                                        <Label htmlFor="married_yes" className="font-normal">{t('careers_form.married_yes')}</Label>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-2">
                                        <RadioGroupItem value="no" id="married_no" />
                                        <Label htmlFor="married_no" className="font-normal">{t('careers_form.married_no')}</Label>
                                    </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
          </CardContent>
        </Card>
        
        <div className="space-y-8">
            <AddressSection type="localAddress" />
            <AddressSection type="permanentAddress" />
        </div>

        <Card>
            <CardHeader>
                <CardTitle>{t('careers_form.guardian_address_title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormField control={form.control} name="guardianAddress.guardianName" render={({ field }) => ( <FormItem><FormLabel>{t('careers_form.guardian_name')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="guardianAddress.guardianOccupation" render={({ field }) => ( <FormItem><FormLabel>{t('careers_form.guardian_occupation')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="guardianAddress.relationWithGuardian" render={({ field }) => ( <FormItem><FormLabel>{t('careers_form.relation_with_guardian')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="guardianAddress.guardianEmail" render={({ field }) => ( <FormItem><FormLabel>{t('careers_form.guardian_email')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="guardianAddress.mobile" render={({ field }) => ( <FormItem><FormLabel>{t('careers_form.guardian_mobile')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="guardianAddress.landline" render={({ field }) => ( <FormItem><FormLabel>{t('careers_form.guardian_landline')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                 </div>
                 <FormField control={form.control} name="guardianAddress.address" render={({ field }) => ( <FormItem><FormLabel>{t('careers_form.address')}</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
                 <FormField control={form.control} name="guardianAddress.pin" render={({ field }) => ( <FormItem><FormLabel>{t('careers_form.pin')}</FormLabel><FormControl><Input {...field} className="w-1/2 md:w-1/4" /></FormControl><FormMessage /></FormItem> )} />
            </CardContent>
        </Card>

        <AcademicSection gradeLevel="10th" />
        <AcademicSection gradeLevel="12th" />
        
        <Card>
            <CardHeader><CardTitle>{t('careers_form.last_exam_details_title')}</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="lastQualifyingExam.lastExamName" render={({ field }) => ( <FormItem><FormLabel>{t('careers_form.last_exam_name')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="lastQualifyingExam.examYear" render={({ field }) => ( <FormItem><FormLabel>{t('careers_form.exam_year')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="lastQualifyingExam.boardOrUnivName" render={({ field }) => ( <FormItem><FormLabel>{t('careers_form.board_or_univ')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="lastQualifyingExam.durationOfYear" render={({ field }) => ( <FormItem><FormLabel>{t('careers_form.duration_of_year')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="lastQualifyingExam.totalMarksObtained" render={({ field }) => ( <FormItem><FormLabel>{t('careers_form.total_marks_obtained')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="lastQualifyingExam.totalMaxMarks" render={({ field }) => ( <FormItem><FormLabel>{t('careers_form.total_max_marks')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="lastQualifyingExam.class" render={({ field }) => ( <FormItem><FormLabel>{t('careers_form.class')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="lastQualifyingExam.percentageOfMarks" render={({ field }) => ( <FormItem><FormLabel>{t('careers_form.percentage_of_marks')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            </CardContent>
        </Card>

        <Card>
            <CardHeader><CardTitle>{t('careers_form.declaration_title')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground italic">{t('careers_form.declaration_text')}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="declarationDate" render={({ field }) => ( <FormItem><FormLabel>{t('careers_form.date')}</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="declarationPlace" render={({ field }) => ( <FormItem><FormLabel>{t('careers_form.place')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
                 <div className="pt-8 text-right">
                    <div className="border-t border-dashed w-1/3 ml-auto"></div>
                    <p className="text-sm font-semibold mt-2">{t('careers_form.signature_of_student')}</p>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>{t('careers_form.instructions_title')}</CardTitle>
            </CardHeader>
            <CardContent>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>{t('careers_form.instruction_1')}</li>
                    <li>{t('careers_form.instruction_2')}</li>
                    <li>{t('careers_form.instruction_3')}</li>
                    <li>{t('careers_form.instruction_4')}</li>
                    <li>{t('careers_form.instruction_5')}</li>
                    <li>{t('careers_form.instruction_6')}</li>
                    <li>{t('careers_form.instruction_7')}</li>
                    <li>{t('careers_form.instruction_8')}</li>
                    <li>{t('careers_form.instruction_9')}</li>
                </ol>
            </CardContent>
        </Card>
        
        {loading && uploadProgress !== null && (
          <div className="space-y-2">
              <Label>Uploading photo...</Label>
              <Progress value={uploadProgress} />
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : <><Save className="mr-2" /> {t('careers_form.submit_button')}</>}
        </Button>
      </form>
    </Form>
  );
}
