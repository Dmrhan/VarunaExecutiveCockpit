
import { LayoutDashboard, Target, Users, Settings, Activity } from 'lucide-react';
import { cn } from '../../lib/utils';

const NAV_ITEMS = [
    { icon: LayoutDashboard, label: 'Cockpit', active: true },
    { icon: Target, label: 'Pipeline', active: false },
    { icon: Activity, label: 'Execution', active: false },
    { icon: Users, label: 'Team', active: false },
    { icon: Settings, label: 'Settings', active: false },
];

interface SidebarProps {
    activeView: string;
    onViewChange: (view: string) => void;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
    return (
        <div className="h-screen w-20 flex flex-col items-center bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 py-6 transition-all duration-300">
            <div className="mb-8">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20">
                    C
                </div>
            </div>

            <nav className="flex-1 flex flex-col gap-4">
                {NAV_ITEMS.map((item) => (
                    <button
                        key={item.label}
                        onClick={() => onViewChange(item.label)}
                        className={cn(
                            "p-3 rounded-xl transition-all duration-200 group relative",
                            activeView === item.label
                                ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                        )}
                        title={item.label}
                    >
                        <item.icon size={24} strokeWidth={activeView === item.label ? 2.5 : 2} />
                        {activeView === item.label && (
                            <div className="absolute right-[-1px] top-1/2 -translate-y-1/2 w-[3px] h-6 bg-indigo-500 rounded-l-full" />
                        )}
                    </button>
                ))}
            </nav>
        </div>
    );
}
