

'use client';
import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Trash2, Loader2, PlusCircle, BookOpen, Download, File as FileIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { courseKeys } from '@/lib/course-data';
import { useLanguage } from '@/hooks/use-language';
import { uploadFileWithProgress } from '@/lib/uploader';
import { Progress } from '@/components/ui/progress';
import { logActivity } from '@/lib/activity-logger';

type Note = {
  id: string;
  title: string;
  description: string;
  url: string;
  publicId: string;
  fileName: string;
  fileType: string;
  target: string;
  createdAt: { toDate: () => Date };
};

const noteSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters.' }),
  description: z.string().optional(),
  file: z.instanceof(File).refine(file => file.size > 0, 'File is required.').refine(file => file.size < 50 * 1024 * 1024, 'File size must be less than 50MB.'),
  target: z.string({ required_error: "Please select a target audience." }),
});

type NoteFormValues = z.infer<typeof noteSchema>;

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: { title: '', description: '', target: 'Public' },
  });

  useEffect(() => {
    const fetchNotes = async () => {
      if (!db) { setLoading(false); return; }
      try {
        const q = query(collection(db, 'notes'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const notesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Note[];
        setNotes(notesData);
      } catch (error) {
        console.error("Error fetching notes: ", error);
        toast({ variant: 'destructive', title: 'Error fetching notes.' });
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, [toast]);

  const onSubmit = async (values: NoteFormValues) => {
    if (!db) return;
    setIsSubmitting(true);
    setUploadProgress(0);
    
    try {
        // Step 1: Upload file to Cloudinary
        const responseData = await uploadFileWithProgress('/api/upload', values.file, {
          onProgress: setUploadProgress
        });

        const { secure_url, public_id } = responseData;
        
        // Step 2: Save metadata to Firestore
        const newNoteData = {
            title: values.title,
            description: values.description,
            url: secure_url,
            publicId: public_id,
            fileName: values.file.name,
            fileType: values.file.type,
            target: values.target,
            createdAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, 'notes'), newNoteData);
        
        await logActivity('note_published', {
            description: `New note published: "${values.title}" for ${values.target}.`
        });

        // Optimistically update UI
        setNotes(prev => [{ ...newNoteData, id: docRef.id, createdAt: { toDate: () => new Date() } } as Note, ...prev]);
        toast({ title: 'Note Published!', description: 'The note is now available for students.' });
        form.reset();
        // Reset file input
        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        if(fileInput) fileInput.value = "";

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to publish note.' });
    } finally {
        setIsSubmitting(false);
        setUploadProgress(null);
    }
  };

  const handleDelete = async (note: Note) => {
    if (!db) return;
     // Optimistically remove from UI
    const originalNotes = [...notes];
    setNotes(prev => prev.filter(n => n.id !== note.id));
    
    try {
        // Delete from Cloudinary
        const deleteResponse = await fetch('/api/delete-media', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicId: note.publicId })
        });

        if (!deleteResponse.ok) {
            const errorData = await deleteResponse.json();
            throw new Error(errorData.error || 'Failed to delete from Cloudinary.');
        }

        // Delete from Firestore
        await deleteDoc(doc(db, 'notes', note.id));
        toast({ title: 'Note Deleted' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete note.' });
        // Rollback UI change on failure
        setNotes(originalNotes);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Upload Note</CardTitle>
          <CardDescription>Publish a new note or study material for students.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control} name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl><Input placeholder="e.g., Chapter 1: Introduction" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              <FormField
                control={form.control} name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl><Textarea placeholder="Briefly describe the note..." {...field} rows={3} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField
                    control={form.control} name="target"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Target Audience</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select who to send this note to" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Public">Public (All Students)</SelectItem>
                            {courseKeys.map(key => (
                            <SelectItem key={key} value={t(`courses_data.${key}.title`)}>
                                {t(`courses_data.${key}.title`)}
                            </SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              <FormField
                control={form.control} name="file"
                render={({ field: { onChange, value, ...rest } }) => (
                  <FormItem>
                    <FormLabel>File (PDF, DOC, etc.)</FormLabel>
                    <FormControl><Input id="file-input" type="file" {...rest} onChange={e => onChange(e.target.files?.[0])} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                
                {isSubmitting && uploadProgress !== null && (
                    <div className="space-y-1">
                        <Progress value={uploadProgress} />
                        <p className="text-xs text-center text-muted-foreground">{uploadProgress}% uploaded</p>
                    </div>
                )}
                
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : <><PlusCircle className="mr-2" /> Upload Note</>}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Uploaded Notes</CardTitle>
          <CardDescription>List of all available notes.</CardDescription>
        </CardHeader>
        <CardContent>
            {loading ? (
                 <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
            ) : notes.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-48 border-2 border-dashed rounded-lg">
                    <BookOpen className="h-10 w-10 mb-2"/>
                    <p>No notes have been uploaded yet.</p>
                </div>
            ) : (
                <Accordion type="single" collapsible className="w-full">
                    {notes.map(note => (
                        <AccordionItem value={note.id} key={note.id}>
                            <AccordionTrigger>
                                <div className="flex justify-between items-center w-full pr-4">
                                    <div className="text-left">
                                        <p className="font-medium flex items-center gap-2"><FileIcon className="h-4 w-4 text-muted-foreground"/>{note.title}</p>
                                        <p className="text-xs text-muted-foreground ml-6">
                                            Target: <span className="font-semibold">{note.target}</span> | Published on {format(note.createdAt.toDate(), 'PP')}
                                        </p>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-4 bg-muted/50 rounded-md">
                                <p className="whitespace-pre-wrap text-sm">{note.description || "No description provided."}</p>
                                <div className="flex gap-2 mt-4">
                                    <Button asChild size="sm" variant="secondary">
                                        <a href={note.url} target="_blank" rel="noopener noreferrer">
                                            <Download className="mr-2 h-4 w-4" /> Download
                                        </a>
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleDelete(note)}>
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </Button>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
