'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { Menu, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import LanguageSwitcher from './language-switcher';
import JtiLogo from './jti-logo';
import { useAuth } from '@/hooks/use-auth';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ThemeSwitcher from './theme-switcher';

const navItems = [
  { href: '/', labelKey: 'nav.home' },
  { href: '/courses', labelKey: 'nav.courses' },
  {
    labelKey: 'nav.gallery',
    isDropdown: true,
    items: [
      { href: '/gallery/images', labelKey: 'nav.image_gallery' },
      { href: '/gallery/videos', labelKey: 'nav.video_gallery' },
    ],
  },
  { href: '/about', labelKey: 'nav.about' },
  { href: '/enquiry', labelKey: 'nav.enquiry' },
  { href: '/contact', labelKey: 'nav.contact' },
];


export default function Header() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const isLoggedIn = !!user;

  const handleLogout = async () => {
    if (!auth) {
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "Firebase is not configured."
      });
      return;
    }
    await signOut(auth);
    router.push('/');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out."
    })
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <JtiLogo size="medium" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) =>
            item.isDropdown ? (
              <DropdownMenu key={item.labelKey}>
                <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary focus:outline-none">
                  {t(item.labelKey)}
                  <ChevronDown className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {item.items?.map((subItem) => (
                    <DropdownMenuItem key={subItem.href} asChild>
                      <Link href={subItem.href}>{t(subItem.labelKey)}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                key={item.href}
                href={item.href!}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                {t(item.labelKey)}
              </Link>
            )
          )}
          {user && user.email === 'admin@jtigodda.in' && (
             <Link
              href="/admin/admissions"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Admin
            </Link>
          )}
        </nav>
        
        <div className="hidden md:flex items-center gap-4">
           <ThemeSwitcher />
           <LanguageSwitcher />
          {isLoggedIn ? (
            <>
              <Button asChild>
                <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" />{t('common.dashboard')}</Link>
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />{t('common.logout')}
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="outline">
                <Link href="/login">{t('common.login')}</Link>
              </Button>
              <Button asChild>
                <Link href="/register">{t('common.get_admission')}</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <SheetDescription className="sr-only">Main navigation for the website, including links to pages and user actions.</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-6 h-full">
                <Link href="/" className="flex items-center gap-2">
                  <JtiLogo size="medium" />
                </Link>
                <nav className="flex flex-col gap-4">
                  {navItems.flatMap((item) => 
                    item.isDropdown ? item.items!.map(sub => ({ ...sub, labelKey: `${sub.labelKey}` })) : [item]
                  ).map((route) => (
                    <Link
                      key={route.href}
                      href={route.href!}
                      className="text-lg font-medium text-foreground hover:text-primary"
                    >
                      {t(route.labelKey)}
                    </Link>
                  ))}
                  {user && user.email === 'admin@jtigodda.in' && (
                    <Link
                      href="/admin/admissions"
                      className="text-lg font-medium text-foreground hover:text-primary"
                    >
                      Admin
                    </Link>
                  )}
                </nav>
                <div className="mt-auto flex flex-col gap-4">
                    <div className="flex gap-2">
                        <ThemeSwitcher />
                        <LanguageSwitcher />
                    </div>
                    {isLoggedIn ? (
                        <>
                          <Button asChild>
                              <Link href="/dashboard">{t('common.dashboard')}</Link>
                          </Button>
                          <Button variant="outline" onClick={handleLogout}>{t('common.logout')}</Button>
                        </>
                    ) : (
                        <>
                          <Button asChild>
                              <Link href="/register">{t('common.get_admission')}</Link>
                          </Button>
                          <Button asChild variant="outline">
                              <Link href="/login">{t('common.login')}</Link>
                          </Button>
                        </>
                    )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
