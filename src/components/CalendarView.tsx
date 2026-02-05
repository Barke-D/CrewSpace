import React, { useState, useMemo } from 'react';
import { Task, User } from '../types';
import {
    format,
    startOfWeek,
    addDays,
    isSameDay,
    isPast,
    isToday,
    startOfMonth,
    addMonths,
    subMonths,
    subWeeks,
    addWeeks,
    startOfYear,
    endOfYear,
    eachMonthOfInterval,
    isSameMonth,
    addYears,
    subYears
} from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Box, Layout } from 'lucide-react';
import { cn } from '../lib/utils';

interface CalendarViewProps {
    tasks: Task[];
    members: User[];
    projectName?: string;
}

type ViewType = 'week' | 'month' | 'year';

const CalendarView: React.FC<CalendarViewProps> = ({ tasks, members, projectName }) => {
    const [viewType, setViewType] = useState<ViewType>('week');
    const [currentDate, setCurrentDate] = useState(new Date());

    const navigate = (direction: 'prev' | 'next') => {
        if (viewType === 'week') {
            setCurrentDate(direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
        } else if (viewType === 'month') {
            setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
        } else {
            setCurrentDate(direction === 'prev' ? subYears(currentDate, 1) : addYears(currentDate, 1));
        }
    };

    const weekDays = useMemo(() => {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 });
        return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
    }, [currentDate]);

    const monthDays = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
        return Array.from({ length: 42 }).map((_, i) => addDays(start, i));
    }, [currentDate]);

    const yearMonths = useMemo(() => {
        const start = startOfYear(currentDate);
        const end = endOfYear(currentDate);
        return eachMonthOfInterval({ start, end });
    }, [currentDate]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-none">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                        <CalendarIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                            {viewType === 'year' ? format(currentDate, 'yyyy') : format(currentDate, 'MMMM yyyy')}
                        </h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Project Timeline</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl flex items-center shadow-inner">
                        {['week', 'month', 'year'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setViewType(type as ViewType)}
                                className={cn(
                                    "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                                    viewType === type ? "bg-white dark:bg-slate-700 text-blue-600 shadow-md" : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                {type}
                            </button>
                        ))}
                    </div>

                    <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 hidden sm:block mx-2" />

                    <div className="flex items-center gap-2">
                        <button onClick={() => navigate('prev')} className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl border border-slate-200 dark:border-slate-700 transition active:scale-90">
                            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                        </button>
                        <button onClick={() => setCurrentDate(new Date())} className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-widest rounded-2xl border border-blue-100 dark:border-blue-900/50 hover:bg-blue-100 transition">
                            Today
                        </button>
                        <button onClick={() => navigate('next')} className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl border border-slate-200 dark:border-slate-700 transition active:scale-90">
                            <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                        </button>
                    </div>
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={viewType + currentDate.toISOString()}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.4, ease: 'backOut' }}
                    className="min-h-[600px]"
                >
                    {viewType === 'week' && <WeekMode days={weekDays} tasks={tasks} members={members} />}
                    {viewType === 'month' && <MonthMode days={monthDays} tasks={tasks} currentMonth={currentDate} projectName={projectName} />}
                    {viewType === 'year' && <YearMode months={yearMonths} tasks={tasks} members={members} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

const WeekMode: React.FC<{ days: Date[], tasks: Task[], members: User[] }> = ({ days, tasks, members }) => (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {days.map((day, i) => {
            const dayTasks = tasks.filter(t => t.deadline && isSameDay(t.deadline.toDate(), day));
            return <DayCard key={i} day={day} tasks={dayTasks} members={members} fullHeight />;
        })}
    </div>
);

const MonthMode: React.FC<{ days: Date[], tasks: Task[], currentMonth: Date, projectName?: string }> = ({ days, tasks, currentMonth, projectName }) => (
    <div className="grid grid-cols-7 gap-3 bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
            <div key={d} className="text-center py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{d}</div>
        ))}
        {days.map((day, i) => {
            const isOtherMonth = !isSameMonth(day, currentMonth);
            const dayTasks = tasks.filter(t => t.deadline && isSameDay(t.deadline.toDate(), day));
            const isTodayDay = isToday(day);

            return (
                <div
                    key={i}
                    className={cn(
                        "min-h-[140px] rounded-3xl p-4 border transition-all relative overflow-hidden group",
                        isTodayDay ? "bg-blue-600 border-blue-500 shadow-xl shadow-blue-500/20 z-10 scale-[1.02]" : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700",
                        isOtherMonth && "opacity-20 pointer-events-none grayscale"
                    )}
                >
                    <div className="flex justify-between items-start mb-3">
                        <span className={cn("text-lg font-black tabular-nums", isTodayDay ? "text-white" : "text-slate-900 dark:text-white")}>
                            {format(day, 'd')}
                        </span>
                        {dayTasks.length > 0 && !isTodayDay && (
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        )}
                    </div>

                    <div className="space-y-1.5 overflow-hidden">
                        {dayTasks.map(t => (
                            <div key={t.id} className={cn(
                                "px-2 py-1 rounded-lg text-[9px] font-bold truncate transition-colors",
                                isTodayDay ? "bg-white/20 text-white" : "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                            )}>
                                {t.title}
                            </div>
                        ))}
                    </div>

                    {projectName && !isOtherMonth && (
                        <div className="absolute bottom-3 left-3 right-3 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                            <div className={cn(
                                "flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity",
                                isTodayDay ? "text-white" : "text-slate-400"
                            )}>
                                <Box className="w-2 h-2" />
                                <span className="text-[7px] font-black uppercase tracking-tighter truncate">{projectName}</span>
                            </div>
                        </div>
                    )}
                </div>
            );
        })}
    </div>
);

