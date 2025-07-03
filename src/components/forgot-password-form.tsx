'use client';

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { sendPasswordResetEmail } from "firebase/auth"
import { auth } from "@/lib/firebase"
import React from "react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Mail, Send } from "lucide-react"
import { useLanguage } from "@/hooks/use-language";

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
})

export default function ForgotPasswordForm() {
    const { toast } = useToast()
    const { t } = useLanguage()
    const router = useRouter()
    const [loading, setLoading] = React.useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true);
        if (!auth) {
          toast({
            variant: 'destructive',
            title: 'Request Failed',
            description: "Firebase is not configured. Please contact support.",
          });
          setLoading(false);
          return;
        }
        try {
          await sendPasswordResetEmail(auth, values.email);
          toast({
              title: t('forgot_password_page.success_title'),
              description: t('forgot_password_page.success_desc'),
          });
          router.push('/login');
        } catch (error: any) {
          console.error("Password reset error:", error);
          toast({
            variant: 'destructive',
            title: t('forgot_password_page.error_title'),
            description: t('forgot_password_page.error_desc'),
          });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{t('forgot_password_page.email_label')}</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input type="email" placeholder={t('forgot_password_page.email_placeholder')} {...field} className="pl-10" />
                            </div>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? t('forgot_password_page.sending_text') : t('forgot_password_page.button_text')} <Send className="ml-2 h-4 w-4" />
                </Button>
            </form>
        </Form>
    )
}
