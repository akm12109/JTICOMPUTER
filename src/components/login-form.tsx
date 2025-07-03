'use client';

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signInWithEmailAndPassword } from "firebase/auth"
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
import { LogIn, Mail, Lock } from "lucide-react"
import { useLanguage } from "@/hooks/use-language";

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
})

export default function LoginForm() {
    const { toast } = useToast()
    const { t } = useLanguage()
    const router = useRouter()
    const [loading, setLoading] = React.useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
        email: "",
        password: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true);
        if (!auth) {
          toast({
            variant: 'destructive',
            title: 'Login Failed',
            description: "Firebase is not configured. Please contact support.",
          });
          setLoading(false);
          return;
        }
        try {
          const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
          const user = userCredential.user;
          toast({
              title: t('login_page.success_title'),
              description: t('login_page.success_desc'),
          });

          if (user.email === 'admin@jtigodda.in') {
            router.push('/admin/admissions');
          } else {
            router.push('/dashboard');
          }
        } catch (error: any) {
          toast({
            variant: 'destructive',
            title: 'Login Failed',
            description: "Invalid email or password. Please try again.",
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
                        <FormLabel>{t('login_page.email_label')}</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input type="email" placeholder={t('login_page.email_placeholder')} {...field} className="pl-10" />
                            </div>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex items-center">
                                <FormLabel>{t('login_page.password_label')}</FormLabel>
                                <Link
                                    href="#"
                                    className="ml-auto inline-block text-sm underline text-primary"
                                >
                                    {t('login_page.forgot_password')}
                                </Link>
                            </div>
                            <FormControl>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input type="password" placeholder={t('login_page.password_placeholder')} {...field} className="pl-10" />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Logging in..." : t('common.login')} <LogIn className="ml-2 h-4 w-4" />
                </Button>
            </form>
        </Form>
    )
}
