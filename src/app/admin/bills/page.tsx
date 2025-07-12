
'use client';
import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query, doc, deleteDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Trash2, Search, Download, Loader2, Badge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import * as XLSX from 'xlsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Receipt = {
  id: string;
  receiptNo: string;
  studentName: string;
  courseName: string;
  amount: number;
  status: 'paid' | 'unpaid';
  paymentMethod?: string;
  createdAt: { toDate: () => Date };
};

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [firebaseConfigured, setFirebaseConfigured] = useState(true);
  const { toast } = useToast();

  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'paid' | 'unpaid'>('paid');

  useEffect(() => {
    const fetchReceipts = async () => {
      if (!db) {
        setFirebaseConfigured(false);
        setLoading(false);
        return;
      }
      try {
        const q = query(
          collection(db, 'receipts'),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const receiptsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Receipt[];
        setReceipts(receiptsData);
      } catch (error) {
        console.error("Error fetching receipts: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReceipts();
  }, []);

  const handleExport = (status: 'paid' | 'unpaid') => {
    setIsExporting(true);
    const dataToExport = receipts
      .filter(r => r.status === status)
      .map(receipt => {
        const { createdAt, ...rest } = receipt;
        return {
          ...rest,
          createdDate: createdAt ? format(createdAt.toDate(), 'yyyy-MM-dd HH:mm:ss') : 'N/A'
        };
      });

    if (dataToExport.length === 0) {
      toast({ title: "No Data", description: `There are no ${status} bills to export.` });
      setIsExporting(false);
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${status.charAt(0).toUpperCase() + status.slice(1)} Receipts`);
    XLSX.writeFile(workbook, `${status}_receipts_export.xlsx`);
    setIsExporting(false);
  };

  const handleDeleteReceipt = async () => {
    if (!selectedReceipt || !db) return;
    setIsUpdating(true);
    try {
      const receiptRef = doc(db, 'receipts', selectedReceipt.id);
      await deleteDoc(receiptRef);
      setReceipts(receipts.filter(b => b.id !== selectedReceipt.id));
      toast({ title: "Success", description: "Receipt has been deleted." });
    } catch (error) {
      toast({ variant: 'destructive', title: "Error", description: "Failed to delete receipt." });
      console.error(error);
    } finally {
      setIsUpdating(false);
      setDeleteDialogOpen(false);
      setSelectedReceipt(null);
    }
  }

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

  const renderTable = (status: 'paid' | 'unpaid') => {
    const filteredReceipts = receipts.filter(receipt =>
      (receipt.status === status) &&
      (receipt.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.receiptNo.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Receipt #</TableHead>
            <TableHead>Student Name</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Payment Method</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredReceipts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center h-24">
                  {searchTerm ? `No matching ${status} receipts found.` : `No ${status} receipts generated yet.`}
              </TableCell>
            </TableRow>
          ) : (
            filteredReceipts.map(receipt => (
              <TableRow key={receipt.id}>
                <TableCell>{format(receipt.createdAt.toDate(), 'PPP')}</TableCell>
                <TableCell className="font-mono">{receipt.receiptNo}</TableCell>
                <TableCell className="font-medium">{receipt.studentName}</TableCell>
                <TableCell>{receipt.courseName}</TableCell>
                <TableCell>{receipt.paymentMethod || 'N/A'}</TableCell>
                <TableCell className="text-right font-medium">₹{receipt.amount.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="destructive" onClick={() => { setSelectedReceipt(receipt); setDeleteDialogOpen(true); }}>
                      <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>All Bills</CardTitle>
            <CardDescription>View all paid and unpaid receipts.</CardDescription>
          </div>
          <Button onClick={() => handleExport(activeTab)} disabled={isExporting || receipts.length === 0}>
            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            {isExporting ? 'Exporting...' : `Export ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'paid' | 'unpaid')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="paid">Paid</TabsTrigger>
                <TabsTrigger value="unpaid">Unpaid</TabsTrigger>
            </TabsList>
            <div className="relative my-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                placeholder="Search by student name or receipt number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                />
            </div>
             {loading ? (
                <div className="space-y-4 pt-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
                ) : (
                <>
                    <TabsContent value="paid">
                        {renderTable('paid')}
                    </TabsContent>
                    <TabsContent value="unpaid">
                        {renderTable('unpaid')}
                    </TabsContent>
                </>
             )}
          </Tabs>
        </CardContent>
      </Card>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete receipt #{selectedReceipt?.receiptNo} from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteReceipt} disabled={isUpdating} className="bg-destructive hover:bg-destructive/90">
                Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
