'use client'

import JtiLogo from '@/components/jti-logo';
import { format, isValid } from 'date-fns';
import Image from 'next/image';

type Application = {
  name: string;
  fatherName: string;
  email: string;
  phone: string;
  address: string;
  dob: { toDate: () => Date } | string;
  courseAppliedFor: string;
  createdAt: { toDate: () => Date };
  slNo?: string;
  session?: string;
  sex?: string;
  nationality?: string;
  photoDataUri?: string;
  signatureDataUri?: string;
  qualifications?: {
    examination: string;
    board: string;
    passingYear: string;
    division: string;
    percentage: string;
  }[];
};

const DetailItem = ({ label, value }: { label: string, value: string | undefined | null }) => (
    <div>
        <p className="text-xs text-gray-500 uppercase font-semibold">{label}</p>
        <p className="text-base text-black">{value || 'N/A'}</p>
    </div>
);

export const ApplicationPreview = ({ application }: { application: Application }) => {
    
    const dob = application.dob ? (application.dob as any).toDate ? (application.dob as any).toDate() : new Date(application.dob as string) : null;
    const submissionDate = application.createdAt ? format(application.createdAt.toDate(), 'PPP') : 'N/A';

    return (
        <div className="p-8 bg-white text-black font-sans">
            <header className="flex justify-between items-center pb-4 mb-6 border-b-2 border-gray-200">
                <JtiLogo size="medium" />
                <div className="text-right">
                    <h1 className="text-2xl font-bold font-headline text-primary">Admission Application Form</h1>
                    <p className="text-sm text-gray-500">Submitted on: {submissionDate}</p>
                    <p className="text-sm text-gray-500">Session: {application.session || 'N/A'}</p>
                    <p className="text-sm text-gray-500">Sl. No: {application.slNo || 'N/A'}</p>
                </div>
            </header>

            <main>
                <section className="mb-6 flex gap-8 items-start">
                    <div className="flex-grow">
                        <h2 className="text-lg font-bold font-headline border-b mb-4 pb-2 text-primary">Personal Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                            <DetailItem label="Full Name" value={application.name} />
                            <DetailItem label="Father's Name" value={application.fatherName} />
                            <DetailItem label="Date of Birth" value={dob && isValid(dob) ? format(dob, 'PPP') : 'N/A'} />
                             <DetailItem label="Sex" value={application.sex} />
                            <DetailItem label="Nationality" value={application.nationality} />
                            <DetailItem label="Email Address" value={application.email} />
                            <DetailItem label="Phone Number" value={application.phone} />
                            <div className="md:col-span-2">
                                <DetailItem label="Full Address" value={application.address} />
                            </div>
                        </div>
                    </div>
                     <div className="flex-shrink-0 space-y-2">
                        {application.photoDataUri && (
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold">Photo</p>
                                <Image src={application.photoDataUri} alt="Applicant photo" width={100} height={120} className="border-2 p-1 bg-gray-50 object-cover" />
                            </div>
                        )}
                        {application.signatureDataUri && (
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold">Signature</p>
                                <Image src={application.signatureDataUri} alt="Applicant signature" width={100} height={50} className="border-2 p-1 bg-gray-50 object-contain" />
                            </div>
                        )}
                    </div>
                </section>

                <section className="mb-6">
                    <h2 className="text-lg font-bold font-headline border-b mb-4 pb-2 text-primary">Academics</h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-4">
                        <DetailItem label="Course Applied For" value={application.courseAppliedFor} />
                    </div>
                    {application.qualifications && application.qualifications.length > 0 && (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="p-2 border font-semibold">Examination</th>
                                    <th className="p-2 border font-semibold">Board</th>
                                    <th className="p-2 border font-semibold">Passing Year</th>
                                    <th className="p-2 border font-semibold">Division</th>
                                    <th className="p-2 border font-semibold">% Marks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {application.qualifications.map((q, i) => (
                                    <tr key={i}>
                                        <td className="p-2 border">{q.examination}</td>
                                        <td className="p-2 border">{q.board}</td>
                                        <td className="p-2 border">{q.passingYear}</td>
                                        <td className="p-2 border">{q.division}</td>
                                        <td className="p-2 border">{q.percentage}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </section>
            </main>

            <footer className="mt-10 pt-4 border-t text-center text-xs text-gray-500">
                <p>Jharkhand Technical Institute | Sarkanda, Godda, Jharkhand 814133</p>
                <p>This is a computer-generated document.</p>
            </footer>
        </div>
    );
};
