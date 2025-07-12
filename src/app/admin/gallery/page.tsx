
'use client';
import { useState, useEffect } from 'react';
import { db_secondary as db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Trash2, Image as ImageIcon, Video, Link as LinkIcon } from 'lucide-react';
import Image from 'next/image';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { uploadFileWithProgress } from '@/lib/uploader';
import { Progress } from '@/components/ui/progress';
import { logActivity } from '@/lib/activity-logger';


type GalleryItem = {
    id: string;
    url: string;
    publicId: string;
    type: 'image' | 'video';
    alt?: string;
    title?: string;
    createdAt: { toDate: () => Date };
};

export default function GalleryAdminPage() {
    // State for file upload
    const [file, setFile] = useState<File | null>(null);
    const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
    const [altText, setAltText] = useState('');
    const [title, setTitle] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);

    // State for URL upload
    const [url, setUrl] = useState('');
    const [urlMediaType, setUrlMediaType] = useState<'image' | 'video'>('image');
    const [urlAltText, setUrlAltText] = useState('');
    const [urlTitle, setUrlTitle] = useState('');
    const [isUploadingFromUrl, setIsUploadingFromUrl] = useState(false);

    const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
    const [loadingItems, setLoadingItems] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchItems = async () => {
            if (!db) return;
            setLoadingItems(true);
            try {
                const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as GalleryItem[];
                setGalleryItems(items);
            } catch (error) {
                console.error("Error fetching gallery items: ", error);
                toast({ variant: 'destructive', title: 'Error fetching gallery items.' });
            } finally {
                setLoadingItems(false);
            }
        };
        fetchItems();
    }, [toast]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
            if (selectedFile.size > MAX_FILE_SIZE) {
                toast({
                    variant: 'destructive',
                    title: 'File Too Large',
                    description: 'Please select a file smaller than 25 MB.',
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
        if (mediaType === 'image' && !altText) {
            toast({ variant: 'destructive', title: 'Please provide alt text for the image.' });
            return;
        }
        if (mediaType === 'video' && !title) {
            toast({ variant: 'destructive', title: 'Please provide a title for the video.' });
            return;
        }
        
        setUploading(true);
        setUploadProgress(0);

        try {
            const responseData = await uploadFileWithProgress('/api/upload', file, {
              onProgress: setUploadProgress,
            }, false, 'main'); // isNote=false, account='main'

            const { secure_url, public_id } = responseData;
            
            if (!db) {
                throw new Error('Firebase not configured.');
            }
            
            const newDocData: any = {
                url: secure_url,
                publicId: public_id,
                type: mediaType,
                createdAt: serverTimestamp(),
            };
    
            if (mediaType === 'image') newDocData.alt = altText;
            if (mediaType === 'video') newDocData.title = title;
            
            const docRef = await addDoc(collection(db, "gallery"), newDocData);
            
            await logActivity('gallery_upload', {
                description: `New ${mediaType} uploaded to the gallery: "${mediaType === 'image' ? altText : title}".`,
                payload: { url: secure_url }
            });

            const tempNewItem: GalleryItem = {
                id: docRef.id,
                url: secure_url,
                publicId: public_id,
                type: mediaType,
                alt: mediaType === 'image' ? altText : undefined,
                title: mediaType === 'video' ? title : undefined,
                createdAt: { toDate: () => new Date() },
            };
            setGalleryItems(prev => [tempNewItem, ...prev]);

            toast({ title: 'Success!', description: 'Media uploaded successfully.' });
            setFile(null);
            setAltText('');
            setTitle('');
        } catch (error: any) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Upload failed', description: error.message });
        } finally {
            setUploading(false);
            setUploadProgress(null);
        }
    };
    
    const handleUrlUploadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.startsWith('http')) {
            toast({ variant: 'destructive', title: 'Please enter a valid URL.' });
            return;
        }
        if (urlMediaType === 'image' && !urlAltText) {
            toast({ variant: 'destructive', title: 'Please provide alt text for the image.' });
            return;
        }
        if (urlMediaType === 'video' && !urlTitle) {
            toast({ variant: 'destructive', title: 'Please provide a title for the video.' });
            return;
        }
        setIsUploadingFromUrl(true);
        try {
            const uploadResponse = await fetch('/api/upload-from-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, account: 'main' }),
            });
            const responseData = await uploadResponse.json();
            if (!uploadResponse.ok) {
                throw new Error(responseData.error || 'Failed to upload from URL.');
            }
            const { secure_url, public_id } = responseData;
            
            if (!db) {
                throw new Error('Firebase not configured.');
            }

            const newDocData: any = {
                url: secure_url,
                publicId: public_id,
                type: urlMediaType,
                createdAt: serverTimestamp(),
            };

            if (urlMediaType === 'image') newDocData.alt = urlAltText;
            if (urlMediaType === 'video') newDocData.title = urlTitle;

            const docRef = await addDoc(collection(db, "gallery"), newDocData);
            
            await logActivity('gallery_upload', {
                description: `New ${urlMediaType} added to gallery from URL: "${urlMediaType === 'image' ? urlAltText : urlTitle}".`,
                payload: { url: secure_url }
            });

            const tempNewItem: GalleryItem = {
                id: docRef.id,
                url: secure_url,
                publicId: public_id,
                type: urlMediaType,
                alt: urlMediaType === 'image' ? urlAltText : undefined,
                title: urlMediaType === 'video' ? urlTitle : undefined,
                createdAt: { toDate: () => new Date() },
            };
            setGalleryItems(prev => [tempNewItem, ...prev]);
            
            toast({ title: 'Success!', description: 'Media added from URL successfully.' });
            setUrl('');
            setUrlAltText('');
            setUrlTitle('');
        } catch (error: any) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Upload failed', description: error.message });
        } finally {
            setIsUploadingFromUrl(false);
        }
    };

    const handleDelete = async (item: GalleryItem) => {
        if (!db) return;
        
        const originalItems = [...galleryItems];
        // Optimistically remove from UI
        setGalleryItems(prev => prev.filter(i => i.id !== item.id));

        try {
            const deleteResponse = await fetch('/api/delete-media', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    publicId: item.publicId,
                    resourceType: item.type,
                    account: 'main'
                })
            });

            if (!deleteResponse.ok) {
                let errorMessage = `Failed to delete from Cloudinary: ${deleteResponse.statusText}`;
                try {
                    const errorData = await deleteResponse.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    // Response was not JSON, stick with the status text
                }
                throw new Error(errorMessage);
            }

            await deleteDoc(doc(db, 'gallery', item.id));

            toast({ title: 'Deleted Successfully', description: 'Media removed from gallery and Cloudinary.' });
        } catch (error: any) {
            console.error('Deletion failed:', error);
            toast({ variant: 'destructive', title: 'Deletion Failed', description: error.message });
            // Rollback UI change on failure
            setGalleryItems(originalItems);
        }
    };


    return (
        <div className="grid gap-8 md:grid-cols-3">
            <Card className="md:col-span-1">
                <CardHeader>
                    <CardTitle>Upload to Gallery</CardTitle>
                    <CardDescription>Add new media by uploading a file or providing a URL.</CardDescription>
                </CardHeader>
                 <CardContent>
                     <Tabs defaultValue="file" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="file">Upload File</TabsTrigger>
                            <TabsTrigger value="url">From URL</TabsTrigger>
                        </TabsList>
                        <TabsContent value="file" className="pt-4">
                             <form onSubmit={handleFileUploadSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="media-file">Media File (Max 25MB)</Label>
                                    <Input id="media-file" type="file" onChange={handleFileChange} accept="image/*,video/*" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="media-type">Media Type</Label>
                                    <Select onValueChange={(value: 'image' | 'video') => setMediaType(value)} defaultValue={mediaType}>
                                        <SelectTrigger id="media-type"><SelectValue placeholder="Select media type" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="image">Image</SelectItem>
                                            <SelectItem value="video">Video</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {mediaType === 'image' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="alt-text">Alt Text (for accessibility)</Label>
                                        <Input id="alt-text" value={altText} onChange={(e) => setAltText(e.target.value)} placeholder="e.g., Students in a classroom" />
                                    </div>
                                )}
                                {mediaType === 'video' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="video-title">Video Title</Label>
                                        <Input id="video-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., JTI Campus Tour 2024" />
                                    </div>
                                )}
                                {uploading && uploadProgress !== null && (
                                    <div className="space-y-2">
                                        <Progress value={uploadProgress} />
                                        <p className="text-xs text-muted-foreground text-center">{uploadProgress}%</p>
                                    </div>
                                )}
                                <Button type="submit" className="w-full" disabled={uploading}>
                                    {uploading ? <Loader2 className="animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                    {uploading ? 'Uploading...' : 'Upload Media'}
                                </Button>
                            </form>
                        </TabsContent>
                        <TabsContent value="url" className="pt-4">
                            <form onSubmit={handleUrlUploadSubmit} className="space-y-4">
                                 <div className="space-y-2">
                                    <Label htmlFor="media-url">Media URL</Label>
                                    <Input id="media-url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/image.jpg" />
                                 </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="url-media-type">Media Type</Label>
                                    <Select onValueChange={(value: 'image' | 'video') => setUrlMediaType(value)} defaultValue={urlMediaType}>
                                        <SelectTrigger id="url-media-type"><SelectValue placeholder="Select media type" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="image">Image</SelectItem>
                                            <SelectItem value="video">Video</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                 {urlMediaType === 'image' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="url-alt-text">Alt Text (for accessibility)</Label>
                                        <Input id="url-alt-text" value={urlAltText} onChange={(e) => setUrlAltText(e.target.value)} placeholder="e.g., Students in a classroom" />
                                    </div>
                                )}
                                {urlMediaType === 'video' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="url-video-title">Video Title</Label>
                                        <Input id="url-video-title" value={urlTitle} onChange={(e) => setUrlTitle(e.target.value)} placeholder="e.g., JTI Campus Tour 2024" />
                                    </div>
                                )}
                                <Button type="submit" className="w-full" disabled={isUploadingFromUrl}>
                                    {isUploadingFromUrl ? <Loader2 className="animate-spin" /> : <LinkIcon className="mr-2 h-4 w-4" />}
                                    {isUploadingFromUrl ? 'Adding...' : 'Add From URL'}
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle>Current Gallery</CardTitle>
                    <CardDescription>Manage uploaded media.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loadingItems ? (
                        <p>Loading gallery items...</p>
                    ) : galleryItems.length === 0 ? (
                        <div className="text-center text-muted-foreground py-10">No items in the gallery yet.</div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {galleryItems.map(item => (
                                <div key={item.id} className="relative group">
                                    {item.type === 'image' ? (
                                        <Image src={item.url} alt={item.alt || 'Gallery image'} width={150} height={150} className="rounded-md object-cover aspect-square" />
                                    ) : (
                                        <div className="w-full aspect-square bg-black rounded-md flex flex-col items-center justify-center text-white p-2">
                                            <Video className="h-8 w-8" />
                                            <p className="text-xs text-center mt-2 break-words">{item.title}</p>
                                        </div>
                                    )}
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
