import React from 'react';
import { Activity, User } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle, AlertTriangle, Plus, UserPlus, FileText } from 'lucide-react';

interface ActivityFeedProps {
    activities: Activity[];
    members: User[];
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, members }) => {

    const getIcon = (type: string) => {
        switch (type) {
            case 'task_completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'task_late': return <AlertTriangle className="w-4 h-4 text-red-500" />;
            case 'task_created': return <Plus className="w-4 h-4 text-blue-500" />;
            case 'member_joined': return <UserPlus className="w-4 h-4 text-purple-500" />;
            default: return <FileText className="w-4 h-4 text-slate-500" />;
        }
    };

    const getMemberName = (uid?: string) => {
        if (!uid) return 'System';
        return members.find(m => m.uid === uid)?.displayName || 'Unknown User';
    };

    return (
        <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Latest Activity</h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {activities.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No activity yet.</p>
                ) : (
                    activities.map(activity => (
                        <div key={activity.id} className="flex gap-3 items-start p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <div className="mt-0.5 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-full">
                                {getIcon(activity.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-slate-700 dark:text-slate-300">
                                    <span className="font-semibold text-slate-900 dark:text-white">{getMemberName(activity.userId)}</span> {activity.message}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-1">
                                    {activity.createdAt && !isNaN(activity.createdAt.toMillis())
                                        ? formatDistanceToNow(activity.createdAt.toDate(), { addSuffix: true })
                                        : 'Just now'}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ActivityFeed;
