'use client'

import JtiLogo from '@/components/jti-logo';
import { format, isValid } from 'date-fns';

type Enquiry = {
  slNo?: number;
  enquiryDate: Date;
  name: string;
  fatherName: string;
  currentAddress: string;
  permanentAddress?: string;
  phone: string;
  email: string;
  dob: string | Date;
  nationality: string;
  category: string;
  gender: string;
  courseAppliedFor: string;
  batchTime: string;
  qualification: string;
};

const DetailItem = ({ label, value }: { label: string, value: string | undefined | null }) => (
    <div>
        <p className="text-xs text-gray-500 uppercase font-semibold">{label}</p>
        <p className="text-base text-black">{value || 'N/A'}</p>
    </div>
);

export const EnquiryPreview = ({ enquiry }: { enquiry: Enquiry }) => {
    const dob = enquiry.dob ? (typeof enquiry.dob === 'string' ? new Date(enquiry.dob) : enquiry.dob) : null;

    return (
        <div className="p-8 bg-white text-black font-sans">
            <header className="flex justify-between items-center pb-4 mb-6 border-b-2 border-gray-200">
                <JtiLogo size="medium" />
                <div className="text-right">
                    <h1 className="text-2xl font-bold font-headline text-primary">Enquiry Form Receipt</h1>
                    {enquiry.slNo && <p className="text-sm text-gray-500">Enquiry No: {enquiry.slNo}</p>}
                    <p className="text-sm text-gray-500">Date: {format(enquiry.enquiryDate, 'PPP')}</p>
                </div>
            </header>

            <main className="space-y-6">
                 <section>
                    <h2 className="text-lg font-bold font-headline border-b mb-4 pb-2 text-primary">Personal Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <DetailItem label="Full Name" value={enquiry.name} />
                        <DetailItem label="Father's Name" value={enquiry.fatherName} />
                        <DetailItem label="Date of Birth" value={dob && isValid(dob) ? format(dob, 'PPP') : 'N/A'} />
                        <DetailItem label="Gender" value={enquiry.gender} />
                        <DetailItem label="Category" value={enquiry.category} />
                        <DetailItem label="Nationality" value={enquiry.nationality} />
                    </div>
                </section>
                
                 <section>
                    <h2 className="text-lg font-bold font-headline border-b mb-4 pb-2 text-primary">Contact Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <DetailItem label="Email Address" value={enquiry.email} />
                        <DetailItem label="Phone Number" value={enquiry.phone} />
                         <div className="md:col-span-2">
                            <DetailItem label="Current Address" value={enquiry.currentAddress} />
                        </div>
                        <div className="md:col-span-2">
                            <DetailItem label="Permanent Address" value={enquiry.permanentAddress} />
                        </div>
                    </div>
                </section>
                
                 <section>
                    <h2 className="text-lg font-bold font-headline border-b mb-4 pb-2 text-primary">Course & Qualification</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <DetailItem label="Course of Interest" value={enquiry.courseAppliedFor} />
                        <DetailItem label="Preferred Batch Time" value={enquiry.batchTime} />
                        <div className="md:col-span-2">
                            <DetailItem label="Highest Qualification" value={enquiry.qualification} />
                        </div>
                    </div>
                </section>

            </main>

            <footer className="mt-10 pt-4 border-t text-center text-xs text-gray-500">
                <p>Thank you for your interest in Jharkhand Technical Institute!</p>
                <p>This is a computer-generated document.</p>
            </footer>
        </div>
    );
};
