'use client';
import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

type Message = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: { toDate: () => Date };
};

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [firebaseConfigured, setFirebaseConfigured] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!db) {
        setFirebaseConfigured(false);
        setLoading(false);
        return;
      }
      try {
        const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const messagesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Message[];
        setMessages(messagesData);
      } catch (error) {
        console.error("Error fetching messages: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, []);

  if (!firebaseConfigured) {
    return (
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Firebase Not Configured</AlertTitle>
            <AlertDescription>
                The backend is not configured correctly. Please provide Firebase credentials in your environment variables.
            </AlertDescription>
        </Alert>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Messages</CardTitle>
        <CardDescription>List of all messages received through the contact form.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
            messages.length === 0 ? (
                 <p className="text-center text-muted-foreground py-8">No messages yet.</p>
            ) : (
                <Accordion type="single" collapsible className="w-full">
                    {messages.map((message, index) => (
                        <AccordionItem value={`item-${index}`} key={message.id}>
                            <AccordionTrigger>
                                <div className="flex justify-between w-full pr-4">
                                    <div className="text-left">
                                        <p className="font-medium">{message.subject}</p>
                                        <p className="text-sm text-muted-foreground">{message.name} ({message.email})</p>
                                    </div>
                                    <p className="text-sm text-muted-foreground self-center">
                                        {format(message.createdAt.toDate(), 'PP')}
                                    </p>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-4 bg-muted/50 rounded-md">
                                {message.message}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            )
        )}
      </CardContent>
    </Card>
  );
}
