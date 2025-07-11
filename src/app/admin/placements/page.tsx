// src/app/admin/placements/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Trash2, UserPlus, Image as ImageIcon, GraduationCap } from 'lucide-react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { uploadFileWithProgress } from '@/lib/uploader';
import { Progress } from '@/components/ui/progress';
import { logActivity } from '@/lib/activity-logger';
import { Form, FormField, FormItem } from '@/components/ui/form';

const placementSchema = z.object({
    name: z.string().min(2, "Name is required."),
    company: z.string().min(2, "Company name is required."),
    role: z.string().min(2, "Role is required."),
    year: z.string().min(4, "Year must be 4 digits.").max(4, "Year must be 4 digits."),
    photo: z.instanceof(File).refine(file => file.size > 0, 'Photo is required.').refine(file => file.size < 5 * 1024 * 1024, 'Photo size must be less than 5MB.'),
});

type PlacementFormValues = z.infer<typeof placementSchema>;

type Placement = {
    id: string;
    name: string;
    company: string;
    role: string;
    year: string;
    photoUrl: string;
    publicId: string;
};

export default function PlacementsAdminPage() {
    const [placements, setPlacements] = useState<Placement[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const { toast } = useToast();

    const form = useForm<PlacementFormValues>({
        resolver: zodResolver(placementSchema),
        defaultValues: { name: "", company: "", role: "", year: new Date().getFullYear().toString() },
    });

    useEffect(() => {
        const fetchPlacements = async () => {
            if (!db) return;
            setLoading(true);
            try {
                const q = query(collection(db, 'placements'), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Placement[];
                setPlacements(items);
            } catch (error) {
                console.error("Error fetching placements: ", error);
                toast({ variant: 'destructive', title: 'Error fetching placements.' });
            } finally {
                setLoading(false);
            }
        };
        fetchPlacements();
    }, [toast]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            form.setValue('photo', file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };
    
    const onSubmit = async (values: PlacementFormValues) => {
        setIsSubmitting(true);
        setUploadProgress(0);
        
        try {
            const responseData = await uploadFileWithProgress('/api/upload', values.photo, {
              onProgress: setUploadProgress
            });

            const { secure_url, public_id } = responseData;
            
            const newDocData: Omit<Placement, 'id'> & { createdAt: any } = {
                name: values.name,
                company: values.company,
                role: values.role,
                year: values.year,
                photoUrl: secure_url,
                publicId: public_id,
                createdAt: serverTimestamp(),
            };

            const docRef = await addDoc(collection(db, "placements"), newDocData);

            await logActivity('placement_added', {
                description: `New placement added: ${values.name} at ${values.company}.`
            });
            
            setPlacements(prev => [{...newDocData, id: docRef.id } as Placement, ...prev]);

            toast({ title: 'Placement Added!', description: `${values.name} has been added.` });
            form.reset({ name: "", company: "", role: "", year: new Date().getFullYear().toString() });
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
    
    const handleDelete = async (placement: Placement) => {
        if (!db) return;
        
        const originalPlacements = [...placements];
        setPlacements(prev => prev.filter(p => p.id !== placement.id));

        try {
            await fetch('/api/delete-media', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ publicId: placement.publicId, account: 'main' })
            });

            await deleteDoc(doc(db, 'placements', placement.id));
            toast({ title: 'Placement Deleted', description: `${placement.name} has been removed.` });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Deletion Failed', description: error.message });
            setPlacements(originalPlacements);
        }
    };

    return (
        <div className="grid gap-8 md:grid-cols-3">
            <Card className="md:col-span-1">
                <CardHeader>
                    <CardTitle>Add Placement</CardTitle>
                    <CardDescription>Showcase a student's career success.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField name="name" control={form.control} render={({ field }) => (
                            <FormItem><Label>Student Name</Label><Input {...field} placeholder="e.g., Rohit Kumar" /></FormItem>
                        )} />
                        <FormField name="company" control={form.control} render={({ field }) => (
                            <FormItem><Label>Company</Label><Input {...field} placeholder="e.g., Tech Solutions Inc." /></FormItem>
                        )} />
                        <FormField name="role" control={form.control} render={({ field }) => (
                            <FormItem><Label>Role / Position</Label><Input {...field} placeholder="e.g., Software Developer" /></FormItem>
                        )} />
                        <FormField name="year" control={form.control} render={({ field }) => (
                            <FormItem><Label>Placement Year</Label><Input type="number" {...field} /></FormItem>
                        )} />
                         <FormField name="photo" control={form.control} render={({ field }) => (
                            <FormItem>
                                <Label>Student Photo</Label>
                                <div className="flex items-center gap-4">
                                     <div className="w-20 h-20 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted overflow-hidden">
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
                            {isSubmitting ? 'Adding...' : 'Add Placement'}
                        </Button>
                    </form>
                    </Form>
                </CardContent>
            </Card>

            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle>Current Placements</CardTitle>
                    <CardDescription>Manage existing placement records.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {loading ? <p>Loading...</p> : placements.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {placements.map(p => (
                                <Card key={p.id} className="p-4 text-center relative group">
                                    <Image src={p.photoUrl} alt={p.name} width={120} height={120} className="rounded-full mx-auto mb-4 border-4 border-primary/20" />
                                    <p className="font-bold">{p.name}</p>
                                    <p className="text-sm text-primary">{p.role}</p>
                                    <p className="text-xs text-muted-foreground">{p.company} ({p.year})</p>
                                    <Button
                                        size="icon"
                                        variant="destructive"
                                        className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleDelete(p)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-10">No placements added yet.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
