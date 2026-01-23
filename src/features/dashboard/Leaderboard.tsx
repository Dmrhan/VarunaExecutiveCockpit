import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { useData } from '../../context/DataContext';
import { Badge } from '../../components/ui/Badge';
import { UserCheck, Award } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { DealList } from './DealList';


export function Leaderboard() {
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const { metrics, users, deals } = useData();

    const selectedUserDeals = selectedUserId
        ? deals.filter(d => d.ownerId === selectedUserId)
        : [];

    const selectedUser = selectedUserId
        ? users.find(u => u.id === selectedUserId)
        : null;

    return (
        <>
            <Card className="col-span-1 md:col-span-2 lg:col-span-2 h-full">
                <CardHeader className="pb-4 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm text-slate-500 font-medium uppercase tracking-wide">Top Performers</CardTitle>
                    <Award className="text-amber-400" size={20} />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {metrics.topPerformers.slice(0, 5).map((performer, idx) => {
                            const user = users.find(u => u.id === performer.userId);
                            if (!user) return null;

                            return (
                                <div
                                    key={performer.userId}
                                    className="flex items-center justify-between group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 rounded-lg transition-colors -mx-2"
                                    onClick={() => setSelectedUserId(performer.userId)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full bg-slate-100 object-cover" />
                                            <div className="absolute -top-1 -left-1 w-5 h-5 bg-slate-900 dark:bg-slate-100 text-slate-100 dark:text-slate-900 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white dark:border-slate-900">
                                                {idx + 1}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{user.name}</p>
                                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                                <UserCheck size={12} /> Ex. Score: {performer.score}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant={idx === 0 ? 'success' : 'secondary'} className="px-3">
                                        Score: {performer.score}
                                    </Badge>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            <Modal
                isOpen={!!selectedUserId}
                onClose={() => setSelectedUserId(null)}
                title={selectedUser ? `${selectedUser.name}'s Active Deals` : 'User Deals'}
                className="max-w-4xl"
            >
                <DealList deals={selectedUserDeals} />
            </Modal>
        </>
    );
}
