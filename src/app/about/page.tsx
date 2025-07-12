
'use client';

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Target, History, Building, Landmark, Info, UserCog, User, Star, Mail, Phone, MessageCircle, UserPlus } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db_secondary as db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

type Instructor = {
    id: string;
    name: string;
    position: string;
    degree?: string;
    category: 'Director' | 'Main Faculty' | 'Lab Instructor' | 'Lab Assistant';
    photoUrl: string;
};

const SectionSkeleton = () => (
    <div className="space-y-4">
        <Skeleton className="h-8 w-1/2 mx-auto" />
        <Skeleton className="h-4 w-3/4 mx-auto" />
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
    </div>
);

export default function AboutPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const isAdmin = user && user.email === 'admin@jtigodda.in';
  
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInstructors = async () => {
        if (!db) { setLoading(false); return; }
        try {
            const q = query(collection(db, 'instructors'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Instructor));
            setInstructors(data);
        } catch (error) {
            console.error("Error fetching instructors:", error);
        } finally {
            setLoading(false);
        }
    };
    fetchInstructors();
  }, []);

  const directors = instructors.filter(i => i.category === 'Director');
  const mainFaculty = instructors.filter(i => i.category === 'Main Faculty');
  const labInstructors = instructors.filter(i => i.category === 'Lab Instructor');
  const labAssistants = instructors.filter(i => i.category === 'Lab Assistant');


  return (
    <>
      <section className="relative py-20 md:py-32">
        <Image
          src="https://raw.githubusercontent.com/akm12109/image_bg_assets/main/JTI/jti%20(7).png"
          alt="JTI Godda Team"
          fill
          className="object-cover"
          data-ai-hint="team working"
        />
        <div className="absolute inset-0 bg-black/70" />
        
        <div className="relative container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold font-headline text-white">{t('about_page.title')}</h1>
            <p className="mt-4 max-w-3xl mx-auto text-lg text-neutral-200">
              {t('about_page.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 text-white">
            <div className="bg-white/10 backdrop-blur-sm p-8 rounded-lg">
              <div className="flex gap-4 items-start">
                <Target className="w-10 h-10 text-primary flex-shrink-0" />
                <div>
                  <h2 className="text-2xl font-bold font-headline">{t('about_page.mission_title')}</h2>
                  <p className="text-neutral-200 mt-2">
                    {t('about_page.mission_desc')}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-8 rounded-lg">
              <div className="flex gap-4 items-start">
                <History className="w-10 h-10 text-primary flex-shrink-0" />
                <div>
                  <h2 className="text-2xl font-bold font-headline">{t('about_page.history_title')}</h2>
                  <p className="text-neutral-200 mt-2">
                    {t('about_page.history_desc')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Corporate Information Section */}
      <section className="relative py-16 md:py-24">
        <Image
            src="https://raw.githubusercontent.com/akm12109/image_bg_assets/main/JTI/jti%20(10).png"
            alt="Abstract corporate background"
            fill
            className="object-cover"
            data-ai-hint="abstract technology"
        />
        <div className="absolute inset-0 bg-black/80" />
        <div className="relative container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-headline text-white">{t('about_page.corporate_info_title')}</h2>
            <p className="mt-4 max-w-2xl mx-auto text-neutral-200">
              {t('about_page.corporate_info_subtitle')}
            </p>
          </div>
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-8">
              <Card className="bg-card/20 backdrop-blur-md border border-primary/20 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-headline text-white"><Info /> {t('about_page.basic_info.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <InfoRow label={t('about_page.basic_info.cin')} value="U72900JH2001PTC012042" />
                  <InfoRow label={t('about_page.basic_info.inc_date')} value={t('about_page.basic_info.inc_date_value')} />
                </CardContent>
              </Card>
              <Card className="bg-card/20 backdrop-blur-md border border-primary/20 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-headline text-white"><Landmark /> {t('about_page.capital_info.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <InfoRow label={t('about_page.capital_info.authorised_capital')} value="₹ 100,000.00" />
                  <InfoRow label={t('about_page.capital_info.paidup_capital')} value="₹ 100,000.00" />
                </CardContent>
              </Card>
            </div>
            <div className="space-y-8">
              <Card className="bg-card/20 backdrop-blur-md border border-primary/20 text-white">
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2 font-headline text-white"><Building /> {t('about_page.offices_title')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                      <div>
                          <h3 className="font-semibold text-primary">{t('about_page.corporate_office')}</h3>
                          <p className="text-neutral-300">{t('about_page.corporate_office_address')}</p>
                      </div>
                      <div>
                          <h3 className="font-semibold text-primary">{t('about_page.asc_office')}</h3>
                          <p className="text-neutral-300">{t('about_page.asc_office_address')}</p>
                      </div>
                  </CardContent>
              </Card>
              <Card className="bg-card/20 backdrop-blur-md border border-primary/20 text-white">
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2 font-headline text-white"><Phone /> {t('contact_page.info_title')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                      <div>
                          <h3 className="font-semibold text-primary flex items-center gap-2"><Mail className="w-5 h-5"/> {t('contact_page.email_title')}</h3>
                          <p className="text-neutral-300">{t('contact_page.email_value')}</p>
                      </div>
                      <div>
                          <h3 className="font-semibold text-primary flex items-center gap-2"><Phone className="w-5 h-5"/> {t('contact_page.call_title')}</h3>
                          <p className="text-neutral-300">{t('contact_page.call_value')}</p>
                      </div>
                      <div>
                          <h3 className="font-semibold text-primary flex items-center gap-2"><MessageCircle className="w-5 h-5" /> {t('contact_page.whatsapp_title')}</h3>
                          <p className="text-neutral-300">{t('contact_page.whatsapp_value')}</p>
                      </div>
                  </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership Section */}
      <section className="relative py-16 md:py-24">
         <Image
            src="https://raw.githubusercontent.com/akm12109/image_bg_assets/main/JTI/jti%20(1).png"
            alt="Abstract leadership background"
            fill
            className="object-cover"
            data-ai-hint="abstract dark"
        />
        <div className="absolute inset-0 bg-black/80" />
        <div className="relative container mx-auto px-4 md:px-6">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold font-headline text-white">{t('about_page.directors_title')}</h2>
            <p className="mt-4 max-w-2xl mx-auto text-neutral-200">
              {t('about_page.directors_subtitle')}
            </p>
          </div>
           {loading ? <SectionSkeleton /> : (
                <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl mx-auto">
                    {directors.map((member) => (
                        <Card key={member.id} className="text-center bg-card/20 backdrop-blur-md border border-primary/20 text-white">
                        <CardContent className="p-6">
                            <Image
                            src={member.photoUrl}
                            alt={member.name}
                            width={120}
                            height={120}
                            className="rounded-full mx-auto mb-4 border-4 border-primary/20"
                            />
                            <h3 className="text-xl font-bold font-headline text-white">{member.name}</h3>
                            <p className="text-primary font-medium">{member.position}</p>
                        </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
      </section>

      {/* Faculty Section */}
      <section className="relative py-16 md:py-24">
        <Image
            src="https://raw.githubusercontent.com/akm12109/image_bg_assets/main/JTI/jti%20(5).png"
            alt="Faculty background"
            fill
            className="object-cover"
            data-ai-hint="team diverse"
        />
        <div className="absolute inset-0 bg-black/80" />
        <div className="relative container mx-auto px-4 md:px-6 text-white">
            <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold font-headline">{t('about_page.faculty_title')}</h2>
                <p className="mt-4 max-w-2xl mx-auto text-neutral-200">{t('about_page.faculty_subtitle')}</p>
                {isAdmin && (
                  <Button asChild className="mt-4">
                    <Link href="/admin/instructors">
                      <UserPlus className="mr-2 h-4 w-4" /> Add/Edit Instructors
                    </Link>
                  </Button>
                )}
            </div>
            
            {loading ? <SectionSkeleton /> : (
            <>
                <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
                    {mainFaculty.map((member) => (
                        <Card key={member.id} className="text-center bg-card/20 backdrop-blur-md border border-primary/20">
                            <CardContent className="p-6">
                                <Image
                                    src={member.photoUrl}
                                    alt={member.name}
                                    width={120}
                                    height={120}
                                    className="rounded-full mx-auto mb-4 border-4 border-primary/20"
                                />
                                <h3 className="text-xl font-bold font-headline">{member.name}</h3>
                                <p className="text-primary font-medium">{member.position}</p>
                                {member.degree && <p className="text-sm text-neutral-300">{member.degree}</p>}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="mt-16 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12">
                    {labInstructors.length > 0 && (
                        <div>
                            <h3 className="text-2xl font-bold font-headline text-center mb-6 flex items-center justify-center gap-2"><UserCog className="w-6 h-6"/> {t('about_page.faculty.lab_instructors_title')}</h3>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-center text-neutral-200">
                                {labInstructors.map((inst) => <p key={inst.id}>{inst.name}</p>)}
                            </div>
                        </div>
                    )}
                    {labAssistants.length > 0 && (
                        <div>
                            <h3 className="text-2xl font-bold font-headline text-center mb-6 flex items-center justify-center gap-2"><Star className="w-6 h-6" /> {t('about_page.faculty.lab_assistant_title')}</h3>
                            <div className="text-center text-neutral-200">
                                {labAssistants.map(inst => <p key={inst.id}>{inst.name}</p>)}
                            </div>
                        </div>
                    )}
                </div>
            </>
            )}
        </div>
      </section>
    </>
  );
}

const InfoRow = ({ label, value }: { label: string, value: string }) => (
  <div className="flex justify-between items-center text-sm">
    <p className="text-neutral-300">{label}</p>
    <p className="font-medium text-right text-white">{value}</p>
  </div>
);
