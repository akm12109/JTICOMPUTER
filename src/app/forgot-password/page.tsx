'use client';
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLanguage } from "@/hooks/use-language";
import ForgotPasswordForm from "@/components/forgot-password-form";

export default function ForgotPasswordPage() {
  const { t } = useLanguage();

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] py-12 px-4">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">{t('forgot_password_page.title')}</CardTitle>
          <CardDescription>
            {t('forgot_password_page.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm />
          <div className="mt-4 text-center text-sm">
            {t('forgot_password_page.remember_password')}{" "}
            <Link href="/login" className="underline text-primary">
              {t('common.login')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
