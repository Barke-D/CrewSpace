import React, { useEffect, useState } from 'react';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc,
    writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Notification } from '../types';
import {
    Bell,
    Check,
    Trash2,
    X,
    ExternalLink,
    AlertCircle,
    UserPlus,
    RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

const NotificationPanel: React.FC = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;

        const q = query(
            collection(db, 'users', currentUser.uid, 'notifications'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snap) => {
            const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
            setNotifications(list);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const markAsRead = async (id: string) => {
        if (!currentUser) return;
        await updateDoc(doc(db, 'users', currentUser.uid, 'notifications', id), {
            read: true
        });
    };

    const deleteNotification = async (id: string) => {
        if (!currentUser) return;
        await deleteDoc(doc(db, 'users', currentUser.uid, 'notifications', id));
    };

    const markAllAsRead = async () => {
        if (!currentUser || unreadCount === 0) return;
        const batch = writeBatch(db);
        notifications.filter(n => !n.read).forEach((n: Notification) => {
            batch.update(doc(db, 'users', currentUser.uid, 'notifications', n.id), { read: true });
        });
        await batch.commit();
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'task_assigned': return <Bell className="w-4 h-4 text-blue-500" />;
            case 'subtask_assigned': return <UserPlus className="w-4 h-4 text-indigo-500" />;
            case 'project_update': return <RefreshCw className="w-4 h-4 text-emerald-500" />;
            case 'mention': return <AlertCircle className="w-4 h-4 text-amber-500" />;
            default: return <Bell className="w-4 h-4 text-slate-500" />;
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
            >
                <Bell className={cn(
                    "w-5 h-5 transition-transform group-hover:scale-110",
                    unreadCount > 0 ? "text-blue-600 dark:text-blue-400 fill-blue-600/10" : "text-slate-500 dark:text-slate-400"
                )} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 animate-in zoom-in duration-300">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40 lg:hidden"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden"
                        >
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Personal Alerts
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-700 p-1"
                                            title="Mark all as read"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                {loading ? (
                                    <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                        <span className="text-xs font-medium italic">Loading...</span>
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="p-12 text-center text-slate-400">
                                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Bell className="w-6 h-6 opacity-20" />
                                        </div>
                                        <p className="font-bold text-sm">No notifications yet</p>
                                        <p className="text-[10px] uppercase tracking-widest mt-1">Check back later</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {notifications.map((notification: Notification) => (
                                            <div
                                                key={notification.id}
                                                className={cn(
                                                    "p-4 flex gap-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 group relative",
                                                    !notification.read && "bg-blue-50/30 dark:bg-blue-900/10"
                                                )}
                                            >
                                                <div className="mt-1">
                                                    {getIcon(notification.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className={cn(
                                                            "text-sm font-bold truncate",
                                                            notification.read ? "text-slate-600 dark:text-slate-400" : "text-slate-900 dark:text-white"
                                                        )}>
                                                            {notification.title}
                                                        </p>
                                                        <span className="text-[10px] text-slate-400 whitespace-nowrap mt-0.5">
                                                            {notification.createdAt ? format(notification.createdAt.toDate(), 'HH:mm') : 'Just now'}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                                                        {notification.message}
                                                    </p>
                                                    <div className="mt-3 flex items-center gap-3">
                                                        {notification.link && (
                                                            <button
                                                                onClick={() => {
                                                                    navigate(notification.link!);
                                                                    markAsRead(notification.id);
                                                                    setIsOpen(false);
                                                                }}
                                                                className="flex items-center gap-1.5 text-[10px] font-black uppercase text-blue-600 hover:text-blue-700 tracking-tight"
                                                            >
                                                                View Details <ExternalLink className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                        {!notification.read && (
                                                            <button
                                                                onClick={() => markAsRead(notification.id)}
                                                                className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 tracking-tight"
                                                            >
                                                                Mark read
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteNotification(notification.id);
                                                    }}
                                                    className="absolute top-4 right-4 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationPanel;
