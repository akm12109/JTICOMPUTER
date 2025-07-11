

'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, Timestamp, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { BellRing, Users, MessageSquare, HelpCircle, FileText, Banknote, Database, Cloud, ExternalLink, Megaphone, UserCheck, UserPlus, Image as ImageIcon, BookOpen, AlertCircle, GraduationCap } from 'lucide-react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';


type StatCardProps = {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description: string;
  isLoading: boolean;
};

const StatCard = ({ title, value, icon: Icon, description, isLoading }: StatCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <Skeleton className="h-8 w-1/2" />
      ) : (
        <div className="text-2xl font-bold">{value}</div>
      )}
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

const QuickLinkCard = ({ title, description, icon: Icon, href }: { title: string, description: string, icon: React.ElementType, href: string }) => (
    <Link href={href} className="block hover:bg-muted rounded-lg transition-colors">
        <Card className="h-full border-transparent shadow-none hover:border-primary/20">
            <CardHeader>
                <div className="mb-4 flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 mx-auto">
                    <Icon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-center font-headline">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-center text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    </Link>
)

const PIE_CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--muted))'];

type UsageState = {
    used: number;
    limit: number | null;
    unit: string;
    loading: boolean;
    error: string | null;
};

const initialUsageState: UsageState = {
    used: 0,
    limit: 0,
    unit: 'GB',
    loading: true,
    error: null,
};

const UsageCard = ({ title, usageState }: { title: string, usageState: UsageState }) => {
    const pieData = !usageState.loading && !usageState.error && usageState.limit !== null ? [
        { name: 'Used', value: usageState.used },
        { name: 'Free', value: Math.max(0, usageState.limit - usageState.used) },
    ] : [];
    
    return (
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Cloud /> {title}</CardTitle>
                <CardDescription>
                    Live storage usage for this account.
                </CardDescription>
            </CardHeader>
             <CardContent className="flex-grow flex items-center justify-center">
                {usageState.loading ? (
                    <Skeleton className="h-[200px] w-full" />
                ) : usageState.error ? (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{usageState.error}</AlertDescription>
                    </Alert>
                ) : (
                    <ResponsiveContainer width="100%" height={200}>
                        {pieData.length > 0 && usageState.limit !== null ? (
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" labelLine={false} innerRadius={60} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name" paddingAngle={5}>
                                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(value, name) => [`${(value as number).toFixed(2)} ${usageState.unit}`, name]} />
                                <Legend />
                                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold fill-foreground">
                                    {usageState.used.toFixed(2)}
                                </text>
                                <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" className="text-sm fill-muted-foreground">
                                    {usageState.unit} Used
                                </text>
                            </PieChart>
                        ) : (
                            <div className="text-center">
                                <p className="text-lg font-semibold">Usage: {usageState.used.toFixed(2)} {usageState.unit}</p>
                                <p className="text-sm text-muted-foreground">Limit information not available.</p>
                            </div>
                        )}
                    </ResponsiveContainer>
                )}
            </CardContent>
            <CardFooter>
                 <p className="text-xs text-muted-foreground">Total Limit: {usageState.limit !== null ? `${usageState.limit.toFixed(2)} ${usageState.unit}` : 'Not available'}</p>
            </CardFooter>
        </Card>
    );
};

const ActivityItem = ({ activity }: { activity: any }) => {
    const iconMap: { [key: string]: { icon: React.ElementType, color: string } } = {
        new_application: { icon: BellRing, color: "text-blue-500" },
        student_admitted: { icon: UserCheck, color: "text-green-500" },
        student_added: { icon: UserPlus, color: "text-emerald-500" },
        gallery_upload: { icon: ImageIcon, color: "text-purple-500" },
        note_published: { icon: BookOpen, color: "text-yellow-500" },
        notice_published: { icon: Megaphone, color: "text-orange-500" },
        new_enquiry: { icon: HelpCircle, color: "text-indigo-500" },
        new_message: { icon: MessageSquare, color: "text-pink-500" },
        instructor_added: { icon: GraduationCap, color: "text-teal-500" },
        placement_added: { icon: GraduationCap, color: "text-cyan-500" },
    };

    const { icon: Icon, color } = iconMap[activity.type] || { icon: AlertCircle, color: "text-gray-500" };
    const timeAgo = activity.timestamp ? formatDistanceToNow(activity.timestamp.toDate(), { addSuffix: true }) : 'just now';

    const content = (
        <div className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded-lg transition-colors">
            <div className={`mt-1 p-2 bg-muted rounded-full ${color}`}>
                <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1">
                <p className="text-sm">{activity.payload.description}</p>
                <p className="text-xs text-muted-foreground">{timeAgo}</p>
            </div>
        </div>
    );

    if (activity.payload.link) {
        return <Link href={activity.payload.link} className="block">{content}</Link>;
    }

    return content;
};