const YearMode: React.FC<{ months: Date[], tasks: Task[], members: User[] }> = ({ months, tasks, members }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {months.map((month, i) => (
            <div key={i} className="glass-card p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800 hover:border-blue-400 transition-all flex flex-col">
                <h4 className="text-sm font-black text-slate-900 dark:text-white mb-4 uppercase tracking-widest text-center">
                    {format(month, 'MMMM')}
                </h4>

                <div className="grid grid-cols-7 gap-0.5 mb-2">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, idx) => (
                        <div key={idx} className="text-[7px] font-black text-slate-300 text-center uppercase">{d}</div>
                    ))}
                    {(() => {
                        const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
                        const days = Array.from({ length: 35 }).map((_, idx) => addDays(start, idx));
                        return days.map((day, idx) => {
                            const isCurrentMonth = isSameMonth(day, month);
                            const hasTask = tasks.some(t => t.deadline && isSameDay(t.deadline.toDate(), day));
                            const isTodayDay = isToday(day);

                            return (
                                <div
                                    key={idx}
                                    className={cn(
                                        "aspect-square flex items-center justify-center text-[8px] rounded-sm transition-colors",
                                        !isCurrentMonth ? "opacity-0" :
                                            isTodayDay ? "bg-blue-600 text-white font-black" :
                                                hasTask ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 font-bold" : "text-slate-400"
                                    )}
                                >
                                    {isCurrentMonth ? format(day, 'd') : ''}
                                </div>
                            );
                        });
                    })()}
                </div>

                <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                        <span>Tasks: {tasks.filter(t => t.deadline && isSameMonth(t.deadline.toDate(), month)).length}</span>
                        <div className="flex -space-x-1">
                            {Array.from(new Set(tasks.filter(t => t.deadline && isSameMonth(t.deadline.toDate(), month)).flatMap(t => t.assignedTo || []))).slice(0, 3).map(uid => {
                                const m = members.find(user => user.uid === uid);
                                return (
                                    <div key={uid} className="w-3 h-3 rounded-full bg-slate-200 ring-1 ring-white dark:ring-slate-900 overflow-hidden">
                                        {m?.photoURL ? <img src={m.photoURL} className="w-full h-full object-cover" alt="" /> : null}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        ))}
    </div>
);

const DayCard: React.FC<{ day: Date, tasks: Task[], members: User[], fullHeight?: boolean }> = ({ day, tasks, members, fullHeight }) => {
    const isCurrentDay = isToday(day);

    return (
        <div className={cn(
            "flex flex-col rounded-3xl p-6 border transition-all duration-300",
            fullHeight ? "min-h-[350px]" : "min-h-[160px]",
            isCurrentDay
                ? "bg-blue-50/40 border-blue-200 dark:bg-blue-900/10 dark:border-blue-900/40 shadow-xl shadow-blue-500/5 ring-1 ring-blue-500/20"
                : "glass-card border-slate-200/60 dark:border-slate-800 hover:shadow-lg"
        )}>
            <div className="flex justify-between items-start mb-6">
                <div>
                    <p className={cn(
                        "text-[10px] uppercase font-black tracking-[0.2em] mb-1",
                        isCurrentDay ? "text-blue-600 dark:text-blue-400" : "text-slate-400"
                    )}>
                        {format(day, 'EEEE')}
                    </p>
                    <p className={cn(
                        "text-4xl font-black tabular-nums tracking-tighter",
                        isCurrentDay ? "text-blue-700 dark:text-blue-300" : "text-slate-900 dark:text-white"
                    )}>
                        {format(day, 'd')}
                    </p>
                </div>
                {isCurrentDay && (
                    <div className="w-3.5 h-3.5 rounded-full bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.7)] animate-pulse" />
                )}
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto max-h-[400px] pr-1 custom-scrollbar">
                {tasks.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-10">
                        <Layout className="w-8 h-8 mb-2" />
                        <span className="text-[8px] font-black uppercase tracking-widest">Clear</span>
                    </div>
                ) : (
                    tasks.map(task => {
                        const isDone = task.status === 'done';
                        const isOverdue = !isDone && isPast(day) && !isToday(day);

                        return (
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                key={task.id}
                                className={cn(
                                    "p-4 rounded-2xl text-[10px] font-bold border transition-all shadow-sm cursor-pointer",
                                    isDone
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30"
                                        : isOverdue
                                            ? "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30"
                                            : "bg-white dark:bg-slate-800 text-slate-700 border-slate-200 dark:border-slate-700/50 hover:border-blue-400"
                                )}
                            >
                                <p className="leading-tight mb-3 tracking-tight font-black">{task.title}</p>
                                <div className="flex justify-between items-center">
                                    <div className="flex -space-x-2">
                                        {task.assignedTo?.map(uid => {
                                            const m = members.find(u => u.uid === uid);
                                            return (
                                                <div key={uid} className="w-6 h-6 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-200 overflow-hidden shadow-md">
                                                    {m?.photoURL ? <img src={m.photoURL} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[8px] font-black">{m?.username?.[0] || 'U'}</div>}
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <span className="text-[8px] opacity-40 uppercase font-black bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-md">{task.weight}</span>
                                </div>
                            </motion.div>
                        )
                    })
                )}
            </div>
        </div>
    );
};

export default CalendarView;
