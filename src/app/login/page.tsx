'use client';
import Link from "next/link";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import LoginForm from "@/components/login-form";
import { useLanguage } from "@/hooks/use-language";

export default function LoginPage() {
  const { t } = useLanguage();

  return (
    <div className="w-full min-h-[calc(100vh-8rem)] lg:grid lg:grid-cols-2">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex">
        <Image
          src="https://img.freepik.com/premium-photo/young-student-woman-isolated-white-background-proud-self-satisfied_1368-208258.jpg?w=2000"
          alt="A proud and self-satisfied young student"
          fill
          className="object-cover"
          data-ai-hint="student smiling"
        />
        <div className="absolute inset-0 bg-primary/80" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="https://raw.githubusercontent.com/akm12109/image_bg_assets/main/JTI/logo.png"
              alt="JTI Godda Logo"
              width={40}
              height={40}
              className="rounded-full"
            />
          </Link>
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;{t('home_page.testimonial1_text')}&rdquo;
            </p>
            <footer className="text-sm">{t('home_page.testimonial1_author')}</footer>
          </blockquote>
        </div>
      </div>
      <div className="flex items-center justify-center py-12 px-4">
        <Card className="mx-auto max-w-sm w-full">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">{t('login_page.title')}</CardTitle>
            <CardDescription>
              {t('login_page.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
            <div className="mt-4 text-center text-sm">
              {t('login_page.no_account_admission')}{" "}
              <Link href="/register" className="underline text-primary">
                {t('login_page.admission_link')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
