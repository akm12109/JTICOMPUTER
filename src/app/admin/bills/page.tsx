'use client';
import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Trash2, Send, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

type Bill = {
  id: string;
  billNumber: string;
  studentName: string;
  total: number;
  status: 'paid' | 'unpaid';
  paymentMethod?: 'cash' | 'upi' | 'card';
  createdAt: { toDate: () => Date };
};

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [firebaseConfigured, setFirebaseConfigured] = useState(true);
  const { toast } = useToast();

  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [isPaidDialogOpen, setPaidDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card'>('cash');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchBills = async () => {
      if (!db) {
        setFirebaseConfigured(false);
        setLoading(false);
        return;
      }
      try {
        const q = query(collection(db, 'bills'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const billsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Bill[];
        setBills(billsData);
      } catch (error) {
        console.error("Error fetching bills: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBills();
  }, []);

  const handleMarkAsPaid = async () => {
    if (!selectedBill || !db) return;
    setIsUpdating(true);
    try {
      const billRef = doc(db, 'bills', selectedBill.id);
      await updateDoc(billRef, { status: 'paid', paymentMethod: paymentMethod });
      
      setBills(bills.map(b => b.id === selectedBill.id ? { ...b, status: 'paid', paymentMethod: paymentMethod } : b));
      toast({ title: "Success", description: "Bill has been marked as paid." });
    } catch (error) {
      toast({ variant: 'destructive', title: "Error", description: "Failed to update bill." });
      console.error(error);
    } finally {
      setIsUpdating(false);
      setPaidDialogOpen(false);
      setSelectedBill(null);
    }
  }

  const handleDeleteBill = async () => {
    if (!selectedBill || !db) return;
    setIsUpdating(true);
    try {
      const billRef = doc(db, 'bills', selectedBill.id);
      await deleteDoc(billRef);
      setBills(bills.filter(b => b.id !== selectedBill.id));
      toast({ title: "Success", description: "Bill has been deleted." });
    } catch (error) {
      toast({ variant: 'destructive', title: "Error", description: "Failed to delete bill." });
      console.error(error);
    } finally {
      setIsUpdating(false);
      setDeleteDialogOpen(false);
      setSelectedBill(null);
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

  const unpaidBills = bills.filter(b => b.status === 'unpaid');
  const paidBills = bills.filter(b => b.status === 'paid');

  const renderBillsTable = (billsToShow: Bill[], isUnpaid: boolean) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Bill #</TableHead>
          <TableHead>Student Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Payment Method</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          {isUnpaid && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {billsToShow.length === 0 ? (
          <TableRow>
            <TableCell colSpan={isUnpaid ? 7 : 6} className="text-center h-24">No bills in this category.</TableCell>
          </TableRow>
        ) : (
          billsToShow.map(bill => (
            <TableRow key={bill.id}>
              <TableCell>{format(bill.createdAt.toDate(), 'PPP')}</TableCell>
              <TableCell className="font-mono">{bill.billNumber}</TableCell>
              <TableCell className="font-medium">{bill.studentName}</TableCell>
              <TableCell>
                <Badge variant={bill.status === 'paid' ? 'default' : 'destructive'} className={bill.status === 'paid' ? 'bg-green-600' : ''}>
                  {bill.status}
                </Badge>
              </TableCell>
              <TableCell>{bill.paymentMethod ? bill.paymentMethod.toUpperCase() : 'N/A'}</TableCell>
              <TableCell className="text-right font-medium">₹{bill.total.toFixed(2)}</TableCell>
              {isUnpaid && (
                <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                       <Button size="sm" variant="outline" onClick={() => { setSelectedBill(bill); setPaidDialogOpen(true); }}>
                           <CheckCircle className="h-4 w-4" />
                       </Button>
                       <Button size="sm" variant="ghost" onClick={() => toast({title: "Coming Soon!", description: "This feature will be available with Razorpay integration."})}>
                           <Send className="h-4 w-4" />
                       </Button>
                       <Button size="sm" variant="destructive" onClick={() => { setSelectedBill(bill); setDeleteDialogOpen(true); }}>
                           <Trash2 className="h-4 w-4" />
                       </Button>
                    </div>
                </TableCell>
              )}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>All Bills</CardTitle>
          <CardDescription>View all paid and unpaid bills.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : (
            <Tabs defaultValue="unpaid">
              <TabsList>
                <TabsTrigger value="unpaid">Unpaid Bills ({unpaidBills.length})</TabsTrigger>
                <TabsTrigger value="paid">Paid Bills ({paidBills.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="unpaid">
                  {renderBillsTable(unpaidBills, true)}
              </TabsContent>
              <TabsContent value="paid">
                  {renderBillsTable(paidBills, false)}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Mark as Paid Dialog */}
      <Dialog open={isPaidDialogOpen} onOpenChange={setPaidDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Bill as Paid</DialogTitle>
            <DialogDescription>
              Select the payment method used for bill #{selectedBill?.billNumber}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <RadioGroup defaultValue="cash" onValueChange={(value: 'cash' | 'upi' | 'card') => setPaymentMethod(value)}>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cash" id="r1" />
                    <Label htmlFor="r1">Cash</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="upi" id="r2" />
                    <Label htmlFor="r2">UPI</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="card" id="r3" />
                    <Label htmlFor="r3">Card</Label>
                </div>
            </RadioGroup>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button onClick={handleMarkAsPaid} disabled={isUpdating}>
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Bill Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the bill
              for #{selectedBill?.billNumber} from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBill} disabled={isUpdating} className="bg-destructive hover:bg-destructive/90">
                Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
