
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";
import { User, Mail, Phone, Home, Calendar, BookOpen, GraduationCap, Megaphone, ArrowRight, Briefcase, Download, File as FileIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import Link from "next/link";

type Student = {
  uid: string;
  name: string;
  fatherName: string;
  email: string;
  phone: string;
  address: string;
  dob: { toDate: () => Date };
  lastQualification: string;
  courseAppliedFor: string;
  createdAt: { toDate: () => Date };
};

type Receipt = {
  id: string;
  receiptNo: string;
  amount: number;
  feeType: string;
  feeForMonths?: string;
  createdAt: { toDate: () => Date };
};

type Notice = {
  id: string;
  title: string;
  message: string;
  createdAt: { toDate: () => Date };
}

type Note = {
  id: string;
  title: string;
  description: string;
  url: string;
  createdAt: { toDate: () => Date };
}

type DashboardClientProps = {
    student: Student;
    bills: Receipt[];
    notices: Notice[];
    notes: Note[];
}

const DetailRow = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | undefined }) => (
    <div className="flex items-start gap-3">
        <Icon className="h-4 w-4 text-muted-foreground mt-1" />
        <div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="text-sm font-semibold">{value || 'N/A'}</p>
        </div>
    </div>
)

export default function DashboardClient({ student, bills: receipts, notices, notes }: DashboardClientProps) {
    const { t } = useLanguage();

    return (
        <div className="space-y-8">
            {notices && notices.length > 0 && (
                <Alert>
                    <Megaphone className="h-4 w-4" />
                    <AlertTitle className="font-headline">{t('dashboard_page.notice_board_title')}</AlertTitle>
                    <AlertDescription>
                        <Accordion type="single" collapsible className="w-full mt-2">
                            {notices.map(notice => (
                                <AccordionItem value={notice.id} key={notice.id} className="border-b-0">
                                    <AccordionTrigger className="p-0 hover:no-underline">
                                        <div className="flex justify-between items-center w-full">
                                            <p className="font-semibold text-foreground">{notice.title}</p>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-2 pb-0">
                                        <p className="whitespace-pre-wrap">{notice.message}</p>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">{t('dashboard_page.profile_title')}</CardTitle>
                            <CardDescription>{t('dashboard_page.profile_desc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <DetailRow icon={User} label="Father's Name" value={student.fatherName} />
                            <DetailRow icon={Mail} label="Email" value={student.email} />
                            <DetailRow icon={Phone} label="Phone Number" value={student.phone} />
                            <DetailRow icon={Calendar} label="Date of Birth" value={student.dob ? format(student.dob.toDate(), 'PPP') : 'N/A'} />
                            <DetailRow icon={Home} label="Address" value={student.address} />
                            <DetailRow icon={GraduationCap} label="Last Qualification" value={student.lastQualification} />
                            <DetailRow icon={BookOpen} label="Course Applied For" value={student.courseAppliedFor} />
                        </CardContent>
                    </Card>
                     <Card className="bg-primary/10 border-primary/20">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <Briefcase className="h-6 w-6 text-primary" />
                                <CardTitle className="font-headline text-white">{t('careers_page.card_title')}</CardTitle>
                            </div>
                            <CardDescription className="text-neutral-300">{t('careers_page.card_desc')}</CardDescription>
                        </CardHeader>
                        <CardFooter>
                            <Button asChild className="w-full" variant="secondary">
                                <Link href="/dashboard/careers">
                                    {t('careers_page.card_button')}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                </div>


                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                        <CardTitle className="font-headline">{t('dashboard_page.card_title_receipts')}</CardTitle>
                        <CardDescription>
                            {t('dashboard_page.card_desc_receipts')}
                        </CardDescription>
                        </CardHeader>
                        <CardContent>
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>{t('dashboard_page.table_header_date')}</TableHead>
                                <TableHead>{t('dashboard_page.table_header_receipt_no')}</TableHead>
                                <TableHead>{t('dashboard_page.table_header_description')}</TableHead>
                                <TableHead className="text-right">{t('dashboard_page.table_header_amount')}</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {receipts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">
                                        {t('dashboard_page.no_receipts')}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                receipts.map((receipt) => (
                                <TableRow key={receipt.id}>
                                    <TableCell>{format(receipt.createdAt.toDate(), 'PPP')}</TableCell>
                                    <TableCell className="font-mono">{receipt.receiptNo}</TableCell>
                                    <TableCell>{`${receipt.feeType} Fee ${receipt.feeForMonths ? `(${receipt.feeForMonths})` : ''}`}</TableCell>
                                    <TableCell className="text-right font-medium">₹{receipt.amount.toFixed(2)}</TableCell>
                                </TableRow>
                                ))
                            )}
                            </TableBody>
                        </Table>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Downloads & Notes</CardTitle>
                            <CardDescription>
                                Important documents and study materials from the institute.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {notes.length === 0 ? (
                                <p className="text-sm text-center text-muted-foreground py-4">No notes available right now.</p>
                            ) : (
                                <div className="space-y-2">
                                    {notes.map(note => (
                                        <div key={note.id} className="flex items-center justify-between p-3 rounded-md border bg-muted/50">
                                            <div className="flex items-center gap-3">
                                                <FileIcon className="h-5 w-5 text-primary" />
                                                <div>
                                                    <p className="font-semibold">{note.title}</p>
                                                    <p className="text-xs text-muted-foreground">{note.description}</p>
                                                </div>
                                            </div>
                                            <Button asChild size="sm">
                                                <a href={note.url} target="_blank" rel="noopener noreferrer">
                                                    <Download className="mr-2 h-4 w-4" /> Download
                                                </a>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
