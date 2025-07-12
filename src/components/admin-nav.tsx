'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, MessageSquare, Receipt, FileStack, BellRing, Megaphone, GalleryHorizontal, HelpCircle, Briefcase, BookOpen, UserPlus, LayoutDashboard, GraduationCap, BadgeCheck, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import JtiLogo from './jti-logo';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/applications', label: 'Applications', icon: BellRing },
  { href: '/admin/admissions', label: 'Admitted Students', icon: FileText },
  { href: '/admin/add-students', label: 'Add Students', icon: UserPlus },
  { href: '/admin/career-profiles', label: 'Career Profiles', icon: Briefcase },
  { href: '/admin/instructors', label: 'Instructors', icon: GraduationCap },
  { href: '/admin/placements', label: 'Placements', icon: GraduationCap },
  { href: '/admin/billing', label: 'Bill Generator', icon: Receipt },
  { href: '/admin/bills', label: 'All Bills', icon: FileStack },
  { href: '/admin/certificates', label: 'Certificates', icon: BadgeCheck },
  { href: '/admin/notices', label: 'Notices', icon: Megaphone },
  { href: '/admin/notes', label: 'Notes', icon: BookOpen },
  { href: '/admin/gallery', label: 'Gallery', icon: GalleryHorizontal },
  { href: '/admin/slideshow', label: 'Slideshow', icon: Camera },
  { href: '/admin/messages', label: 'Messages', icon: MessageSquare },
  { href: '/admin/enquiries', label: 'Enquiries', icon: HelpCircle },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-card border-r hidden md:block">
      <div className="p-4 border-b flex items-center gap-4">
        <JtiLogo size="large" />
      </div>
      <nav className="p-4">
        <ul>
          {navItems.map(item => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                  (item.href === '/admin' ? pathname === item.href : pathname.startsWith(item.href)) ? 'bg-muted text-primary' : ''
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
