
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
import { useData } from '../../context/DataContext';

export function Header() {
    const { users } = useData();
    const currentUser = users.find(u => u.role === 'executive') || users[0];

    return (
        <header className="h-16 border-b border-transparent bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm sticky top-0 z-10 px-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <img src="/logo.png" alt="Varuna Logo" className="w-10 h-10 object-contain drop-shadow-sm transition-transform hover:scale-110" />
                <div>
                    <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        Varuna CRM Executive Cockpit
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Sales Performance & Execution Insights
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <ThemeToggle />
                <LanguageSwitcher />
                <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800" />
                <div className="flex items-center gap-3">
                    <div className="text-right hidden md:block">
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{currentUser.name}</div>
                        <div className="text-xs text-slate-500">Sales Leader</div>
                    </div>
                    <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-9 h-9 rounded-full ring-2 ring-white dark:ring-slate-800"
                    />
                </div>
            </div>
        </header>
    );
}
