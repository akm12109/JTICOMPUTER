
// src/app/admin/instructors/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Trash2, UserPlus, Image as ImageIcon, User, Users, Star } from 'lucide-react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState, useEffect } from 'react';
import { db_secondary as db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { uploadFileWithProgress } from '@/lib/uploader';
import { Progress } from '@/components/ui/progress';
import { logActivity } from '@/lib/activity-logger';
import { Form, FormField, FormItem } from '@/components/ui/form';

const instructorSchema = z.object({
    name: z.string().min(2, "Name is required."),
    position: z.string().min(2, "Position/role is required."),
    degree: z.string().optional(),
    category: z.enum(['Director', 'Main Faculty', 'Lab Instructor', 'Lab Assistant']),
    photo: z.instanceof(File).refine(file => file.size > 0, 'Photo is required.').refine(file => file.size < 5 * 1024 * 1024, 'Photo size must be less than 5MB.'),
});

type InstructorFormValues = z.infer<typeof instructorSchema>;

type Instructor = {
    id: string;
    name: string;
    position: string;
    degree?: string;
    category: string;
    photoUrl: string;
    publicId: string;
    createdAt: { toDate: () => Date };
};

const categoryIcons = {
    'Director': <User className="h-5 w-5" />,
    'Main Faculty': <Users className="h-5 w-5" />,
    'Lab Instructor': <UserPlus className="h-5 w-5" />,
    'Lab Assistant': <Star className="h-5 w-5" />
};

export default function InstructorsPage() {
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const { toast } = useToast();

    const form = useForm<InstructorFormValues>({
        resolver: zodResolver(instructorSchema),
        defaultValues: { name: "", position: "", degree: "", category: "Main Faculty" },
    });

    useEffect(() => {
        const fetchInstructors = async () => {
            if (!db) return;
            setLoading(true);
            try {
                const q = query(collection(db, 'instructors'), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Instructor[];
                setInstructors(items);
            } catch (error) {
                console.error("Error fetching instructors: ", error);
                toast({ variant: 'destructive', title: 'Error fetching instructors.' });
            } finally {
                setLoading(false);
            }
        };
        fetchInstructors();
    }, [toast]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            form.setValue('photo', file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };
    
    const onSubmit = async (values: InstructorFormValues) => {
        setIsSubmitting(true);
        setUploadProgress(0);
        
        try {
            const responseData = await uploadFileWithProgress('/api/upload', values.photo, {
              onProgress: setUploadProgress
            }, false, 'main'); // account is 'main'

            const { secure_url, public_id } = responseData;
            
            const newDocData = {
                name: values.name,
                position: values.position,
                degree: values.degree,
                category: values.category,
                photoUrl: secure_url,
                publicId: public_id,
                createdAt: serverTimestamp(),
            };

            const docRef = await addDoc(collection(db, "instructors"), newDocData);

            await logActivity('instructor_added', {
                description: `New instructor added: ${values.name} (${values.position})`
            });
            
            setInstructors(prev => [{...newDocData, id: docRef.id, createdAt: {toDate: () => new Date()}} as Instructor, ...prev]);

            toast({ title: 'Instructor Added!', description: `${values.name} has been added.` });
            form.reset();
            setPhotoPreview(null);
            const fileInput = document.getElementById('photo-input') as HTMLInputElement;
            if(fileInput) fileInput.value = "";

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Upload Failed', description: error.message });
        } finally {
            setIsSubmitting(false);
            setUploadProgress(null);
        }
    };
    
    const handleDelete = async (instructor: Instructor) => {
        if (!db) return;
        
        const originalInstructors = [...instructors];
        setInstructors(prev => prev.filter(i => i.id !== instructor.id));

        try {
            await fetch('/api/delete-media', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ publicId: instructor.publicId, account: 'main' })
            });

            await deleteDoc(doc(db, 'instructors', instructor.id));
            toast({ title: 'Instructor Deleted', description: `${instructor.name} has been removed.` });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Deletion Failed', description: error.message });
            setInstructors(originalInstructors);
        }
    };

    const groupedInstructors = instructors.reduce((acc, instructor) => {
        const category = instructor.category || 'Uncategorized';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(instructor);
        return acc;
    }, {} as Record<string, Instructor[]>);

    const categoryOrder: (keyof typeof groupedInstructors)[] = ['Director', 'Main Faculty', 'Lab Instructor', 'Lab Assistant'];


    return (
        <div className="grid gap-8 md:grid-cols-3">
            <Card className="md:col-span-1">
                <CardHeader>
                    <CardTitle>Add Instructor</CardTitle>
                    <CardDescription>Add a new faculty member to the "About Us" page.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField name="name" control={form.control} render={({ field }) => (
                            <FormItem><Label>Full Name</Label><Input {...field} placeholder="e.g., Priti Kumari" /></FormItem>
                        )} />
                        <FormField name="position" control={form.control} render={({ field }) => (
                            <FormItem><Label>Position / Role</Label><Input {...field} placeholder="e.g., Branch Director" /></FormItem>
                        )} />
                        <FormField name="degree" control={form.control} render={({ field }) => (
                            <FormItem><Label>Degree (Optional)</Label><Input {...field} placeholder="e.g., MCA, B.Tech" /></FormItem>
                        )} />
                        <FormField name="category" control={form.control} render={({ field }) => (
                            <FormItem>
                                <Label>Category</Label>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Director">Director</SelectItem>
                                        <SelectItem value="Main Faculty">Main Faculty</SelectItem>
                                        <SelectItem value="Lab Instructor">Lab Instructor</SelectItem>
                                        <SelectItem value="Lab Assistant">Lab Assistant</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )} />
                         <FormField name="photo" control={form.control} render={({ field }) => (
                            <FormItem>
                                <Label>Profile Photo</Label>
                                <div className="flex items-center gap-4">
                                     <div className="w-20 h-20 rounded-full border-2 border-dashed flex items-center justify-center bg-muted overflow-hidden">
                                        {photoPreview ? (
                                            <Image src={photoPreview} alt="Photo preview" width={80} height={80} className="object-cover w-full h-full" />
                                        ) : ( <ImageIcon className="h-8 w-8 text-muted-foreground" /> )}
                                    </div>
                                    <Input id="photo-input" type="file" onChange={handleFileChange} accept="image/*" />
                                </div>
                            </FormItem>
                        )} />
                        
                        {isSubmitting && uploadProgress !== null && <Progress value={uploadProgress} />}

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                            {isSubmitting ? 'Adding...' : 'Add Instructor'}
                        </Button>
                    </form>
                    </Form>
                </CardContent>
            </Card>

            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle>Current Instructors</CardTitle>
                    <CardDescription>Manage existing faculty members.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {loading ? <p>Loading...</p> : 
                     categoryOrder.map(category => (
                        groupedInstructors[category] && (
                             <div key={category}>
                                <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                                   {categoryIcons[category as keyof typeof categoryIcons]} {category}
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {groupedInstructors[category].map(inst => (
                                        <Card key={inst.id} className="p-4 relative group">
                                            <div className="flex items-center gap-4">
                                                <Image src={inst.photoUrl} alt={inst.name} width={64} height={64} className="rounded-full h-16 w-16 object-cover" />
                                                <div>
                                                    <p className="font-bold">{inst.name}</p>
                                                    <p className="text-sm text-primary">{inst.position}</p>
                                                    <p className="text-xs text-muted-foreground">{inst.degree}</p>
                                                </div>
                                            </div>
                                             <Button
                                                size="icon"
                                                variant="destructive"
                                                className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => handleDelete(inst)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )
                     ))
                    }
                    {!loading && instructors.length === 0 && (
                        <p className="text-center text-muted-foreground py-10">No instructors added yet.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
