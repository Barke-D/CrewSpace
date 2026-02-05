import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../hooks/useProjects';
import { Plus, BookOpen, Clock, Loader2, Link as LinkIcon, UserPlus, ArrowRight } from 'lucide-react';
import { useAlert } from '../context/AlertContext';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { checkProfileConstraints } from '../utils/profileUtils';
import { User } from '../types';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

const Dashboard: React.FC = () => {
    const { currentUser, loading: authLoading } = useAuth();
    const { projects, loading: projectsLoading, createProject } = useProjects();
    const { showAlert } = useAlert();
    const navigate = useNavigate();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [newProject, setNewProject] = useState({
        name: '',
        course: '',
        type: 'team' as 'personal' | 'team'
    });
    const [inviteLink, setInviteLink] = useState('');
    const [creating, setCreating] = useState(false);

    const checkAndRedirect = async () => {
        if (!currentUser) return false;

        try {
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data() as User;
                if (checkProfileConstraints(userData)) {
                    return true;
                }
            }
        } catch (error) {
            console.error("Error checking profile:", error);
        }

        showAlert("Please complete your profile before getting started!", "info");
        navigate('/profile');
        return false;
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProject.name) return;

        setCreating(true);
        try {
            await createProject(
                newProject.name,
                newProject.type === 'personal' ? '' : newProject.course,
                undefined,
                newProject.type
            );
            setIsModalOpen(false);
            setNewProject({ name: '', course: '', type: 'team' });
            showAlert(`"${newProject.name}" created successfully!`, "success");
        } catch (err) {
            showAlert(`Failed to create project: ${(err as Error).message}`, "error");
        } finally {
            setCreating(false);
        }
    };

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteLink) return;

        let code = inviteLink.trim();
        if (code.includes('/join/')) {
            const parts = code.split('/join/');
            if (parts.length > 1) code = parts[1];
        }
        if (code.endsWith('/')) code = code.slice(0, -1);

        navigate(`/join/${code}`);
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
                <div>
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                        Welcome back, <span className="text-blue-600 dark:text-blue-400">{currentUser?.displayName?.split(' ')[0]}</span>
                    </h1>
                    <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">Here's what's happening with your projects.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={async () => {
                            if (await checkAndRedirect()) setIsJoinModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                    >
                        <UserPlus className="w-4 h-4" />
                        Join Team
                    </button>
                    <button
                        onClick={async () => {
                            if (await checkAndRedirect()) setIsModalOpen(true);
                        }}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold transition shadow-lg shadow-blue-600/20"
                    >
                        <Plus className="w-4 h-4" />
                        New Project
                    </button>
                </div>
            </header>

            {projectsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-48 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
                    ))}
                </div>
            ) : projects.length === 0 ? (
                <div className="glass-card rounded-[2rem] p-12 text-center border-dashed border-2 border-slate-300 dark:border-slate-700">
                    <div className="w-16 h-16 mx-auto bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6">
                        <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No projects yet</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto">Create your first project to start managing tasks and collaborating with your team.</p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="text-blue-600 hover:text-blue-500 font-semibold flex items-center justify-center gap-2 mx-auto"
                    >
                        Create Project <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[200px]">
                    {projects.map((project, i) => {
                        const isFeatured = i === 0;

                        return (
                            <motion.div
                                key={project.id}
                                layoutId={project.id}
                                onClick={() => navigate(`/project/${project.id}`)}
                                className={cn(
                                    "group relative p-6 rounded-[2rem] cursor-pointer overflow-hidden transition-all duration-300",
                                    "glass-card hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1",
                                    isFeatured ? "md:col-span-2 md:row-span-2 flex flex-col justify-between" : "flex flex-col justify-between"
                                )}
                            >
                                <div className={cn(
                                    "absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 blur-[60px] rounded-full -mr-16 -mt-16 transition-transform duration-500 group-hover:scale-110",
                                    isFeatured ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                )} />

                                <div>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-blue-600 dark:text-blue-400">
                                            {project.type === 'personal' ? <Clock className="w-6 h-6" /> : <BookOpen className={cn("w-6 h-6", isFeatured && "w-8 h-8")} />}
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500">
                                                {project.type}
                                            </span>
                                        </div>
                                    </div>

                                    <h3 className={cn("font-bold text-slate-900 dark:text-white mb-1", isFeatured ? "text-3xl" : "text-xl")}>
                                        {project.name}
                                    </h3>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium">{project.course || (project.type === 'personal' ? 'Personal Goal' : 'Team Project')}</p>
                                </div>

                                <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800/50 mt-auto">
                                    <div className="flex items-center gap-2 text-sm text-slate-500 font-bold uppercase tracking-widest">
                                        Open Workspace
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ArrowRight className="w-4 h-4 text-slate-900 dark:text-white" />
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {isJoinModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-8 shadow-2xl"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
                                <LinkIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Join Team</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Enter invite link or code</p>
                            </div>
                        </div>

                        <form onSubmit={handleJoin} className="space-y-6">
                            <div>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={inviteLink}
                                    onChange={e => setInviteLink(e.target.value)}
                                    placeholder="Paste link here..."
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsJoinModalOpen(false);
                                        setInviteLink('');
                                    }}
                                    className="px-6 py-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition shadow-lg shadow-blue-600/20"
                                >
                                    Join Team
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl p-8 shadow-2xl"
                    >
                        <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white">New Project</h2>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <button
                                onClick={() => setNewProject({ ...newProject, type: 'personal' })}
                                className={cn(
                                    "p-4 rounded-2xl border-2 transition-all text-left",
                                    newProject.type === 'personal'
                                        ? "border-blue-600 bg-blue-50/50 dark:bg-blue-900/20"
                                        : "border-slate-100 dark:border-slate-800 hover:border-slate-200"
                                )}
                            >
                                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mb-3">
                                    <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="font-bold text-slate-900 dark:text-white">Personal</h3>
                                <p className="text-xs text-slate-500">Individual tasks & simple tracking.</p>
                            </button>
                            <button
                                onClick={() => setNewProject({ ...newProject, type: 'team' })}
                                className={cn(
                                    "p-4 rounded-2xl border-2 transition-all text-left",
                                    newProject.type === 'team'
                                        ? "border-blue-600 bg-blue-50/50 dark:bg-blue-900/20"
                                        : "border-slate-100 dark:border-slate-800 hover:border-slate-200"
                                )}
                            >
                                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mb-3">
                                    <UserPlus className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <h3 className="font-bold text-slate-900 dark:text-white">Team</h3>
                                <p className="text-xs text-slate-500">Collaborate with roles & scoring.</p>
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Project Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={newProject.name}
                                    onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                                    placeholder={newProject.type === 'personal' ? "e.g. My Study Plan" : "e.g. History Group Project"}
                                />
                            </div>

                            {newProject.type === 'team' && (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Course (Optional)</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        value={newProject.course}
                                        onChange={e => setNewProject({ ...newProject, course: e.target.value })}
                                        placeholder="e.g. HIST 101"
                                    />
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setNewProject({ name: '', course: '', type: 'team' });
                                    }}
                                    className="px-6 py-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Create {newProject.type === 'personal' ? 'Personal' : 'Team'} Project
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
