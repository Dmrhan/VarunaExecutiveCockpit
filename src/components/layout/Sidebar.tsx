
import { LayoutDashboard, Target, Phone, FileText, ShoppingCart, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

const NAV_ITEMS = [
    { icon: LayoutDashboard, key: 'executive', active: true },
    { icon: Target, key: 'opportunities', active: false },
    { icon: Phone, key: 'activities', active: false },
    { icon: FileText, key: 'quotes', active: false },
    { icon: ShoppingCart, key: 'orders', active: false },
    { icon: ShieldCheck, key: 'contracts', active: false },
];

interface SidebarProps {
    activeView: string;
    onViewChange: (view: string) => void;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
    const { t } = useTranslation();

    return (
        <div className="h-screen w-20 flex flex-col items-center bg-white dark:bg-slate-700 border-r border-slate-200 dark:border-slate-600 py-6 transition-all duration-300">
            <div className="mb-8 p-1 bg-white dark:bg-slate-800 rounded-xl shadow-md">
                <img
                    src="/logo.png"
                    alt="Varuna Logo"
                    className="w-10 h-10 object-contain"
                />
            </div>

            <nav className="flex-1 flex flex-col gap-4">
                {NAV_ITEMS.map((item) => {
                    const label = t(`navigation.${item.key}`);
                    return (
                        <button
                            key={item.key}
                            onClick={() => onViewChange(item.key)}
                            className={cn(
                                "p-3 rounded-xl transition-all duration-200 group relative",
                                activeView === item.key
                                    ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                            )}
                            title={label}
                        >
                            <item.icon size={24} strokeWidth={activeView === item.key ? 2.5 : 2} />
                            {activeView === item.key && (
                                <div className="absolute right-[-1px] top-1/2 -translate-y-1/2 w-[3px] h-6 bg-indigo-500 rounded-l-full" />
                            )}
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}
