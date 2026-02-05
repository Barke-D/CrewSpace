import React, { useState, useEffect } from 'react';
import { Task, SubTask, TaskWeight, User } from '../types';
import { Timestamp } from 'firebase/firestore';
import { X, Plus, Trash2, Calendar, User as UserIcon, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface EditTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: Task;
    members: User[];
    onUpdate: (updatedTask: Task) => Promise<void>;
    isPersonal?: boolean;
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({ isOpen, onClose, task, members, onUpdate, isPersonal }) => {
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description);
    const [weight, setWeight] = useState<TaskWeight>(task.weight);
    const [deadline, setDeadline] = useState(format(task.deadline.toDate(), 'yyyy-MM-dd'));
    const [subTasks, setSubTasks] = useState<SubTask[]>(task.subTasks || []);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTitle(task.title);
            setDescription(task.description);
            setWeight(task.weight);
            setDeadline(format(task.deadline.toDate(), 'yyyy-MM-dd'));
            setSubTasks(task.subTasks || []);
        }
    }, [isOpen, task]);

    const handleAddSubTask = () => {
        const newSubTask: SubTask = {
            id: `st-${Date.now()}`,
            title: '',
            status: 'todo',
            deadline: Timestamp.now()
        };
        setSubTasks([...subTasks, newSubTask]);
    };

    const handleRemoveSubTask = (id: string) => {
        setSubTasks(subTasks.filter(st => st.id !== id));
    };

    const handleUpdateSubTask = (id: string, updates: Partial<SubTask>) => {
        setSubTasks(subTasks.map(st => st.id === id ? { ...st, ...updates } : st));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const updatedTask: Task = {
                ...task,
                title,
                description,
                weight,
                deadline: Timestamp.fromDate(new Date(deadline)),
                subTasks,
                updatedAt: Timestamp.now()
            };
            await onUpdate(updatedTask);
            onClose();
        } catch (error) {
            console.error("Failed to update task:", error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
                {/* Header */}
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Edit Task</h2>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Refine your execution strategy</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:rotate-90"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    {/* Basic Info */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Task Identification</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-lg font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 outline-none transition-all placeholder:text-slate-400"
                                placeholder="Task Title"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Context & Details</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-medium text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-blue-600 outline-none transition-all placeholder:text-slate-400 min-h-[100px] resize-none"
                                placeholder="Describe the mission objective..."
                            />
                        </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deadline Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                <input
                                    type="date"
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {!isPersonal && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Effort Weight</label>
                                <div className="flex bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-1.5 gap-1">
                                    {(['small', 'medium', 'large'] as TaskWeight[]).map((w) => (
                                        <button
                                            key={w}
                                            type="button"
                                            onClick={() => setWeight(w)}
                                            className={cn(
                                                "flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all",
                                                weight === w
                                                    ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700"
                                                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50"
                                            )}
                                        >
                                            {w}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sub-tasks Section */}
                    <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between px-1">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Sub-tasks Breakdown</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight mt-0.5">Atomic components of this task</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddSubTask}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all group shadow-sm text-[10px] font-black uppercase tracking-widest"
                            >
                                <Plus className="w-3.5 h-3.5 transition-transform group-hover:rotate-90" /> Add Component
                            </button>
                        </div>

                        <div className="space-y-3">
                            <AnimatePresence mode="popLayout">
                                {subTasks.map((st) => (
                                    <motion.div
                                        key={st.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="flex flex-col sm:flex-row gap-4 p-5 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/50 rounded-2xl group/item"
                                    >
                                        <div className="flex-1 space-y-3">
                                            <input
                                                value={st.title}
                                                onChange={(e) => handleUpdateSubTask(st.id, { title: e.target.value })}
                                                className="w-full bg-transparent text-sm font-bold text-slate-900 dark:text-white outline-none placeholder:text-slate-400"
                                                placeholder="Sub-task Title"
                                                required
                                            />
                                            <div className="flex flex-wrap items-center gap-4">
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm relative">
                                                    <Calendar className="w-3 h-3 text-slate-400" />
                                                    <input
                                                        type="date"
                                                        value={format(st.deadline.toDate(), 'yyyy-MM-dd')}
                                                        onChange={(e) => handleUpdateSubTask(st.id, { deadline: Timestamp.fromDate(new Date(e.target.value)) })}
                                                        className="bg-transparent text-[10px] font-bold text-slate-600 dark:text-slate-400 outline-none"
                                                    />
                                                </div>

                                                {!isPersonal && (
                                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                                                        <UserIcon className="w-3 h-3 text-slate-400" />
                                                        <select
                                                            value={st.assignedTo || ''}
                                                            onChange={(e) => handleUpdateSubTask(st.id, { assignedTo: e.target.value || undefined })}
                                                            className="bg-transparent text-[10px] font-bold text-blue-600 dark:text-blue-400 outline-none max-w-[100px]"
                                                        >
                                                            <option value="">Unassigned</option>
                                                            {members.map(m => (
                                                                <option key={m.uid} value={m.uid}>{m.displayName || m.username}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-end">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveSubTask(st.id)}
                                                className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {subTasks.length === 0 && (
                                <div className="text-center py-8 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                                    <AlertCircle className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No components listed yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </form>

                {/* Footer Actions */}
                <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex items-center justify-end gap-4 mt-auto">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                    >
                        Discard Changes
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"
                    >
                        {isSaving ? "Synchronizing..." : "Finalize Mission"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default EditTaskModal;
