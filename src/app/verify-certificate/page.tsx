// src/app/verify-certificate/page.tsx
'use client';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BadgeCheck, Search, XCircle, Download, Loader2, User, KeyRound, CheckCircle } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { CertificatePreview } from '@/components/certificate-preview';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type CertificateData = {
  id: string;
  [key: string]: any;
};

export default function VerifyCertificatePage() {
    const [registrationNo, setRegistrationNo] = useState('');
    const [fullName, setFullName] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    
    const [step, setStep] = useState<'initial' | 'confirm' | 'verified'>('initial');
    const [foundCertificate, setFoundCertificate] = useState<CertificateData | null>(null);
    const [maskedName, setMaskedName] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const certificateRef = useRef<HTMLDivElement>(null);
    
    const maskName = (name: string): string => {
        return name.split(' ').map(part => 
            part.length > 2 ? part[0] + '*'.repeat(part.length - 2) + part[part.length - 1] : part
        ).join(' ');
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessage(null);
        setFoundCertificate(null);
        setStep('initial');

        try {
            if (!db) throw new Error("Database not configured.");
            
            const q = query(collection(db, 'certificates'), where('registrationNo', '==', registrationNo.trim()));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setErrorMessage("No certificate found with this registration number. Please check and try again.");
            } else {
                const doc = querySnapshot.docs[0];
                const data = { id: doc.id, ...doc.data() } as CertificateData;
                setFoundCertificate(data);
                setMaskedName(maskName(data.studentName));
                setStep('confirm');
            }
        } catch (err) {
            console.error(err);
            setErrorMessage("An error occurred while searching. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleConfirmName = (e: React.FormEvent) => {
        e.preventDefault();
        if (fullName.trim().toLowerCase() === foundCertificate?.studentName.toLowerCase()) {
            setStep('verified');
            setErrorMessage(null);
        } else {
            setErrorMessage("The name does not match the record. Please check and try again.");
        }
    };
    
    const handleDownload = async () => {
        const element = certificateRef.current;
        if (!element || !foundCertificate) return;

        setIsDownloading(true);
        try {
            const canvas = await html2canvas(element, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
            const imgData = canvas.toDataURL('image/png', 1.0);
            
            const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape A4
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            const imgProps= pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
            
            let finalImgHeight = imgHeight;
            let finalImgWidth = pdfWidth;

            if(imgHeight > pdfHeight) {
                finalImgHeight = pdfHeight;
                finalImgWidth = (imgProps.width * pdfHeight) / imgProps.height;
            }

            const xOffset = (pdfWidth - finalImgWidth) / 2;
            const yOffset = (pdfHeight - finalImgHeight) / 2;
            
            pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalImgWidth, finalImgHeight);
            pdf.save(`Certificate-${foundCertificate.studentName}-${foundCertificate.registrationNo}.pdf`);
        } catch (error) {
            console.error("PDF generation error: ", error);
            setErrorMessage("Failed to generate PDF. Please try again.");
        } finally {
            setIsDownloading(false);
        }
    };

    const resetForm = () => {
        setRegistrationNo('');
        setFullName('');
        setStep('initial');
        setFoundCertificate(null);
        setMaskedName('');
        setErrorMessage(null);
    }

    return (
        <div className="container mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] py-12 px-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl font-headline">Verify Certificate</CardTitle>
                    <CardDescription>Enter the certificate registration number to verify its authenticity.</CardDescription>
                </CardHeader>
                {step === 'initial' && (
                     <form onSubmit={handleSearch}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="registration-no">Registration Number</Label>
                                <Input
                                    id="registration-no"
                                    placeholder="e.g., JTI-GOD-PRO-046-2022"
                                    value={registrationNo}
                                    onChange={(e) => setRegistrationNo(e.target.value)}
                                    required
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? <Loader2 className="animate-spin" /> : <Search className="mr-2" />}
                                Search
                            </Button>
                        </CardFooter>
                    </form>
                )}
                 {step === 'confirm' && (
                     <form onSubmit={handleConfirmName}>
                        <CardContent className="space-y-4">
                             <Alert variant="default" className="border-green-500">
                                <BadgeCheck className="h-4 w-4 text-green-500" />
                                <AlertTitle>Certificate Found!</AlertTitle>
                                <AlertDescription>
                                   A valid certificate has been found for student: **{maskedName}**. Please enter the full name to download.
                                </AlertDescription>
                            </Alert>
                            <div className="space-y-2">
                                <Label htmlFor="full-name">Full Name</Label>
                                <Input
                                    id="full-name"
                                    placeholder="Enter full name as on certificate"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex-col gap-2">
                            <Button type="submit" className="w-full">
                                <User className="mr-2" /> Verify & Continue
                            </Button>
                             <Button type="button" variant="outline" className="w-full" onClick={resetForm}>
                                Start Over
                            </Button>
                        </CardFooter>
                    </form>
                )}
                 {step === 'verified' && foundCertificate && (
                    <CardContent className="space-y-4 text-center">
                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                        <h3 className="text-xl font-bold">Verification Complete!</h3>
                        <p className="text-muted-foreground">Certificate for **{foundCertificate.studentName}** is ready for download.</p>
                        <Button className="w-full" onClick={handleDownload} disabled={isDownloading}>
                           {isDownloading ? <Loader2 className="animate-spin" /> : <Download className="mr-2" />}
                            Download Certificate
                        </Button>
                         <Button type="button" variant="outline" className="w-full" onClick={resetForm}>
                            Verify Another
                        </Button>
                    </CardContent>
                )}

                 {errorMessage && (
                    <CardContent>
                        <Alert variant="destructive">
                            <XCircle className="h-4 w-4" />
                            <AlertTitle>Verification Failed</AlertTitle>
                            <AlertDescription>
                                {errorMessage}
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                )}
            </Card>

            {/* Hidden div for PDF generation */}
            {step === 'verified' && foundCertificate && (
                <div className="absolute -z-10 -left-[9999px] -top-[9999px] w-[297mm] h-[210mm]">
                    <div ref={certificateRef}>
                        <CertificatePreview certificate={foundCertificate} />
                    </div>
                </div>
            )}
        </div>
    );
}
