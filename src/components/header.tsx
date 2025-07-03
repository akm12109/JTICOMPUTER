'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, LogOut, LayoutDashboard } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import LanguageSwitcher from './language-switcher';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const routes = [
  { href: '/', labelKey: 'nav.home' },
  { href: '/courses', labelKey: 'nav.courses' },
  { href: '/about', labelKey: 'nav.about' },
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
          <Image
            src="https://raw.githubusercontent.com/akm12109/image_bg_assets/main/JTI/logo.png"
            alt="JTI Godda Logo"
            width={56}
            height={56}
            className="rounded-full"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {t(route.labelKey)}
            </Link>
          ))}
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
            <SheetContent side="right">
              <div className="flex flex-col gap-6 p-6">
                <Link href="/" className="flex items-center gap-2">
                  <Image
                    src="https://raw.githubusercontent.com/akm12109/image_bg_assets/main/JTI/logo.png"
                    alt="JTI Godda Logo"
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                </Link>
                <nav className="flex flex-col gap-4">
                  {routes.map((route) => (
                    <Link
                      key={route.href}
                      href={route.href}
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
                 <div className="mt-4">
                    <LanguageSwitcher />
                  </div>
                <div className="flex flex-col gap-2 mt-auto">
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
