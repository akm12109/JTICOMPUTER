
'use client';

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import React from "react"
import { format, isValid } from "date-fns"

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
import { CalendarIcon, UserPlus } from "lucide-react"
import { useLanguage } from "@/hooks/use-language";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { cn } from "@/lib/utils"
import { Calendar } from "./ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { courseKeys } from "@/lib/course-data"
import { Textarea } from "./ui/textarea"

const formSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    fatherName: z.string().min(2, { message: "Father's name must be at least 2 characters." }),
    dob: z.string().min(1, { message: "A date of birth is required."}).refine(val => isValid(new Date(val)), {message: "Please enter a valid date."}),
    phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }),
    address: z.string().min(10, { message: "Address must be at least 10 characters." }),
    lastQualification: z.string().min(2, { message: "Qualification is required." }),
    courseAppliedFor: z.string({ required_error: "Please select a course." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
})

export default function RegisterForm() {
    const { toast } = useToast()
    const { t } = useLanguage()
    const router = useRouter()
    const [loading, setLoading] = React.useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            fatherName: "",
            dob: "",
            phone: "",
            address: "",
            lastQualification: "",
            email: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true);
        if (!db) {
            toast({
                variant: 'destructive',
                title: 'Application Failed',
                description: 'Firebase not configured. Please contact support.',
            });
            setLoading(false);
            return;
        }
        try {
            await addDoc(collection(db, "applications"), {
                ...values,
                dob: new Date(values.dob),
                createdAt: serverTimestamp(),
                status: 'pending'
            });

            toast({
                title: t('admission_page.success_title'),
                description: t('admission_page.success_desc'),
            });
            router.push('/');
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Application Failed',
                description: 'An error occurred. Please try again.',
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>{t('admission_page.name_label')}</FormLabel>
                            <FormControl>
                                <Input placeholder={t('admission_page.name_placeholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="fatherName"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>{t('admission_page.father_name_label')}</FormLabel>
                            <FormControl>
                                <Input placeholder={t('admission_page.father_name_placeholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                 <FormField
                    control={form.control}
                    name="dob"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>{t('admission_page.dob_label')}</FormLabel>
                        <Popover>
                            <div className="relative flex items-center">
                                <FormControl>
                                    <Input
                                        placeholder="YYYY-MM-DD"
                                        {...field}
                                    />
                                </FormControl>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"ghost"}
                                        size="icon"
                                        className="absolute right-0 h-full w-10 rounded-l-none"
                                        type="button"
                                        >
                                        <CalendarIcon className="h-4 w-4" />
                                    </Button>
                                </PopoverTrigger>
                            </div>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={field.value && isValid(new Date(field.value)) ? new Date(field.value) : undefined}
                                    onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                                    disabled={(date) =>
                                    date > new Date() || date < new Date("1950-01-01")
                                    }
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{t('admission_page.phone_label')}</FormLabel>
                        <FormControl>
                            <Input placeholder={t('admission_page.phone_placeholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{t('admission_page.address_label')}</FormLabel>
                        <FormControl>
                            <Textarea placeholder={t('admission_page.address_placeholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="lastQualification"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>{t('admission_page.qualification_label')}</FormLabel>
                            <FormControl>
                                <Input placeholder={t('admission_page.qualification_placeholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="courseAppliedFor"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>{t('admission_page.course_label')}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('admission_page.course_placeholder')} />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                 {courseKeys.map(key => (
                                    <SelectItem key={key} value={t(`courses_data.${key}.title`)}>{t(`courses_data.${key}.title`)}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{t('admission_page.email_label')}</FormLabel>
                        <FormControl>
                            <Input type="email" placeholder={t('admission_page.email_placeholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Submitting..." : t('common.submit_application')} <UserPlus className="ml-2 h-4 w-4" />
                </Button>
            </form>
        </Form>
    )
}
