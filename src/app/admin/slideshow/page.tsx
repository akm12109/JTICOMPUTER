// src/app/admin/slideshow/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { db_secondary as db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { uploadFileWithProgress } from '@/lib/uploader';
import { Progress } from '@/components/ui/progress';

type SlideshowImage = {
    id: string;
    url: string;
    publicId: string;
    fileName: string;
    createdAt: { toDate: () => Date };
};

export default function SlideshowAdminPage() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [images, setImages] = useState<SlideshowImage[]>([]);
    const [loadingItems, setLoadingItems] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchItems = async () => {
            if (!db) return;
            setLoadingItems(true);
            try {
                const q = query(collection(db, 'slideshowImages'), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SlideshowImage[];
                setImages(items);
            } catch (error) {
                console.error("Error fetching slideshow images: ", error);
                toast({ variant: 'destructive', title: 'Error fetching images.' });
            } finally {
                setLoadingItems(false);
            }
        };
        fetchItems();
    }, [toast]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
            if (selectedFile.size > MAX_FILE_SIZE) {
                toast({
                    variant: 'destructive',
                    title: 'File Too Large',
                    description: 'Please select an image smaller than 10 MB.',
                });
                setFile(null);
                e.target.value = ''; // Reset the input
                return;
            }
            setFile(selectedFile);
        }
    };

    const handleFileUploadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            toast({ variant: 'destructive', title: 'Please select a file to upload.' });
            return;
        }
        
        setUploading(true);
        setUploadProgress(0);

        try {
            const responseData = await uploadFileWithProgress('/api/upload', file, {
              onProgress: setUploadProgress,
            }, false, 'main');

            const { secure_url, public_id } = responseData;
            
            if (!db) {
                throw new Error('Firebase not configured.');
            }
            
            const newDocData = {
                url: secure_url,
                publicId: public_id,
                fileName: file.name,
                createdAt: serverTimestamp(),
            };
            
            const docRef = await addDoc(collection(db, "slideshowImages"), newDocData);
            
            const tempNewItem: SlideshowImage = {
                id: docRef.id,
                ...newDocData,
                createdAt: { toDate: () => new Date() },
            };
            setImages(prev => [tempNewItem, ...prev]);

            toast({ title: 'Success!', description: 'Image uploaded to slideshow.' });
            setFile(null);
            const fileInput = document.getElementById('slideshow-file') as HTMLInputElement;
            if (fileInput) fileInput.value = '';

        } catch (error: any) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Upload failed', description: error.message });
        } finally {
            setUploading(false);
            setUploadProgress(null);
        }
    };
    
    const handleDelete = async (item: SlideshowImage) => {
        if (!db) return;
        
        const originalItems = [...images];
        setImages(prev => prev.filter(i => i.id !== item.id));

        try {
            await fetch('/api/delete-media', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    publicId: item.publicId,
                    resourceType: 'image',
                    account: 'main'
                })
            });

            await deleteDoc(doc(db, 'slideshowImages', item.id));

            toast({ title: 'Deleted Successfully', description: 'Image removed from slideshow.' });
        } catch (error: any) {
            console.error('Deletion failed:', error);
            toast({ variant: 'destructive', title: 'Deletion Failed', description: error.message });
            setImages(originalItems);
        }
    };


    return (
        <div className="grid gap-8 md:grid-cols-3">
            <Card className="md:col-span-1">
                <CardHeader>
                    <CardTitle>Upload to Slideshow</CardTitle>
                    <CardDescription>Add new images to the homepage slideshow.</CardDescription>
                </CardHeader>
                 <CardContent>
                     <form onSubmit={handleFileUploadSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="slideshow-file">Image File (Max 10MB)</Label>
                            <Input id="slideshow-file" type="file" onChange={handleFileChange} accept="image/jpeg,image/png,image/webp" />
                        </div>
                        {uploading && uploadProgress !== null && (
                            <div className="space-y-2">
                                <Progress value={uploadProgress} />
                                <p className="text-xs text-muted-foreground text-center">{uploadProgress}%</p>
                            </div>
                        )}
                        <Button type="submit" className="w-full" disabled={uploading}>
                            {uploading ? <Loader2 className="animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                            {uploading ? 'Uploading...' : 'Upload Image'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle>Current Slideshow Images</CardTitle>
                    <CardDescription>Manage images currently in the slideshow.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loadingItems ? (
                        <p>Loading images...</p>
                    ) : images.length === 0 ? (
                        <div className="text-center text-muted-foreground py-10">No images in the slideshow yet.</div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {images.map(item => (
                                <div key={item.id} className="relative group">
                                    <Image src={item.url} alt={item.fileName || 'Slideshow image'} width={150} height={150} className="rounded-md object-cover aspect-square" />
                                    <div className="absolute top-1 right-1">
                                        <Button size="icon" variant="destructive" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(item)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
