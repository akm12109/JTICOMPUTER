'use client';
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import EnquiryForm from "@/components/enquiry-form";
import { useLanguage } from "@/hooks/use-language";

export default function EnquiryPage() {
  const { t } = useLanguage();

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] py-12 px-4 bg-muted/20">
      <Card className="mx-auto max-w-3xl w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">{t('enquiry_page.title')}</CardTitle>
          <CardDescription>
            {t('enquiry_page.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EnquiryForm />
        </CardContent>
      </Card>
    </div>
  );
}
