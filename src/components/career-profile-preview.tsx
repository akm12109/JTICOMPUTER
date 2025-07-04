'use client'

import JtiLogo from '@/components/jti-logo';
import { format, isValid } from 'date-fns';
import Image from 'next/image';

const DetailItem = ({ label, value }: { label: string, value: string | number | undefined | null }) => (
    <div>
        <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">{label}</p>
        <p className="text-sm text-black">{value || 'N/A'}</p>
    </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-base font-bold font-headline border-b-2 border-primary/50 mb-3 pb-1 text-primary">{children}</h2>
);

export const CareerProfilePreview = ({ student }: { student: any }) => {
    const dob = student.dob ? (student.dob as any).toDate ? (student.dob as any).toDate() : new Date(student.dob) : null;
    const admissionDate = student.admissionDate ? new Date(student.admissionDate) : null;

    const renderAddress = (address: any, title: string) => {
        if (!address || Object.keys(address).length === 0) return null;
        return (
            <div>
                <h3 className="font-semibold text-sm mb-2 text-gray-700">{title}</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <p className="col-span-2"><span className="font-semibold">Address:</span> {address?.address || 'N/A'}</p>
                    <p><span className="font-semibold">City:</span> {address?.city || 'N/A'}</p>
                    <p><span className="font-semibold">PIN:</span> {address?.pin || 'N/A'}</p>
                    <p><span className="font-semibold">District:</span> {address?.district || 'N/A'}</p>
                    <p><span className="font-semibold">State:</span> {address?.state || 'N/A'}</p>
                </div>
            </div>
        );
    }

    const renderAcademicTable = (qualifications: any[], title: string) => {
        if (!qualifications || qualifications.length === 0) return <p className="text-xs text-gray-500">{title}: No details provided.</p>;
        return (
            <div>
                 <h3 className="font-semibold text-sm mb-2 text-gray-700">{title}</h3>
                 <table className="w-full text-xs border-collapse border border-gray-300">
                    <thead className="bg-gray-50">
                        <tr className="bg-gray-100">
                            <th className="border border-gray-300 p-1 text-left font-semibold">Examination</th>
                            <th className="border border-gray-300 p-1 text-left font-semibold">Board</th>
                            <th className="border border-gray-300 p-1 text-left font-semibold">Year</th>
                            <th className="border border-gray-300 p-1 text-left font-semibold">Division</th>
                            <th className="border border-gray-300 p-1 text-left font-semibold">% Marks</th>
                        </tr>
                    </thead>
                    <tbody>
                        {qualifications.map((q, i) => (
                             <tr key={i}>
                                <td className="border border-gray-300 p-1">{q.examination || 'N/A'}</td>
                                <td className="border border-gray-300 p-1">{q.board || 'N/A'}</td>
                                <td className="border border-gray-300 p-1">{q.passingYear || 'N/A'}</td>
                                <td className="border border-gray-300 p-1">{q.division || 'N/A'}</td>
                                <td className="border border-gray-300 p-1">{q.percentage || 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white text-black font-sans text-xs">
            <header className="flex justify-between items-start pb-4 mb-4 border-b-2 border-gray-200">
                 <JtiLogo size="medium" />
                 <div className="text-right">
                    <h1 className="text-xl font-bold font-headline text-primary">Student Career Profile</h1>
                    <p className="text-xs text-gray-500">UID: {student.uid}</p>
                </div>
            </header>

            <main className="space-y-4">
                <section>
                    <SectionTitle>Personal Details</SectionTitle>
                    <div className="flex gap-4">
                        {student.photoDataUri && (
                            <div className="w-24 h-32 border-2 border-gray-200 p-1 rounded flex-shrink-0 bg-gray-50">
                                <Image src={student.photoDataUri} alt="Student Photo" width={96} height={128} className="object-cover w-full h-full" />
                            </div>
                        )}
                        <div className="grid grid-cols-3 gap-x-4 gap-y-2 flex-grow">
                             <DetailItem label="Full Name" value={student.name} />
                             <DetailItem label="Father's Name" value={student.fatherName} />
                             <DetailItem label="Mother's Name" value={student.motherName} />
                             <DetailItem label="Date of Birth" value={dob && isValid(dob) ? format(dob, 'PPP') : 'N/A'} />
                             <DetailItem label="Email" value={student.email} />
                             <DetailItem label="Course" value={student.courseAppliedFor} />
                             <DetailItem label="Registered Phone" value={student.phone} />
                             <DetailItem label="Candidate's Mobile" value={student.candidateMobile} />
                             <DetailItem label="Sex" value={student.sex} />
                             <DetailItem label="Marital Status" value={student.maritalStatus === 'yes' ? 'Married' : 'Unmarried'} />
                             <DetailItem label="Blood Group" value={student.bloodGroup} />
                             <DetailItem label="Category" value={student.category} />
                             <DetailItem label="Religion" value={student.religion} />
                             <DetailItem label="Nationality" value={student.nationality} />
                             <div className="col-span-3">
                                 <DetailItem label="Identification Marks" value={student.identificationMarks} />
                             </div>
                        </div>
                    </div>
                </section>

                <section>
                     <SectionTitle>Academic Background</SectionTitle>
                     <div className="space-y-3">
                        {renderAcademicTable(student.qualifications, "Educational Qualifications")}
                     </div>
                </section>
                
                 <section>
                    <SectionTitle>Last Qualifying Examination</SectionTitle>
                    <div className="grid grid-cols-4 gap-2">
                        <DetailItem label="Exam Name" value={student.lastQualifyingExam?.lastExamName} />
                        <DetailItem label="Board/University" value={student.lastQualifyingExam?.boardOrUnivName} />
                        <DetailItem label="Year" value={student.lastQualifyingExam?.examYear} />
                        <DetailItem label="Percentage" value={student.lastQualifyingExam?.percentageOfMarks} />
                    </div>
                </section>

                <section>
                    <SectionTitle>Address Information</SectionTitle>
                    <div className="space-y-3">
                       {renderAddress(student.localAddress, "Local Address")}
                       {renderAddress(student.permanentAddress, "Permanent Address")}
                    </div>
                </section>

                 <section>
                    <SectionTitle>Guardian Information</SectionTitle>
                    <div className="grid grid-cols-3 gap-2">
                       <DetailItem label="Guardian Name" value={student.guardianAddress?.guardianName} />
                       <DetailItem label="Relation" value={student.guardianAddress?.relationWithGuardian} />
                       <DetailItem label="Mobile" value={student.guardianAddress?.mobile} />
                    </div>
                </section>

            </main>
            <footer className="mt-6 pt-4 border-t text-center text-xs text-gray-500">
                <p>This document was generated on {format(new Date(), 'PPP')}.</p>
            </footer>
        </div>
    )
}