export default function AdminDashboardPage() {
    const [stats, setStats] = useState({ applications: 0, students: 0, messages: 0, enquiries: 0 });
    const [loadingStats, setLoadingStats] = useState(true);
    const [activityLog, setActivityLog] = useState<any[]>([]);
    const [loadingActivity, setLoadingActivity] = useState(true);
    
    const [mainUsage, setMainUsage] = useState<UsageState>(initialUsageState);
    const [profileUsage, setProfileUsage] = useState<UsageState>(initialUsageState);


    useEffect(() => {
        // Fetch stats from Firestore
        const fetchDbStats = async () => {
            if (db) {
                try {
                    const thirtyDaysAgo = Timestamp.fromMillis(Date.now() - 30 * 24 * 60 * 60 * 1000);
                    const [appSnapshot, studentSnapshot, msgSnapshot, enqSnapshot] = await Promise.all([
                        getDocs(query(collection(db, 'applications'), where('createdAt', '>=', thirtyDaysAgo))),
                        getDocs(query(collection(db, 'admissions'))),
                        getDocs(query(collection(db, 'messages'), where('createdAt', '>=', thirtyDaysAgo))),
                        getDocs(query(collection(db, 'enquiries'), where('enquiryDate', '>=', thirtyDaysAgo)))
                    ]);

                    setStats({
                        applications: appSnapshot.size,
                        students: studentSnapshot.size,
                        messages: msgSnapshot.size,
                        enquiries: enqSnapshot.size,
                    });
                } catch (error) {
                    console.error("Error fetching admin stats:", error);
                } finally {
                    setLoadingStats(false);
                }
            } else {
                setLoadingStats(false);
            }
        };

        const fetchCloudinaryUsage = async (account: 'main' | 'profile', setState: React.Dispatch<React.SetStateAction<UsageState>>) => {
            try {
                const response = await fetch(`/api/cloudinary-usage?account=${account}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to fetch usage data.');
                }
                const data = await response.json();
                setState({ ...data, loading: false, error: null });
            } catch (error: any) {
                setState({ ...initialUsageState, loading: false, error: error.message });
            }
        };

        const fetchActivityLog = async () => {
            if (!db) { setLoadingActivity(false); return; }
            setLoadingActivity(true);
            try {
                const q = query(
                    collection(db, 'activity_log'),
                    orderBy('timestamp', 'desc'),
                    limit(20)
                );
                const querySnapshot = await getDocs(q);
                const logData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setActivityLog(logData);
            } catch (error) {
                console.error("Error fetching activity log:", error);
            } finally {
                setLoadingActivity(false);
            }
        };
        
        fetchDbStats();
        fetchCloudinaryUsage('main', setMainUsage);
        fetchCloudinaryUsage('profile', setProfileUsage);
        fetchActivityLog();
    }, []);

    const quickLinks = [
        { title: 'Applications', description: 'Review and approve new student applications.', icon: BellRing, href: '/admin/applications' },
        { title: 'Admitted Students', description: 'View and manage all admitted students.', icon: Users, href: '/admin/admissions' },
        { title: 'Bill Generator', description: 'Create and manage student invoices.', icon: Banknote, href: '/admin/billing' },
        { title: 'Notices & Notes', description: 'Publish announcements and study materials.', icon: FileText, href: '/admin/notices' },
    ];

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold font-headline">Admin Dashboard</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Pending Applications" value={stats.applications} icon={BellRing} description="in the last 30 days" isLoading={loadingStats} />
                <StatCard title="Total Students" value={stats.students} icon={Users} description="Total admitted students" isLoading={loadingStats} />
                <StatCard title="New Messages" value={stats.messages} icon={MessageSquare} description="in the last 30 days" isLoading={loadingStats} />
                <StatCard title="New Enquiries" value={stats.enquiries} icon={HelpCircle} description="in the last 30 days" isLoading={loadingStats} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {quickLinks.map(link => <QuickLinkCard key={link.href} {...link} />)}
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>A live feed of the most recent events.</CardDescription>
                </CardHeader>
                <CardContent className="max-h-96 overflow-y-auto">
                     {loadingActivity ? (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                        </div>
                    ) : activityLog.length === 0 ? (
                        <div className="text-center text-muted-foreground py-10">
                            <p>No recent activity.</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {activityLog.map(activity => <ActivityItem key={activity.id} activity={activity} />)}
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid gap-8 md:grid-cols-2">
                <UsageCard title="Main Gallery Usage" usageState={mainUsage} />
                <UsageCard title="Profile Media Usage" usageState={profileUsage} />
            </div>
            
             <div className="pt-4">
                <h3 className="text-xl font-bold font-headline mb-4">External Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button asChild variant="outline" className="w-full justify-start">
                        <a href="https://console.firebase.google.com/project/jti-goddax/usage" target="_blank" rel="noopener noreferrer">
                            <Database className="mr-2 h-4 w-4" /> View Firebase Usage <ExternalLink className="ml-auto h-4 w-4" />
                        </a>
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-start">
                        <a href="https://cloudinary.com/console" target="_blank" rel="noopener noreferrer">
                            <Cloud className="mr-2 h-4 w-4" /> Manage Cloudinary <ExternalLink className="ml-auto h-4 w-4" />
                        </a>
                    </Button>
                </div>
             </div>
        </div>
    );
}
