"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";
import { UserButton } from "@clerk/nextjs";
import {
    LayoutDashboard,
    Settings,
    Bot,
    Menu,
    X,
    FileText,
    LightBulb,
    User,
    CreditCard,
    BadgeDollarSign,
    ScrollText,
    MessagesSquare,
    Globe,
    Calculator,
    Newspaper,
    Shield,
    ShieldAlert,
    Scan,
} from "lucide-react";
import Link from "next/link";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";
import Image from "next/image";
import loanSaathiLogo from "@/assets/loansaathi.png";
import { useLanguage, SUPPORTED_LANGUAGES } from "@/lib/languageContext";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import FloatingAssistant from "@/components/FloatingAssistant";

export default function DashboardLayout({ children }) {
    const { user, isLoaded } = useUser();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
    const { language, setLanguage } = useLanguage();

    const sidebarLinks = [
        {
            title: {
                'en-IN': 'Overview',
                'hi-IN': 'अवलोकन',
                // Add other languages...
            },
            href: "/dashboard",
            icon: LayoutDashboard,
            color: "text-blue-500",
        },
        {
            title: {
                'en-IN': 'Loan Assistant',
                'hi-IN': 'ऋण सहायक',
                // Add other languages...
            },
            href: "/dashboard/loanBuddy",
            icon: MessagesSquare,
            color: "text-green-500",
        },
        {
            title: {
                'en-IN': 'Scan Documents',
                'hi-IN': 'दस्तावेज़ स्कैन करें',
                // Add other languages...
            },
            href: "/dashboard/docScan",
            icon: Scan,
            color: "text-yellow-500",
        },
        {
            title: {
                'en-IN': 'Loan Threats',
                'hi-IN': 'दस्तावेज़ स्कैन करें',
                // Add other languages...
            },
            href: "/dashboard/loanguard",
            icon: ShieldAlert,
            color: "text-purple-500",
        },
        {
            title: {
                'en-IN': 'EMI Analysis',
                'hi-IN': 'ईएमआई विश्लेषण',
                // Add other languages...
            },
            href: "/dashboard/emiAnalysis",
            icon: Calculator,
            color: "text-orange-500",
        },
        {
            title: {
                'en-IN': 'Latest News',
                'hi-IN': 'ताज़ा खबर',
                // Add other languages...
            },
            href: "/dashboard/news",
            icon: Newspaper,
            color: "text-rose-500",
        },
        {
            title: {
                'en-IN': 'Settings',
                'hi-IN': 'समायोजन',
                // Add other languages...
            },
            href: "/dashboard/settings",
            icon: Settings,
            color: "text-gray-500",
        },
    ];

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    useEffect(() => {
        if (!isLoaded || !user) return;

        const checkOnboardingStatus = async () => {
            try {
                const { data: profile, error } = await supabase
                    .from("user_profiles")
                    .select("clerk_id")
                    .eq("clerk_id", user.id)
                    .single();

                if (!profile || error) {
                    router.push("/onboarding");
                }
            } catch (error) {
                console.error("Error checking onboarding status:", error);
            } finally {
                setIsCheckingOnboarding(false);
            }
        };

        checkOnboardingStatus();
    }, [user, isLoaded, router]);

    useEffect(() => {
        // Sync language on mount and changes
        const savedLanguage = localStorage.getItem('preferred-language');
        if (savedLanguage && savedLanguage !== language) {
            setLanguage(savedLanguage);
        }
    }, []);

    const handleLanguageChange = (value) => {
        setLanguage(value);
        localStorage.setItem('preferred-language', value);
    };

    const languageSelector = (
        <Select
            value={language}
            onValueChange={handleLanguageChange}
        >
            <SelectTrigger className="w-[180px]">
                <Globe className="mr-2 h-4 w-4" />
                <SelectValue placeholder={SUPPORTED_LANGUAGES[language]} />
            </SelectTrigger>
            <SelectContent>
                {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                    <SelectItem key={code} value={code}>
                        {name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );

    if (!isLoaded || isCheckingOnboarding) {
        return <div>Loading...</div>;
    }

    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <div className="min-h-screen flex bg-gradient-to-b from-emerald-50/50 to-teal-50/50 dark:from-gray-900 dark:to-gray-800">
                {/* Desktop Sidebar - Updated logo color */}
                <aside className="hidden md:flex md:flex-col md:w-64 bg-white/80 backdrop-blur-sm border-r border-emerald-200/50 dark:border-emerald-800/50 md:h-screen md:fixed">
                    <div className="p-6">
                        <a href="/">
                            <div className="flex items-center gap-2">
                                <Image
                                    alt="logo"
                                    src={loanSaathiLogo}
                                    className="h-8 w-8"
                                />
                                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                    Loanसाथी
                                </h1>
                            </div>
                        </a>
                    </div>

                    <nav className="flex-1 px-4 pb-4">
                        <div className="space-y-4">
                            {sidebarLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="flex items-center gap-3 px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors group"
                                >
                                    <link.icon
                                        className={`h-5 w-5 ${link.color} group-hover:scale-110 transition-transform`}
                                    />
                                    <span className="text-sm font-medium">
                                        {link.title[language] || link.title['en-IN']}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </nav>

                    <div className="p-4 border-t border-gray-200">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-4">
                                {languageSelector}
                                <ModeToggle />
                            </div>
                            <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-card">
                                <UserButton
                                    appearance={{
                                        elements: {
                                            avatarBox: "h-8 w-8",
                                        },
                                    }}
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">
                                        Your Account
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-h-screen">
                    {/* Mobile Header */}
                    <header className="md:hidden bg-white border-b border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={toggleMobileMenu}
                                    className="p-2 rounded-lg hover:bg-gray-100"
                                >
                                    {isMobileMenuOpen ? (
                                        <X className="h-6 w-6 text-gray-600" />
                                    ) : (
                                        <Menu className="h-6 w-6 text-gray-600" />
                                    )}
                                </button>
                                <a href="/">
                                    <div className="flex items-center gap-2">
                                        <Image
                                            alt="logo"
                                            src={loanSaathiLogo}
                                            className="h-8 w-8"
                                        />
                                        <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                            Loanसाथी
                                        </h1>
                                    </div>
                                </a>
                            </div>
                            <UserButton />
                        </div>
                    </header>

                    {/* Mobile Navigation Menu */}
                    {isMobileMenuOpen && (
                        <div className="md:hidden fixed inset-0 z-50 bg-gray-800 bg-opacity-50">
                            <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
                                <div className="flex flex-col h-full">
                                    <div className="p-4 border-b border-gray-200">
                                        <button
                                            onClick={toggleMobileMenu}
                                            className="p-2 rounded-lg hover:bg-gray-100"
                                        >
                                            <X className="h-6 w-6 text-gray-600" />
                                        </button>
                                    </div>
                                    <nav className="flex-1 px-4 py-4">
                                        <div className="space-y-4">
                                            {sidebarLinks.map((link) => (
                                                <Link
                                                    key={link.href}
                                                    href={link.href}
                                                    onClick={toggleMobileMenu}
                                                    className="flex items-center gap-3 px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors group"
                                                >
                                                    <link.icon
                                                        className={`h-5 w-5 ${link.color} group-hover:scale-110 transition-transform`}
                                                    />
                                                    <span className="text-sm font-medium">
                                                        {link.title[language] || link.title['en-IN']}
                                                    </span>
                                                </Link>
                                            ))}
                                        </div>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Main Content Area */}
                    <main className="flex-1 overflow-auto md:ml-[16rem]">
                        {children}
                    </main>
                </div>
                <FloatingAssistant />
            </div>
        </ThemeProvider>
    );
}
