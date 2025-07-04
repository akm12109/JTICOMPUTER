
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Receipt, BellRing, Megaphone, MoreHorizontal, MessageSquare, FileStack, GalleryHorizontal, HelpCircle, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';

const mainNavItems = [
    { href: '/admin/billing', label: 'Billing', icon: Receipt },
    { href: '/admin/notices', label: 'Notices', icon: Megaphone },
    { href: '/admin/admissions', label: 'Admitted', icon: FileText },
    { href: '/admin/applications', label: 'Applications', icon: BellRing },
];

const moreNavItems = [
    { href: '/admin/bills', label: 'All Bills', icon: FileStack },
    { href: '/admin/career-profiles', label: 'Profiles', icon: Briefcase },
    { href: '/admin/gallery', label: 'Gallery', icon: GalleryHorizontal },
    { href: '/admin/messages', label: 'Messages', icon: MessageSquare },
    { href: '/admin/enquiries', label: 'Enquiries', icon: HelpCircle },
];


export default function AdminMobileNav() {
  const pathname = usePathname();

  const NavLink = ({ href, label, icon: Icon }: { href: string, label: string, icon: React.ElementType }) => (
    <Link
      href={href}
      className={cn(
        'flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors text-muted-foreground hover:bg-muted hover:text-primary',
        (pathname === href || (pathname !== '/admin' && pathname.startsWith(href))) && 'text-primary'
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="text-xs font-medium">{label}</span>
    </Link>
  );
  
  const MoreLink = ({ href, label, icon: Icon }: { href: string, label: string, icon: React.ElementType }) => (
    <Link
      href={href}
      className={cn(
        'flex flex-col items-center justify-center gap-1 p-4 rounded-lg transition-colors text-card-foreground bg-card hover:bg-muted hover:text-primary',
         (pathname === href || (pathname !== '/admin' && pathname.startsWith(href))) && 'text-primary bg-muted'
      )}
    >
      <Icon className="h-6 w-6" />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );


  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t z-50">
      <div className="grid h-full max-w-lg grid-cols-5 mx-auto">
        {mainNavItems.map(item => (
            <NavLink key={item.href} {...item} />
        ))}
        
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              className="inline-flex flex-col items-center justify-center p-2 text-center text-muted-foreground hover:bg-muted hover:text-primary rounded-lg group"
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-xs font-medium">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto rounded-t-lg">
             <nav className="grid grid-cols-3 gap-2 p-4">
                {moreNavItems.map(item => (
                    <MoreLink key={item.href} {...item} />
                ))}
             </nav>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
