
'use client';
import Link from "next/link"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import RegisterForm from "@/components/register-form"
import { useLanguage } from "@/hooks/use-language";

export default function RegisterPage() {
  const { t } = useLanguage();
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] py-12 px-4">
      <Card className="mx-auto max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">{t('admission_page.title')}</CardTitle>
          <CardDescription>
            {t('admission_page.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
          <div className="mt-4 text-center text-sm">
            {t('admission_page.have_account')}{" "}
            <Link href="/login" className="underline text-primary">
              {t('admission_page.login_link')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
