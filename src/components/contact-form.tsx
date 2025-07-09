

"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import React from "react"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

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
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Send } from "lucide-react"
import { useLanguage } from "@/hooks/use-language"
import { logActivity } from "@/lib/activity-logger"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  subject: z.string().min(5, {
    message: "Subject must be at least 5 characters.",
  }),
  message: z.string().min(10, {
    message: "Message must be at least 10 characters.",
  }),
})

export default function ContactForm() {
  const { toast } = useToast()
  const { t } = useLanguage()
  const [loading, setLoading] = React.useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    if (!db) {
        toast({
            variant: 'destructive',
            title: 'Failed to send message',
            description: 'Firebase not configured. Please contact support.',
        });
        setLoading(false);
        return;
    }
    try {
      await addDoc(collection(db, "messages"), {
        ...values,
        createdAt: serverTimestamp(),
        isRead: false,
      });

      await logActivity('new_message', {
        description: `New contact message from ${values.name} with subject "${values.subject}".`
      });

      toast({
        title: t('contact_form.success_title'),
        description: t('contact_form.success_desc'),
      });
      form.reset();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to send message',
        description: 'Please try again later.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('contact_form.name_label')}</FormLabel>
              <FormControl>
                <Input placeholder={t('contact_form.name_placeholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('contact_form.email_label')}</FormLabel>
              <FormControl>
                <Input placeholder={t('contact_form.email_placeholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('contact_form.subject_label')}</FormLabel>
              <FormControl>
                <Input placeholder={t('contact_form.subject_placeholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('contact_form.message_label')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('contact_form.message_placeholder')}
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Sending..." : t('common.send_message')} <Send className="ml-2 h-4 w-4" />
        </Button>
      </form>
    </Form>
  )
}
