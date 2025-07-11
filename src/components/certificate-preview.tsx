// src/components/certificate-preview.tsx
'use client'

import { format, isValid } from 'date-fns';
import JtiLogo from './jti-logo';

const CertificateValue = ({ value, className = '' }: { value: string | undefined, className?: string }) => (
    <span className={`font-semibold uppercase tracking-wide px-2 ${className}`}>
        {value || '...'}
    </span>
);

export const CertificatePreview = ({ certificate }: { certificate: any }) => {
    const issueDate = certificate.issueDate ? (typeof certificate.issueDate.toDate === 'function' ? certificate.issueDate.toDate() : new Date(certificate.issueDate)) : new Date();
    
    return (
        <div 
            style={{ 
                width: '297mm', 
                height: '210mm',
                fontFamily: "'Times New Roman', Times, serif",
                backgroundImage: "url('https://raw.githubusercontent.com/akm12109/image_bg_assets/main/JTI/certificate-bg.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                color: 'white',
            }}
            className="p-16 flex flex-col"
        >
            <main className="flex-grow flex flex-col items-center justify-center text-center -mt-8">
                <p className="text-7xl font-bold tracking-[0.2em] text-yellow-300" style={{ fontFamily: "'Garamond', serif" }}>CERTIFICATE</p>
                <p className="mt-8 text-lg text-gray-300">This certificate is proudly presented to</p>
                
                <CertificateValue value={certificate.studentName} className="text-5xl my-4 text-yellow-200" style={{fontFamily: "'Brush Script MT', cursive"}} />
                
                <p className="mt-4 text-lg text-gray-300">
                    for successfully completing the <CertificateValue value={certificate.courseName} className="text-xl text-yellow-300" /> course
                </p>
                <p className="text-lg text-gray-300">
                    with grade <CertificateValue value={certificate.grade} className="text-xl text-yellow-300" />.
                </p>

                 <p className="mt-2 text-base text-gray-400">
                    Duration: <CertificateValue value={certificate.duration} className="text-base text-yellow-400" /> | 
                    Regd. No: <CertificateValue value={certificate.registrationNo} className="text-base text-yellow-400" />
                </p>
            </main>

            <footer className="flex justify-between items-end text-sm text-gray-300">
                <div className="text-left">
                     <p>Date: {isValid(issueDate) ? format(issueDate, 'dd.MM.yyyy') : '...'}</p>
                     <p>S.No.: {certificate.serialNo || 'N/A'}</p>
                </div>
                <div className="text-center">
                    <div className="w-40 h-12"></div>
                    <p className="border-t border-dotted border-yellow-300/50 pt-1 uppercase tracking-wider">Director Signature</p>
                </div>
            </footer>
        </div>
    );
};
