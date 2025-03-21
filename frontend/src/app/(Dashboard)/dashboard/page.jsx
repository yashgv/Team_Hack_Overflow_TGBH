'use client';
import { useState, useEffect } from 'react';
import { useUser } from "@clerk/nextjs";
import { supabase } from '@/lib/supabase';
import { Plus, Bell, LayoutDashboard, PieChart, CalendarClock, ListTodo, Calendar, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/lib/languageContext';
import { useTranslation } from '@/hooks/useTranslation';
import { translateBatch } from '@/lib/translation';

import StatsCard from '@/components/dashboard/StatsCard';
import LoansList from '@/components/dashboard/LoansList';
import AddLoanForm from '@/components/dashboard/AddLoanForm';
import EMICalendar from '@/components/dashboard/EMICalendar';
import LoanAnalytics from '@/components/dashboard/LoanAnalytics';
import NotificationsPanel from '@/components/dashboard/NotificationsPanel';

export default function DashboardPage() {
  const { user } = useUser();
  const [showAddLoan, setShowAddLoan] = useState(false);
  const [loans, setLoans] = useState([]);
  const [stats, setStats] = useState({
    totalLoanAmount: 0,
    totalEMI: 0,
    activeLoans: 0,
    completedLoans: 0
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [translations, setTranslations] = useState({
    overviewTitle: '',
    dashboardDesc: '',
    addLoanText: '',
    notificationsTitle: '',
    noNotifications: '',
    totalLoan: '',
    monthlyEMI: '',
    activeLoans: '',
    completedLoans: ''
  });

  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'overview';
  const selectedDate = searchParams.get('date') ? new Date(searchParams.get('date')) : null;

  const { language } = useLanguage();

  const translatePageContent = async (language) => {
    setLoading(true);
    try {
      // Translate static content
      const staticContent = await translateBatch([
        'Overview',
        'Manage your loans and track EMI payments',
        'Add New Loan',
        'Notifications',
        'No new notifications',
        'Total Loan Amount',
        'Monthly EMI',
        'Active Loans',
        'Completed Loans'
      ], language);

      // Update translations
      setTranslations({
        overviewTitle: staticContent[0],
        dashboardDesc: staticContent[1],
        addLoanText: staticContent[2],
        notificationsTitle: staticContent[3],
        noNotifications: staticContent[4],
        totalLoan: staticContent[5],
        monthlyEMI: staticContent[6],
        activeLoans: staticContent[7],
        completedLoans: staticContent[8]
      });

      // Translate loans data
      if (loans.length > 0) {
        const translatedLoans = await translateBatch(loans, language);
        setLoans(translatedLoans);
      }

      // Translate notifications
      if (notifications.length > 0) {
        const translatedNotifs = await translateBatch(notifications, language);
        setNotifications(translatedNotifs);
      }
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLoans();
      fetchNotifications();
    }
  }, [user, language]);

  useEffect(() => {
    translatePageContent(language);
  }, [language]);

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    fetchLoans();
    fetchNotifications();
  };

  const fetchLoans = async () => {
    try {
      // First fetch loans data
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('clerk_id', user.id);

      if (error) throw error;

      // Translate if needed
      const translatedLoans = language === 'en-IN' ? data : await Promise.all(
        data.map(async (loan) => ({
          ...loan,
          loan_type: await translateText(loan.loan_type, language),
          loan_purpose: await translateText(loan.loan_purpose, language)
        }))
      );

      setLoans(translatedLoans);
      calculateStats(translatedLoans);
    } catch (error) {
      console.error('Error fetching loans:', error);
      toast.error("Failed to fetch loans data");
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data: loans } = await supabase
        .from('loans')
        .select('*')
        .eq('clerk_id', user.id)
        .eq('loan_status', 'active');

      if (!loans) return;

      const today = new Date();
      const notifs = [];

      loans.forEach(loan => {
        const emiDate = new Date(today.getFullYear(), today.getMonth(), loan.payment_date);
        const daysUntilDue = Math.ceil((emiDate - today) / (1000 * 60 * 60 * 24));

        if (daysUntilDue <= 5 && daysUntilDue > 0) {
          notifs.push({
            id: `upcoming-${loan.id}`,
            type: 'upcoming',
            title: language === 'hi-IN' ? 'आगामी ईएमआई भुगतान' : 'Upcoming EMI Payment',
            message: language === 'hi-IN' 
              ? `${loan.loan_type} ईएमआई ₹${loan.emi_amount.toLocaleString('en-IN')} ${daysUntilDue} दिनों में देय है`
              : `${loan.loan_type} EMI of ₹${loan.emi_amount.toLocaleString('en-IN')} is due in ${daysUntilDue} days`,
            icon: Calendar,
            color: 'bg-blue-100 text-blue-600'
          });
        }

        if (daysUntilDue < 0) {
          notifs.push({
            id: `overdue-${loan.id}`,
            type: 'warning',
            title: language === 'hi-IN' ? 'बकाया भुगतान' : 'Payment Overdue',
            message: language === 'hi-IN'
              ? `${loan.loan_type} ईएमआई ₹${loan.emi_amount.toLocaleString('en-IN')} ${Math.abs(daysUntilDue)} दिन पहले देय था`
              : `${loan.loan_type} EMI of ₹${loan.emi_amount.toLocaleString('en-IN')} was due ${Math.abs(daysUntilDue)} days ago`,
            icon: AlertTriangle,
            color: 'bg-red-100 text-red-600'
          });
        }
      });

      setNotifications(notifs);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error("Failed to fetch notifications");
    }
  };

  const calculateStats = (loanData) => {
    const stats = loanData.reduce((acc, loan) => ({
      totalLoanAmount: acc.totalLoanAmount + Number(loan.loan_amount),
      totalEMI: acc.totalEMI + Number(loan.emi_amount),
      activeLoans: acc.activeLoans + (loan.loan_status === 'active' ? 1 : 0),
      completedLoans: acc.completedLoans + (loan.loan_status === 'completed' ? 1 : 0),
    }), {
      totalLoanAmount: 0,
      totalEMI: 0,
      activeLoans: 0,
      completedLoans: 0
    });

    setStats(stats);
  };

  return (
    <div className="container mx-auto p-6">
      {/* Updated Header with translations */}
      <div className="relative overflow-hidden rounded-lg border bg-card p-4 mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10" />
        <div className="flex justify-between items-center relative">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              {translations.overviewTitle}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {translations.dashboardDesc}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Sheet open={showNotifications} onOpenChange={setShowNotifications}>
              <SheetTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="relative"
                >
                  <Bell className="h-5 w-5" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>{translations.notificationsTitle}</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-4">
                  {notifications.length === 0 ? (
                    <p className="text-center text-muted-foreground">{translations.noNotifications}</p>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="flex gap-4 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                      >
                        <div className={`p-2 rounded-full ${notification.color}`}>
                          <notification.icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{notification.title}</p>
                          <p className="text-sm text-muted-foreground">{notification.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </SheetContent>
            </Sheet>
            <Button 
              onClick={() => setShowAddLoan(true)} 
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              {translations.addLoanText}
            </Button>
          </div>
        </div>
      </div>

      {/* Updated Stats Grid with translations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title={translations.totalLoan}
          value={stats.totalLoanAmount}
          type="currency"
          icon={PieChart}
        />
        <StatsCard
          title={translations.monthlyEMI}
          value={stats.totalEMI}
          type="currency"
          icon={CalendarClock}
        />
        <StatsCard
          title={translations.activeLoans}
          value={stats.activeLoans}
          type="number"
          icon={ListTodo}
        />
        <StatsCard
          title={translations.completedLoans}
          value={stats.completedLoans}
          type="number"
          icon={LayoutDashboard}
        />
      </div>

      {/* Updated Tabs with translations */}
      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-100/50 dark:bg-emerald-900/50 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            {translations.overviewTitle}
          </TabsTrigger>
          <TabsTrigger value="loans" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
            <ListTodo className="h-4 w-4 mr-2" />
            {translations.loans}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
            <PieChart className="h-4 w-4 mr-2" />
            {translations.analytics}
          </TabsTrigger>
          <TabsTrigger value="calendar" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
            <CalendarClock className="h-4 w-4 mr-2" />
            {translations.calendar}
          </TabsTrigger>
        </TabsList>

        {/* Updated Tab Content */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <Card className="border-emerald-200/50">
                <LoansList loans={loans} onUpdate={fetchLoans} />
              </Card>
            </div>
            <div>
              <Card className="border-emerald-200/50">
                <NotificationsPanel />
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="loans" className="space-y-4">
          <Card className="border-emerald-200/50 p-6">
            <LoansList loans={loans} onUpdate={fetchLoans} expanded />
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <LoanAnalytics loans={loans} />
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <EMICalendar 
                loans={loans} 
                onUpdate={fetchLoans}
                selectedDate={selectedDate}
              />
            </div>
            <div>
              <Card className="border-emerald-200/50">
                <NotificationsPanel />
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <AddLoanForm
        open={showAddLoan}
        onOpenChange={setShowAddLoan}
        onSuccess={() => {
          fetchLoans();
          toast.success("Loan added successfully");
        }}
      />
    </div>
  );
}
