import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { User, Project, Task } from '../types';
import { AccountabilityEngine } from '../lib/AccountabilityEngine';
import { motion } from 'framer-motion';
import { BarChart2, Info } from 'lucide-react';
import { cn } from '../lib/utils';

interface AnalyticsProps {
    project: Project;
    tasks: Task[];
    members: User[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const ProjectAnalytics: React.FC<AnalyticsProps> = ({ project, tasks, members }) => {

    const stats = AccountabilityEngine.generateProjectStats(project, tasks, members);

    const hasCompletedTasks = tasks.some(t => t.status === 'done');
    const totalScore = stats.reduce((sum, s) => sum + s.contributionScore, 0);

    const contributionData = stats
        .filter(s => s.contributionScore >= 0)
        .map((stat, index) => {
            const member = members.find(m => m.uid === stat.uid);
            return {
                name: member?.displayName || member?.username || 'Unknown',
                // If total score is 0, give everyone equal weight for the visual placeholder
                value: totalScore > 0 ? stat.relativeContribution : (100 / (members.length || 1)),
                score: stat.contributionScore,
                color: COLORS[index % COLORS.length]
            };
        });

    const taskCompletionData = stats.map((stat) => {
        const member = members.find(m => m.uid === stat.uid);
        return {
            name: (member?.displayName || member?.username || 'User').split(' ')[0],
            OnTime: Math.max(0, stat.tasksCompleted - stat.tasksLate),
            Late: stat.tasksLate,
            Assigned: stat.tasksAssigned
        };
    });

    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] glass-card rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 opacity-60">
                <BarChart2 className="w-12 h-12 text-slate-400 mb-4" />
                <h3 className="text-xl font-black text-slate-500 uppercase tracking-widest">No Data Available</h3>
                <p className="text-sm text-slate-400 font-bold uppercase tracking-tighter">Create and complete tasks to see analytics</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Contribution Breakdown */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex flex-col min-h-[450px]"
                >
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                            <span className="w-2 h-6 bg-blue-600 rounded-full" />
                            Contribution Heatmap
                        </h3>
                        {!hasCompletedTasks && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg border border-amber-100 dark:border-amber-900/30">
                                <Info className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-bold uppercase">Placeholder</span>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 w-full relative min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                            <PieChart>
                                <Pie
                                    data={contributionData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                    isAnimationActive={true}
                                >
                                    {contributionData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={hasCompletedTasks ? entry.color : '#e2e8f0'}
                                            opacity={hasCompletedTasks ? 1 : 0.4}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '20px', border: 'none', background: 'rgba(15, 23, 42, 0.95)', color: '#fff', fontSize: '10px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}
                                    formatter={(value: any, name: any) => [hasCompletedTasks ? `${value}%` : '0%', name]}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    iconType="circle"
                                    wrapperStyle={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '30px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Task Performance */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex flex-col min-h-[450px]"
                >
                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-8 flex items-center gap-3">
                        <span className="w-2 h-6 bg-emerald-500 rounded-full" />
                        Team Efficiency
                    </h3>
                    <div className="flex-1 w-full relative min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                            <BarChart data={taskCompletionData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                                <XAxis
                                    dataKey="name"
                                    stroke="#94a3b8"
                                    fontSize={9}
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: '#64748b', fontWeight: '800' }}
                                />
                                <YAxis
                                    stroke="#94a3b8"
                                    fontSize={9}
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: '#64748b' }}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                                    contentStyle={{ borderRadius: '20px', border: 'none', background: 'rgba(15, 23, 42, 0.95)', color: '#fff' }}
                                    formatter={(value: any, name: any) => [value, name === 'OnTime' ? 'On Time' : name]}
                                />
                                <Legend
                                    wrapperStyle={{ paddingTop: '30px', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase' }}
                                    iconType="rect"
                                    formatter={(value) => value === 'OnTime' ? 'On Time' : value}
                                />
                                <Bar dataKey="OnTime" stackId="a" fill="#10b981" radius={[0, 0, 10, 10]} barSize={40} />
                                <Bar dataKey="Late" stackId="a" fill="#ef4444" radius={[10, 10, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

            {/* Individual Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats.map((stat) => {
                    const member = members.find(m => m.uid === stat.uid);
                    return (
                        <motion.div
                            key={stat.uid}
                            whileHover={{ y: -4 }}
                            className={cn(
                                "p-6 rounded-[2rem] border transition-all duration-300 shadow-sm",
                                stat.isAtRisk
                                    ? "bg-red-50/20 border-red-200 dark:bg-red-900/10 dark:border-red-900/40"
                                    : "glass-card border-slate-200/60 dark:border-slate-800"
                            )}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-blue-600 shadow-inner">
                                        {(member?.displayName || member?.username || 'U')[0]}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white leading-none mb-1">{member?.displayName || member?.username}</h4>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                            Score: {isNaN(stat.contributionScore) ? 0 : stat.contributionScore}
                                        </p>
                                    </div>
                                </div>
                                {stat.isAtRisk && (
                                    <span className="bg-red-500 text-white text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-wider animate-pulse">
                                        At Risk
                                    </span>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Completion Velocity</span>
                                        <span className="text-[8px] font-bold text-slate-400 italic">Of assigned work</span>
                                    </div>
                                    <span className={cn(
                                        "text-2xl font-black tabular-nums tracking-tighter",
                                        stat.tasksAssigned > 0 && (stat.tasksCompleted / stat.tasksAssigned) < 0.5 ? "text-red-500" : "text-slate-900 dark:text-white"
                                    )}>
                                        {stat.tasksAssigned > 0 ? Math.round((stat.tasksCompleted / stat.tasksAssigned) * 100) : 0}%
                                    </span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-950 h-3 rounded-full overflow-hidden shadow-inner">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${stat.tasksAssigned > 0 ? (stat.tasksCompleted / stat.tasksAssigned) * 100 : 0}%` }}
                                        transition={{ duration: 1.5, ease: 'circOut' }}
                                        className={cn(
                                            "h-full rounded-full transition-all duration-1000",
                                            stat.isAtRisk ? 'bg-red-500' : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                                        )}
                                    />
                                </div>
                                <div className="flex justify-between items-center text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-xl">
                                    <span>{stat.tasksCompleted} Done</span>
                                    <span className="text-slate-300">|</span>
                                    <span>{stat.tasksLate} Late</span>
                                    <span className="text-slate-300">|</span>
                                    <span>{stat.tasksAssigned} Assigned</span>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default ProjectAnalytics;
