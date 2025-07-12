// src/app/dashboard/profile-media/page.tsx
'use client';

import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ArrowLeft, AlertTriangle, Upload, Save, Loader2, Image as ImageIcon, FileBadge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';

type StudentProfile = {
  uid: string;
  photoDataUri?: string;
  signatureDataUri?: string;
  [key: string]: any;
};

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export default function ProfileMediaPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [photo, setPhoto] = useState<{ file: File, preview: string } | null>(null);
  const [signature, setSignature] = useState<{ file: File, preview: string } | null>(null);
  
  const [photoUploadProgress, setPhotoUploadProgress] = useState<number | null>(null);
  const [signatureUploadProgress, setSignatureUploadProgress] = useState<number | null>(null);

  useEffect(() => {
    if (user?.uid) {
      const fetchProfile = async () => {
        setLoading(true);
        try {
          if (!db) throw new Error("Firebase is not configured.");
          const docRef = doc(db, 'admissions', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const profileData = { uid: docSnap.id, ...docSnap.data() } as StudentProfile;
            setStudentProfile(profileData);
            if (profileData.photoDataUri) setPhoto({ file: new File([], ''), preview: profileData.photoDataUri });
            if (profileData.signatureDataUri) setSignature({ file: new File([], ''), preview: profileData.signatureDataUri });
          }
        } catch (e) {
          console.error(e);
          toast({ variant: 'destructive', title: "Error", description: "Failed to load profile." });
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    }
  }, [user, toast]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'signature') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        toast({ variant: 'destructive', title: 'File too large', description: `Please select a file smaller than ${MAX_FILE_SIZE / 1024 / 1024}MB.`});
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      if (type === 'photo') {
        setPhoto({ file, preview: previewUrl });
      } else {
        setSignature({ file, preview: previewUrl });
      }
    }
  };

  const uploadMedia = async (file: File, onProgress: (progress: number) => void): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
            const dataUri = reader.result as string;
            try {
                const response = await fetch('/api/upload-profile-media', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ file: dataUri })
                });

                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'Upload failed');
                
                let progress = 0;
                const interval = setInterval(() => {
                  if (progress < 100) {
                    progress += 10;
                    onProgress(Math.min(progress, 100));
                  } else {
                    clearInterval(interval);
                    resolve(result.secure_url);
                  }
                }, 50);

            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async () => {
    if (!studentProfile) return;
    setIsSubmitting(true);
    let photoUrl = studentProfile.photoDataUri;
    let signatureUrl = studentProfile.signatureDataUri;
    
    try {
        if (photo && photo.file.size > 0) {
            setPhotoUploadProgress(0);
            photoUrl = await uploadMedia(photo.file, setPhotoUploadProgress);
        }
        if (signature && signature.file.size > 0) {
            setSignatureUploadProgress(0);
            signatureUrl = await uploadMedia(signature.file, setSignatureUploadProgress);
        }

        const userDocRef = doc(db, 'admissions', studentProfile.uid);
        await updateDoc(userDocRef, {
            photoDataUri: photoUrl,
            signatureDataUri: signatureUrl,
        });

        toast({ title: 'Success', description: 'Your profile media has been updated.' });
        router.push('/dashboard');
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Upload Failed', description: error.message || 'An unknown error occurred.' });
    } finally {
        setIsSubmitting(false);
        setPhotoUploadProgress(null);
        setSignatureUploadProgress(null);
    }
  }


  return (
    <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
        </Button>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Upload Profile Media</CardTitle>
          <CardDescription>Upload your photo and signature. These will be used for your official records and ID card.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
          ) : !studentProfile ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>Could not load your student profile.</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    {/* Photo Upload */}
                    <div className="space-y-4 text-center">
                        <h3 className="font-semibold text-lg">Profile Photo</h3>
                        <div className="w-40 h-52 mx-auto rounded-lg border-2 border-dashed flex items-center justify-center bg-muted overflow-hidden">
                           {photo ? (
                             <Image src={photo.preview} alt="Photo preview" width={160} height={208} className="object-cover w-full h-full" />
                           ) : (
                             <div className="text-center p-4 text-muted-foreground">
                                <ImageIcon className="mx-auto h-12 w-12 mb-2" />
                                <p className="text-xs">Passport size photo</p>
                             </div>
                           )}
                        </div>
                        <Input id="photo-upload" type="file" accept="image/jpeg, image/png" onChange={(e) => handleFileChange(e, 'photo')} className="block mx-auto max-w-xs" />
                        <Label htmlFor="photo-upload" className="text-xs text-muted-foreground">JPG or PNG, max 2MB.</Label>
                        {photoUploadProgress !== null && <Progress value={photoUploadProgress} className="mt-2" />}
                    </div>

                    {/* Signature Upload */}
                     <div className="space-y-4 text-center">
                        <h3 className="font-semibold text-lg">Signature</h3>
                        <div className="w-52 h-28 mx-auto rounded-lg border-2 border-dashed flex items-center justify-center bg-muted overflow-hidden p-2">
                           {signature ? (
                             <Image src={signature.preview} alt="Signature preview" width={208} height={112} className="object-contain w-full h-full" />
                           ) : (
                             <div className="text-center p-4 text-muted-foreground">
                                <FileBadge className="mx-auto h-12 w-12 mb-2" />
                                 <p className="text-xs">Image of your signature</p>
                             </div>
                           )}
                        </div>
                        <Input id="signature-upload" type="file" accept="image/jpeg, image/png" onChange={(e) => handleFileChange(e, 'signature')} className="block mx-auto max-w-xs" />
                         <Label htmlFor="signature-upload" className="text-xs text-muted-foreground">JPG or PNG, max 2MB.</Label>
                         {signatureUploadProgress !== null && <Progress value={signatureUploadProgress} className="mt-2" />}
                    </div>
                </div>

                <div className="pt-6 border-t">
                    <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full md:w-auto">
                        {isSubmitting ? <Loader2 className="animate-spin" /> : <Save className="mr-2" />}
                        {isSubmitting ? 'Saving...' : 'Save Media'}
                    </Button>
                </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
