

'use client';
import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
import { AlertTriangle, Inbox } from 'lucide-react';

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

  const renderContent = () => {
    if (loading) {
        return (
            <div className="space-y-2">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
        )
    }

    if (messages.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-64 border-2 border-dashed rounded-lg">
                <Inbox className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold">Message Box is Empty</h3>
                <p>No new messages from the contact form.</p>
            </div>
        )
    }

    return (
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
                                {message.createdAt?.toDate ? format(message.createdAt.toDate(), 'PP') : 'N/A'}
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
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Messages</CardTitle>
        <CardDescription>List of all messages received through the contact form.</CardDescription>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}
