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
import { AlertTriangle, Trash2, Loader2, PlusCircle, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

type Notice = {
  id: string;
  title: string;
  message: string;
  createdAt: { toDate: () => Date };
};

const noticeSchema = z.object({
  title: z.string().min(5, { message: 'Title must be at least 5 characters.' }),
  message: z.string().min(10, { message: 'Message must be at least 10 characters.' }),
});

type NoticeFormValues = z.infer<typeof noticeSchema>;

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [firebaseConfigured, setFirebaseConfigured] = useState(true);
  const { toast } = useToast();

  const form = useForm<NoticeFormValues>({
    resolver: zodResolver(noticeSchema),
    defaultValues: { title: '', message: '' },
  });

  useEffect(() => {
    const fetchNotices = async () => {
      if (!db) {
        setFirebaseConfigured(false);
        setLoading(false);
        return;
      }
      try {
        const q = query(collection(db, 'notices'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const noticesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Notice[];
        setNotices(noticesData);
      } catch (error) {
        console.error("Error fetching notices: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNotices();
  }, []);

  const onSubmit = async (values: NoticeFormValues) => {
    if (!db) return;
    setIsSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, 'notices'), {
        ...values,
        createdAt: serverTimestamp(),
      });
      // Add new notice to the top of the list for immediate UI update
      setNotices(prev => [{ ...values, id: docRef.id, createdAt: { toDate: () => new Date() } }, ...prev]);
      toast({ title: 'Notice Published!', description: 'The notice is now visible to students.' });
      form.reset();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to publish notice.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!db) return;
    try {
        await deleteDoc(doc(db, 'notices', id));
        setNotices(prev => prev.filter(n => n.id !== id));
        toast({ title: 'Notice Deleted' });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete notice.' });
    }
  }


  if (!firebaseConfigured) {
    return (
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Firebase Not Configured</AlertTitle>
            <AlertDescription>
                The backend is not configured correctly. Please provide Firebase credentials.
            </AlertDescription>
        </Alert>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Create Notice</CardTitle>
          <CardDescription>Publish a new notice for all students.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Holiday Announcement" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Full notice details..." {...field} rows={5} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : <><PlusCircle className="mr-2" /> Publish Notice</>}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Published Notices</CardTitle>
          <CardDescription>List of all active notices.</CardDescription>
        </CardHeader>
        <CardContent>
            {loading ? (
                 <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                 </div>
            ) : notices.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-48 border-2 border-dashed rounded-lg">
                    <Megaphone className="h-10 w-10 mb-2"/>
                    <p>No notices have been published yet.</p>
                </div>
            ) : (
                <Accordion type="single" collapsible className="w-full">
                    {notices.map(notice => (
                        <AccordionItem value={notice.id} key={notice.id}>
                            <AccordionTrigger>
                                <div className="flex justify-between items-center w-full pr-4">
                                    <div className="text-left">
                                        <p className="font-medium">{notice.title}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Published on {format(notice.createdAt.toDate(), 'PP')}
                                        </p>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-4 bg-muted/50 rounded-md">
                                <p className="whitespace-pre-wrap">{notice.message}</p>
                                <Button size="sm" variant="destructive" className="mt-4" onClick={() => handleDelete(notice.id)}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Notice
                                </Button>
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
