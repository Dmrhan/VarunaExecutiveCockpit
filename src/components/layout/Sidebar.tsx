import { useState } from 'react';
import {
    PieChart,
    LayoutDashboard,
    Gauge,
    Briefcase,
    CalendarCheck,
    FileText,
    ShoppingCart,
    FileSignature,
    BadgeCheck
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_ITEMS = [
    { icon: PieChart, key: 'executive' },
    { icon: LayoutDashboard, key: 'executivev2' },
    { icon: Gauge, key: 'performance' },
    { icon: Briefcase, key: 'opportunities' },
    // { icon: ShieldCheck, key: 'management' }, // Hidden for now
    { icon: CalendarCheck, key: 'activities' },
    { icon: FileText, key: 'quotes' },
    { icon: ShoppingCart, key: 'orders' },
    { icon: FileSignature, key: 'contracts' },
    { icon: BadgeCheck, key: 'scorecard' },
];

interface SidebarProps {
    activeView: string;
    onViewChange: (view: string) => void;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(false);
    const [hoverIntentTimer, setHoverIntentTimer] = useState<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
        const timer = setTimeout(() => setIsExpanded(true), 150);
        setHoverIntentTimer(timer);
    };

    const handleMouseLeave = () => {
        if (hoverIntentTimer) clearTimeout(hoverIntentTimer);
        setIsExpanded(false);
    };

    return (
        <motion.div
            className={cn(
                "h-screen flex flex-col bg-white dark:bg-slate-700 border-r border-slate-200 dark:border-slate-600 py-6 z-50",
                "shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.1)]"
            )}
            initial={false}
            animate={{ width: isExpanded ? 240 : 80 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="px-4 mb-8 flex items-center overflow-hidden">
                <div className="flex-shrink-0 p-1 bg-white dark:bg-slate-800 rounded-xl shadow-md">
                    <img
                        src="/logo.png"
                        alt="Varuna Logo"
                        className="w-10 h-10 object-contain"
                    />
                </div>
                <AnimatePresence>
                    {isExpanded && (
                        <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="ml-3 font-normal text-lg text-slate-800 dark:text-white whitespace-nowrap"
                        >
                            Varuna CRM
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>

            <nav className="flex-1 flex flex-col gap-2 px-3 overflow-y-auto no-scrollbar">
                {NAV_ITEMS.map((item) => {
                    const label = t(`navigation.${item.key}`);
                    const isActive = activeView === item.key;

                    return (
                        <button
                            key={item.key}
                            onClick={() => onViewChange(item.key)}
                            className={cn(
                                "flex items-center w-full p-3 rounded-xl transition-all duration-200 group relative",
                                isActive
                                    ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                            )}
                            title={!isExpanded ? label : undefined}
                        >
                            <div className="flex-shrink-0">
                                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            </div>

                            <AnimatePresence mode="wait">
                                {isExpanded && (
                                    <motion.span
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -5 }}
                                        className="ml-3 text-sm font-normal whitespace-nowrap overflow-hidden"
                                    >
                                        {label}
                                    </motion.span>
                                )}
                            </AnimatePresence>

                            {isActive && (
                                <motion.div
                                    layoutId="active-indicator"
                                    className="absolute left-0 w-[4px] h-6 bg-indigo-500 rounded-r-full"
                                />
                            )}
                        </button>
                    );
                })}
            </nav>
        </motion.div>
    );
}
