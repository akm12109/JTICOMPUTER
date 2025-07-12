// src/app/notes/[noteId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db_secondary } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, ArrowLeft, ChevronLeft, ChevronRight, Download, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// PDF.js worker setup
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type Note = {
  id: string;
  title: string;
  description: string;
  url: string;
};

export default function NoteViewerPage() {
  const params = useParams();
  const router = useRouter();
  const noteId = params.noteId as string;
  const { user, loading: authLoading } = useAuth();

  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [isPdfLoading, setIsPdfLoading] = useState(true);
  const [pdfError, setPdfError] = useState<string | null>(null);

  useEffect(() => {
    if (!noteId) return;

    const fetchNote = async () => {
      setLoading(true);
      try {
        if (!db_secondary) throw new Error("Database not available");
        const docRef = doc(db_secondary, 'notes', noteId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setNote({ id: docSnap.id, ...docSnap.data() } as Note);
        } else {
          setError('Note not found.');
        }
      } catch (err) {
        console.error("Error fetching note:", err);
        setError('Failed to load note details.');
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [noteId]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
    setPageNumber(1);
    setIsPdfLoading(false);
  }

  function onDocumentLoadError(error: Error): void {
    console.error("PDF Load Error:", error);
    setPdfError("Failed to load PDF. The file may be corrupted or inaccessible.");
    setIsPdfLoading(false);
  }

  const changePage = (offset: number) => {
    setPageNumber(prevPageNumber => prevPageNumber + offset);
  };

  const previousPage = () => {
    changePage(-1);
  };

  const nextPage = () => {
    changePage(1);
  };

  const showLoginWall = !authLoading && !user && pageNumber > 1;

  if (loading || authLoading) {
    return (
      <div className="container mx-auto p-8 space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-[80vh] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container p-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!note) return null;

  return (
    <div className="bg-muted">
      <div className="container mx-auto p-4 md:p-8">
        <header className="mb-6">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Notes
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold mt-4">{note.title}</h1>
          <p className="text-muted-foreground">{note.description}</p>
        </header>

        <div className="bg-background p-2 rounded-lg shadow-md">
          {pdfError ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>PDF Error</AlertTitle>
              <AlertDescription>{pdfError}</AlertDescription>
            </Alert>
          ) : (
            <div className="relative">
              <Document
                file={note.url}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={<Skeleton className="h-[80vh] w-full" />}
                className="flex justify-center"
              >
                <div className="relative">
                  <Page
                    pageNumber={pageNumber}
                    width={Math.min(window.innerWidth * 0.85, 800)}
                    loading={<Skeleton className="h-[80vh] w-[800px]" />}
                  />
                  {showLoginWall && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-white text-center p-8 rounded-md">
                        <Lock className="h-16 w-16 mb-4" />
                        <h2 className="text-2xl font-bold">Unlock Full Access</h2>
                        <p className="max-w-md mt-2">To view the entire document, please log in to your student account.</p>
                        <Button asChild className="mt-6">
                            <Link href="/login">Login to Continue</Link>
                        </Button>
                    </div>
                  )}
                </div>
              </Document>
            </div>
          )}
          
          {!isPdfLoading && !pdfError && numPages && (
            <div className="flex items-center justify-between p-4 bg-muted rounded-b-lg">
                <Button onClick={previousPage} disabled={pageNumber <= 1}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                </Button>
                <div className="flex items-center gap-4">
                  <p className="text-sm text-muted-foreground">
                    Page {pageNumber} of {numPages}
                  </p>
                  <Button asChild variant="secondary">
                     <a href={note.url} target="_blank" rel="noopener noreferrer">
                       <Download className="mr-2 h-4 w-4" /> Download
                     </a>
                  </Button>
                </div>
                <Button onClick={nextPage} disabled={pageNumber >= numPages || showLoginWall}>
                    Next <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
