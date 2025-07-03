'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AdminNav from '@/components/admin-nav';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/login');
    } else if (user.email !== 'admin@jtigodda.in') {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || !user || user.email !== 'admin@jtigodda.in') {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading Admin Panel...</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/40">
      <AdminNav />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
