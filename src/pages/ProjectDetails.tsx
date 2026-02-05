import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    doc,
    getDoc,
    onSnapshot,
    collection,
    query,
    addDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    Timestamp,
    arrayUnion,
    arrayRemove,
    DocumentSnapshot,
    QuerySnapshot,
    DocumentData,
    limit,
    orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Project, Task, User, TaskWeight, Activity, SubTask, TaskStatus, Notification } from '../types';
import { Loader2, Plus, Calendar, CheckCircle, Clock, Share2, ArrowLeft, Layout, BarChart2, List, Trash2, MessageSquare, AlertTriangle, Edit3 } from 'lucide-react';
import NotificationPanel from '../components/NotificationPanel';
import { useProjects } from '../hooks/useProjects';
import { useAlert } from '../context/AlertContext';
import ProfileAvatar from '../components/ProfileAvatar';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import ProjectAnalytics from '../components/ProjectAnalytics';
import CalendarView from '../components/CalendarView';
import ActivityFeed from '../components/ActivityFeed';
import ChatSystem from '../components/ChatSystem';
import { AccountabilityEngine } from '../lib/AccountabilityEngine';
import EditTaskModal from '../components/EditTaskModal';
import { format } from 'date-fns';

type Tab = 'tasks' | 'calendar' | 'analytics' | 'chat' | 'settings';

const ProjectDetails: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const { currentUser, isGuest } = useAuth();
    const navigate = useNavigate();
    const { deleteProject } = useProjects();
    const { showAlert } = useAlert();

    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [membersData, setMembersData] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('tasks');

    const [newTaskMode, setNewTaskMode] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDesc, setNewTaskDesc] = useState('');
    const [newTaskDate, setNewTaskDate] = useState('');
    const [newTaskWeight, setNewTaskWeight] = useState<TaskWeight>('medium');
    const [newSubTasks, setNewSubTasks] = useState<{ title: string, deadline: string, assignedTo: string }[]>([]);

    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [confirmName, setConfirmName] = useState('');
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    // Fetch Project & Activity
    useEffect(() => {
        if (!projectId || !currentUser) return;

        if (isGuest && projectId.startsWith('mock-project')) {
            // Mock Data for Guest
            setProject({
                id: projectId,
                name: projectId === 'mock-project-1' ? 'Demo Project: Web App' : 'History Presentation',
                course: 'DEMO 101',
                deadline: Timestamp.fromDate(new Date(Date.now() + 86400000 * 7)),
                ownerId: currentUser.uid,
                members: [currentUser.uid],
                inviteCode: 'guest-code',
                type: 'team',
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            });
            setTasks([
                {
                    id: 'task-1',
                    projectId,
                    title: 'Review Requirements',
                    description: 'Read over the project spec.',
                    status: 'done',
                    weight: 'small',
                    deadline: Timestamp.fromDate(new Date()),
                    assignedTo: [currentUser.uid],
                    completedBy: currentUser.uid,
                    completedAt: Timestamp.now(),
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now(),
                    createdBy: currentUser.uid,
                    subTasks: []
                },
                {
                    id: 'task-2',
                    projectId,
                    title: 'Create Draft',
                    description: '',
                    status: 'todo',
                    weight: 'large',
                    deadline: Timestamp.fromDate(new Date(Date.now() + 86400000)),
                    assignedTo: [],
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now(),
                    createdBy: currentUser.uid,
                    subTasks: []
                }
            ]);
            setActivities([
                {
                    id: 'act-1',
                    projectId,
                    type: 'task_completed',
                    message: 'completed "Review Requirements"',
                    userId: currentUser.uid,
                    createdAt: Timestamp.now()
                }
            ]);
            setLoading(false);
            return;
        }

        // Normal Firestore logic
        if (isGuest) return;

        const projectUnsub = onSnapshot(doc(db, 'projects', projectId), (docSnap: DocumentSnapshot<DocumentData>) => {
            if (docSnap.exists()) {
                const data = docSnap.data() as Project;
                if (!data.members.includes(currentUser.uid)) {
                    showAlert("You are not a member of this project.", "error");
                    navigate('/dashboard');
                    return;
                }
                setProject({ ...data, id: docSnap.id });
            } else {
                navigate('/dashboard');
            }
        });

        const activitiesQuery = query(
            collection(db, 'projects', projectId, 'activities'),
            orderBy('createdAt', 'desc'),
            limit(10)
        );
        const activityUnsub = onSnapshot(activitiesQuery, (snapshot: QuerySnapshot<DocumentData>) => {
            const fetchedActivities = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Activity));
            setActivities(fetchedActivities);
        });

        return () => {
            projectUnsub();
            activityUnsub();
        }
    }, [projectId, currentUser, navigate, isGuest, showAlert]);

    // Fetch members details and tasks
    useEffect(() => {
        if (!projectId || !currentUser || isGuest) return;

        const fetchMembers = async () => {
            if (!project?.members || project.members.length === 0) return;

            try {
                const snapshotPromises = project.members.map(uid => getDoc(doc(db, 'users', uid)));
                const snapshots = await Promise.all(snapshotPromises);
                const users = snapshots
                    .filter(snap => snap.exists())
                    .map(snap => ({ ...snap.data(), uid: snap.id } as User));
                setMembersData(users);
            } catch (err) {
                console.error("❌ Error fetching members:", err);
            }
        };

        const tasksQuery = query(collection(db, 'projects', projectId, 'tasks'));
        const tasksUnsub = onSnapshot(tasksQuery, (snapshot: QuerySnapshot<DocumentData>) => {
            const fetchedTasks = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Task));
            fetchedTasks.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
            setTasks(fetchedTasks);
            setLoading(false);
        });

        fetchMembers();
        return () => tasksUnsub();
    }, [project, isGuest, currentUser, projectId]);

    const logActivity = async (type: Activity['type'], message: string) => {
        if (!projectId || !currentUser || isGuest) return;
        try {
            await addDoc(collection(db, 'projects', projectId, 'activities'), {
                projectId,
                type,
                message,
                userId: currentUser.uid,
                createdAt: serverTimestamp()
            });
        } catch (e) {
            console.error("Failed to log activity", e);
        }
    };

    const sendNotification = async (userId: string, data: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
        if (isGuest || !currentUser || userId === currentUser.uid) return;
        try {
            await addDoc(collection(db, 'users', userId, 'notifications'), {
                ...data,
                userId,
                read: false,
                createdAt: serverTimestamp()
            });
        } catch (e) {
            console.error("Failed to send notification", e);
        }
    };

    const isPersonal = project?.type === 'personal';
    const isOwner = project?.ownerId === currentUser?.uid;

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle || !newTaskDate || !currentUser || !projectId) return;

        const subTasksList: SubTask[] = newSubTasks
            .filter(st => st.title.trim() !== '')
            .map((st, i) => {
                const subTask: SubTask = {
                    id: `st-${Date.now()}-${i}`,
                    title: st.title,
                    status: 'todo',
                    deadline: st.deadline ? Timestamp.fromDate(new Date(st.deadline)) : Timestamp.now()
                };
                if (st.assignedTo) {
                    subTask.assignedTo = st.assignedTo;
                }
                return subTask;
            });

        const newTaskPayload: Omit<Task, 'id'> = {
            projectId,
            title: newTaskTitle,
            description: newTaskDesc,
            status: 'todo',
            weight: newTaskWeight,
            deadline: Timestamp.fromDate(new Date(newTaskDate)),
            assignedTo: project?.type === 'personal' ? [currentUser.uid] : [],
            subTasks: subTasksList,
            createdBy: currentUser.uid,
            createdAt: serverTimestamp() as Timestamp,
            updatedAt: serverTimestamp() as Timestamp
        };

        if (isGuest) {
            setTasks(prev => [{ ...newTaskPayload, id: `mock-task-${Date.now()}`, createdAt: Timestamp.now(), updatedAt: Timestamp.now() } as Task, ...prev]);
            setActivities(prev => [{
                id: `act-${Date.now()}`,
                projectId,
                type: 'task_created',
                message: `created task "${newTaskTitle}"`,
                userId: currentUser.uid,
                createdAt: Timestamp.now()
            }, ...prev]);
        } else {
            try {
                await addDoc(collection(db, 'projects', projectId, 'tasks'), newTaskPayload);
                await logActivity('task_created', `created task "${newTaskTitle}"`);

                // Notify sub-task assignees
                for (const st of subTasksList) {
                    if (st.assignedTo) {
                        await sendNotification(st.assignedTo, {
                            userId: st.assignedTo,
                            type: 'subtask_assigned',
                            title: project?.name || 'New Sub-task Assigned',
                            message: `You've been assigned to "${st.title}"`,
                            link: `/project/${projectId}`
                        });
                    }
                }
            } catch (err) {
                console.error(err);
                showAlert("Failed to create task", "error");
            }
        }

        setNewTaskMode(false);
        setNewTaskTitle('');
        setNewTaskDesc('');
        setNewTaskDate('');
        setNewSubTasks([]);
    };

    const toggleTaskStatus = async (task: Task) => {
        if (!projectId || !currentUser) return;

        const newStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done';

        // Permission: Only assignees (including sub-task assignees) OR the project owner can mark Done
        const isOwner = project?.ownerId === currentUser.uid;
        const isAssignedToMain = task.assignedTo.includes(currentUser.uid);
        const isAssignedToSub = task.subTasks?.some(st => st.assignedTo === currentUser.uid);
        const isCreator = task.createdBy === currentUser.uid;
        const isAssigned = isAssignedToMain || isAssignedToSub || isCreator;

        if (newStatus === 'done' && !isAssigned && !isOwner && !isPersonal) {
            showAlert("Only assigned members or the project creator can mark this task as complete.", "error");
            return;
        }

        const isLate = newStatus === 'done' && new Date() > new Date(task.deadline.toDate());

        const updates: any = {
            status: newStatus,
            updatedAt: isGuest ? Timestamp.now() : serverTimestamp()
        };

        if (newStatus === 'done') {
            updates.completedBy = currentUser.uid;
            updates.completedAt = isGuest ? Timestamp.now() : serverTimestamp();
            updates.isLate = isLate;
        } else {
            updates.completedBy = null;
            updates.completedAt = null;
            updates.isLate = false;
        }

        if (isGuest) {
            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, ...updates } : t));
            return;
        }

        try {
            await updateDoc(doc(db, 'projects', projectId, 'tasks', task.id), updates);
            if (newStatus === 'done') {
                await logActivity(isLate ? 'task_late' : 'task_completed', `completed "${task.title}"${isLate ? ' LATE' : ''}`);
            }
        } catch (err) {
            console.error("Error updating status:", err);
            showAlert("You don't have permission to perform this action.", "error");
        }
    };

    const toggleSubTask = async (task: Task, subTaskId: string) => {
        if (!projectId || !currentUser) return;

        const isOwner = project?.ownerId === currentUser.uid;
        const subTask = task.subTasks?.find(st => st.id === subTaskId);
        const isAssignedToMain = task.assignedTo.includes(currentUser.uid);
        const isAssignedToThisSub = subTask?.assignedTo === currentUser.uid;
        const isCreator = task.createdBy === currentUser.uid;

        if (!isAssignedToMain && !isAssignedToThisSub && !isCreator && !isOwner && !isPersonal) {
            showAlert("Only assigned members or the project creator can update sub-tasks.", "error");
            return;
        }

        const updatedSubTasks = task.subTasks?.map((st: SubTask) => {
            if (st.id === subTaskId) {
                const newStatus = st.status === 'done' ? 'todo' : 'done';
                const updates: Partial<SubTask> = { status: newStatus };

                if (newStatus === 'done') {
                    const isLate = new Date() > new Date(st.deadline.toDate());
                    updates.completedAt = Timestamp.now();
                    updates.isLate = isLate;
                } else {
                    updates.completedAt = null;
                    updates.isLate = false;
                }

                return { ...st, ...updates } as SubTask;
            }
            return st;
        }) || [];

        if (isGuest) {
            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, subTasks: updatedSubTasks } : t));
            return;
        }

        await updateDoc(doc(db, 'projects', projectId, 'tasks', task.id), {
            subTasks: updatedSubTasks,
            updatedAt: serverTimestamp()
        });
    };

    const joinTask = async (task: Task) => {
        if (!currentUser || !projectId) return;
        const isAssigned = task.assignedTo.includes(currentUser.uid);

        if (isGuest) {
            setTasks(prev => prev.map(t => t.id === task.id ? {
                ...t,
                assignedTo: isAssigned ? t.assignedTo.filter(id => id !== currentUser.uid) : [...t.assignedTo, currentUser.uid]
            } : t));
            return;
        }

        await updateDoc(doc(db, 'projects', projectId, 'tasks', task.id), {
            assignedTo: isAssigned ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid)
        });

        // Notify Project Owner when someone takes a task
        if (!isAssigned && project?.ownerId && project.ownerId !== currentUser.uid) {
            await sendNotification(project.ownerId, {
                userId: project.ownerId,
                type: 'project_update',
                title: project.name,
                message: `${currentUser.displayName || 'A team member'} took the task "${task.title}"`,
                link: `/project/${projectId}`
            });
        }
    };

    const handleUpdateTask = async (updatedTask: Task) => {
        if (!projectId || !currentUser) return;

        const task = tasks.find(t => t.id === updatedTask.id);
        const isCreator = task?.createdBy === currentUser.uid;

        if (!isOwner && !isCreator && !isPersonal) {
            showAlert("Only the project owner or task creator can update this task.", "error");
            return;
        }

        if (isGuest) {
            setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
            showAlert("Task updated locally", "success");
            return;
        }

        try {
            const taskDocRef = doc(db, 'projects', projectId, 'tasks', updatedTask.id);
            await updateDoc(taskDocRef, {
                title: updatedTask.title,
                description: updatedTask.description,
                weight: updatedTask.weight,
                deadline: updatedTask.deadline,
                subTasks: updatedTask.subTasks,
                updatedAt: serverTimestamp()
            });
            showAlert("Task updated successfully", "success");
            await logActivity('task_created' as any, `updated task "${updatedTask.title}"`);
        } catch (err) {
            console.error("Error updating task:", err);
            showAlert("Failed to update task", "error");
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        const isCreator = task?.createdBy === currentUser?.uid;
        if (!projectId || (!isOwner && !isCreator)) return;

        if (!window.confirm("Are you sure you want to delete this task?")) return;

        try {
            await deleteDoc(doc(db, 'projects', projectId, 'tasks', taskId));
            showAlert("Task deleted successfully", "success");
            await logActivity('task_created' as any, `deleted a task`);
        } catch (err) {
            console.error("Error deleting task:", err);
            showAlert("Failed to delete task", "error");
        }
    };

    const copyInvite = () => {
        if (!project) return;
        const url = `${window.location.origin}/join/${project.inviteCode}`;
        navigator.clipboard.writeText(url);
        showAlert("Invite link copied!", "success");
    };

    const addSubTaskRow = () => {
        setNewSubTasks([...newSubTasks, { title: '', deadline: '', assignedTo: '' }]);
    };

    const removeSubTaskRow = (index: number) => {
        setNewSubTasks(newSubTasks.filter((_, i) => i !== index));
    };

    const handleDeleteProject = async () => {
        if (!projectId || !project || confirmName !== project.name || !currentUser) return;

        if (project.ownerId !== currentUser.uid) {
            showAlert("Only the project creator can delete this group.", "error");
            return;
        }

        setIsDeleting(true);
        try {
            await deleteProject(projectId);
            showAlert("Project deleted successfully!", "success");
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            showAlert("Failed to delete project. Please check if you have permission.", "error");
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium mb-4 flex items-center gap-2 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </button>
                    <div className="flex items-start gap-4">
                        <div className="p-4 bg-blue-50 dark:bg-slate-800 rounded-2xl hidden sm:block">
                            <Layout className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">{project?.name}</h1>
                                {project?.course && (
                                    <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-wider">
                                        {project.course}
                                    </span>
                                )}
                                <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-[0.1em]">
                                    {project?.type}
                                </span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest mt-2 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                Active Workspace
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {isOwner && !isPersonal && (
                        <button
                            onClick={copyInvite}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition font-medium"
                        >
                            <Share2 className="w-4 h-4" /> Invite Team
                        </button>
                    )}
                    <NotificationPanel />
                    <button
                        onClick={() => setNewTaskMode(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition hover:scale-105"
                    >
                        <Plus className="w-5 h-5" /> Add Task
                    </button>
                </div>
            </header>

            {/* Tabs */}
            <div className="border-b border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 sm:gap-8">
                <button
                    onClick={() => setActiveTab('tasks')}
                    className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'tasks' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <List className="w-4 h-4" /> Tasks
                </button>
                <button
                    onClick={() => setActiveTab('chat')}
                    className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'chat' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <MessageSquare className="w-4 h-4" /> Chat & Files
                </button>
                <button
                    onClick={() => setActiveTab('calendar')}
                    className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'calendar' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <Calendar className="w-4 h-4" /> Calendar
                </button>
                {!isPersonal && (
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'analytics' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <BarChart2 className="w-4 h-4" /> Analytics
                    </button>
                )}
                {isOwner && (
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'settings' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <Layout className="w-4 h-4" /> Settings
                    </button>
                )}
            </div>

            {/* Content Area */}
            {activeTab === 'tasks' && (
                <div className={cn("grid grid-cols-1 gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-500", !isPersonal && "lg:grid-cols-3")}>
                    <div className={cn("space-y-6", !isPersonal && "lg:col-span-2")}>
                        <AnimatePresence>
                            {newTaskMode && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="glass-card rounded-3xl p-8 border border-blue-200 dark:border-blue-900/50 shadow-xl shadow-blue-500/5 mb-6">
                                        <form onSubmit={handleAddTask} className="space-y-6">
                                            <div className="space-y-2">
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    placeholder="Main task title..."
                                                    className="w-full bg-transparent text-2xl font-bold outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
                                                    value={newTaskTitle}
                                                    onChange={e => setNewTaskTitle(e.target.value)}
                                                />
                                                <textarea
                                                    placeholder="Detailed description (optional)..."
                                                    className="w-full bg-transparent text-sm outline-none resize-none text-slate-600 dark:text-slate-300 placeholder:text-slate-400 min-h-[60px]"
                                                    value={newTaskDesc}
                                                    onChange={e => setNewTaskDesc(e.target.value)}
                                                />
                                            </div>

                                            {/* Sub-tasks Section */}
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                    Sub-tasks & Responsibilities
                                                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{newSubTasks.length}</span>
                                                </h4>

                                                {newSubTasks.map((st, i) => (
                                                    <div key={i} className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                                        <input
                                                            className="flex-1 min-w-[150px] bg-transparent text-sm font-medium outline-none text-slate-800 dark:text-slate-200"
                                                            placeholder="Sub-task title..."
                                                            value={st.title}
                                                            onChange={e => {
                                                                const list = [...newSubTasks];
                                                                list[i].title = e.target.value;
                                                                setNewSubTasks(list);
                                                            }}
                                                        />
                                                        <input
                                                            type="date"
                                                            className="bg-transparent text-xs text-slate-500 outline-none"
                                                            value={st.deadline}
                                                            onChange={e => {
                                                                const list = [...newSubTasks];
                                                                list[i].deadline = e.target.value;
                                                                setNewSubTasks(list);
                                                            }}
                                                        />
                                                        {!isPersonal && (
                                                            <select
                                                                className="bg-transparent text-xs text-blue-600 dark:text-blue-400 font-bold outline-none max-w-[120px]"
                                                                value={st.assignedTo}
                                                                onChange={e => {
                                                                    const list = [...newSubTasks];
                                                                    list[i].assignedTo = e.target.value;
                                                                    setNewSubTasks(list);
                                                                }}
                                                            >
                                                                <option value="">Assign Member</option>
                                                                {membersData.map(m => (
                                                                    <option key={m.uid} value={m.uid}>{m.displayName || m.username}</option>
                                                                ))}
                                                            </select>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeSubTaskRow(i)}
                                                            className="text-slate-400 hover:text-red-500 transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}

                                                <button
                                                    type="button"
                                                    onClick={addSubTaskRow}
                                                    className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:translate-x-1 transition-transform"
                                                >
                                                    <Plus className="w-4 h-4" /> Add Sub-task
                                                </button>
                                            </div>

                                            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex flex-col gap-1">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Deadline</label>
                                                        <input
                                                            type="date"
                                                            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-sm outline-none text-slate-700 dark:text-white"
                                                            value={newTaskDate}
                                                            onChange={e => setNewTaskDate(e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                    {!isPersonal && (
                                                        <div className="flex flex-col gap-1">
                                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Weight</label>
                                                            <select
                                                                value={newTaskWeight}
                                                                onChange={e => setNewTaskWeight(e.target.value as TaskWeight)}
                                                                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-sm outline-none text-slate-700 dark:text-white"
                                                            >
                                                                <option value="small">Small</option>
                                                                <option value="medium">Medium</option>
                                                                <option value="large">Large</option>
                                                            </select>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => setNewTaskMode(false)}
                                                        className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-sm px-4 py-2 font-medium"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-6 py-2 rounded-xl font-bold shadow-lg shadow-blue-600/20"
                                                    >
                                                        Create Task
                                                    </button>
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-4">
                            {tasks.length === 0 && !newTaskMode ? (
                                <div className="text-center py-20 bg-slate-50/50 dark:bg-slate-900/30 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem]">
                                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Plus className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight">Focus starts here. Create your first task.</p>
                                </div>
                            ) : (
                                tasks.map(task => {
                                    const isDone = task.status === 'done';
                                    const isOverdue = !isDone && new Date(task.deadline.toDate()) < new Date();
                                    const isLate = task.isLate;

                                    return (
                                        <motion.div
                                            layout
                                            key={task.id}
                                            className={cn(
                                                "group relative glass-card rounded-3xl p-6 border transition-all duration-300",
                                                isDone ? "opacity-75 bg-slate-50/50 dark:bg-slate-900/30" : "hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-900/60"
                                            )}
                                        >
                                            <div className={cn(
                                                "absolute left-0 top-6 bottom-6 w-1.5 rounded-r-full transition-colors",
                                                isDone ? (isLate ? "bg-amber-400" : "bg-emerald-500") : isOverdue ? "bg-red-500" : "bg-blue-600"
                                            )} />

                                            <div className="flex items-start gap-5 pl-4">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleTaskStatus(task);
                                                    }}
                                                    className={cn(
                                                        "mt-1 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                                                        isDone ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 dark:border-slate-600 hover:border-blue-600 text-transparent hover:text-blue-600"
                                                    )}
                                                >
                                                    <CheckCircle className="w-5 h-5 pointer-events-none" />
                                                </button>

                                                <div className="flex-1 space-y-4">
                                                    <div>
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex flex-wrap gap-2 items-center mb-1">
                                                                <h3 className={cn(
                                                                    "text-xl font-bold transition-all tracking-tight",
                                                                    isDone ? "text-slate-500 line-through decoration-2" : "text-slate-900 dark:text-white"
                                                                )}>
                                                                    {task.title}
                                                                </h3>
                                                                <span className="text-[10px] font-black uppercase border border-slate-200 dark:border-slate-700 text-slate-500 px-2 py-0.5 rounded-lg">
                                                                    {task.weight}
                                                                </span>
                                                                {isLate && <span className="text-[10px] font-black uppercase bg-amber-50 text-amber-600 px-2 py-0.5 rounded-lg border border-amber-200">Late</span>}
                                                                {isOverdue && <span className="text-[10px] font-black uppercase bg-red-50 text-red-600 px-2 py-0.5 rounded-lg border border-red-100">Overdue</span>}
                                                            </div>
                                                        </div>
                                                        {task.description && <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{task.description}</p>}
                                                    </div>

                                                    {/* Display Sub-tasks */}
                                                    {task.subTasks && task.subTasks.length > 0 && (
                                                        <div className="space-y-2 bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                                                            {task.subTasks.map(st => {
                                                                const stMember = membersData.find(m => m.uid === st.assignedTo);
                                                                return (
                                                                    <div key={st.id} className="flex items-center justify-between group/st">
                                                                        <div className="flex items-center gap-3">
                                                                            <button
                                                                                onClick={() => toggleSubTask(task, st.id)}
                                                                                className={cn(
                                                                                    "w-4 h-4 rounded-md border flex items-center justify-center transition-all",
                                                                                    st.status === 'done' ? "bg-blue-500 border-blue-500 text-white" : "border-slate-300 dark:border-slate-600"
                                                                                )}
                                                                            >
                                                                                {st.status === 'done' && <CheckCircle className="w-3 h-3" />}
                                                                            </button>
                                                                            <span className={cn("text-xs font-medium transition-colors", st.status === 'done' ? "text-slate-400 line-through" : "text-slate-700 dark:text-slate-300")}>
                                                                                {st.title}
                                                                            </span>
                                                                            {st.isLate && <span className="text-[8px] font-black uppercase text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 ml-1">Late</span>}
                                                                        </div>
                                                                        <div className="flex items-center gap-3 opacity-60 group-hover/st:opacity-100 transition-opacity">
                                                                            <span className="text-[10px] font-medium text-slate-400">
                                                                                {st.deadline ? format(st.deadline.toDate(), 'MMM d') : ''}
                                                                            </span>
                                                                            {stMember && (
                                                                                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                                                                                    <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400">@{stMember.username}</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-6 pt-2">
                                                        <div className={cn("flex items-center gap-2 text-xs font-semibold", isOverdue ? "text-red-500" : "text-slate-500")}>
                                                            <Clock className="w-4 h-4" />
                                                            {format(task.deadline.toDate(), 'MMM d, yyyy')}
                                                        </div>

                                                        {!isPersonal && (
                                                            <div className="flex items-center gap-2">
                                                                {task.assignedTo.length > 0 ? (
                                                                    <div className="flex -space-x-1.5">
                                                                        {task.assignedTo.map(uid => {
                                                                            const m = membersData.find(u => u.uid === uid);
                                                                            return (
                                                                                <div key={uid} title={m?.displayName || m?.username} className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 overflow-hidden bg-slate-200">
                                                                                    {m?.photoURL ? <img src={m.photoURL} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] font-bold uppercase">{m?.username?.[0] || '?'}</div>}
                                                                                </div>
                                                                            )
                                                                        })}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unassigned</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="absolute top-6 right-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                    {(isOwner || task.createdBy === currentUser?.uid) && (
                                                        <>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingTask(task);
                                                                }}
                                                                className="p-2 bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 rounded-xl backdrop-blur-sm transition-all shadow-sm"
                                                                title="Edit Task"
                                                            >
                                                                <Edit3 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteTask(task.id);
                                                                }}
                                                                className="p-2 bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-red-600 rounded-xl backdrop-blur-sm transition-all shadow-sm"
                                                                title="Delete Task"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                    {!isPersonal && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                joinTask(task);
                                                            }}
                                                            className={cn(
                                                                "text-[10px] font-black uppercase tracking-tighter px-3 py-2 rounded-xl border transition-all backdrop-blur-sm shadow-sm",
                                                                task.assignedTo.includes(currentUser?.uid || '')
                                                                    ? "bg-red-50/80 border-red-200 text-red-600 hover:bg-red-100 dark:bg-red-900/40 dark:border-red-900"
                                                                    : "bg-blue-50/80 border-blue-200 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/40 dark:border-blue-900"
                                                            )}
                                                        >
                                                            {task.assignedTo.includes(currentUser?.uid || '') ? 'Leave' : 'Take Task'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Sidebar Column (Hidden for Personal) */}
                    {!isPersonal && (
                        <div className="space-y-6">
                            <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    Team Members
                                    <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full">{membersData.length}</span>
                                </h3>
                                <div className="space-y-4">
                                    {membersData.map(member => {
                                        const stats = project ? AccountabilityEngine.calculateMemberStats(member.uid, tasks, project) : null;
                                        return (
                                            <div key={member.uid} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                                <ProfileAvatar photoURL={member.photoURL} displayName={member.displayName || member.username} size="sm" />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate flex items-center gap-2">
                                                            {member.displayName || member.username}
                                                            {member.uid === project?.ownerId && (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 shadow-sm shadow-blue-500/5">Admin</span>
                                                            )}
                                                        </p>
                                                        {stats?.isAtRisk && (
                                                            <span className="text-[8px] font-black text-white bg-red-500 px-1.5 py-0.5 rounded">AT RISK</span>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] font-semibold text-slate-400 truncate tracking-tight">@{member.username}</p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Overall Progress</h3>
                                <div className="flex items-end gap-2 mb-2">
                                    <span className="text-4xl font-black text-slate-900 dark:text-white tabular-nums">
                                        {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100) : 0}%
                                    </span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${tasks.length > 0 ? (tasks.filter(t => t.status === 'done').length / tasks.length) * 100 : 0}% ` }}
                                        transition={{ duration: 1.5, ease: 'circOut' }}
                                        className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full shadow-[0_0_10px_rgba(37,99,235,0.3)]"
                                    />
                                </div>
                            </div>

                            <ActivityFeed activities={activities} members={membersData} />
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'chat' && project && (
                <ChatSystem projectId={projectId!} members={membersData} isPersonal={isPersonal} />
            )}

            {activeTab === 'analytics' && project && !isPersonal && (
                <ProjectAnalytics project={project} tasks={tasks} members={membersData} />
            )}

            {activeTab === 'calendar' && (
                <CalendarView tasks={tasks} members={membersData} projectName={project?.name} />
            )}

            {activeTab === 'settings' && (
                <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="glass-card rounded-[2.5rem] p-10 border border-red-200/30 dark:border-red-900/20 bg-red-50/5 dark:bg-red-950/5">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-2xl">
                                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Danger Zone</h2>
                                <p className="text-slate-500 dark:text-slate-400 font-medium">Irreversible actions for your project.</p>
                            </div>
                        </div>

                        <div className="p-8 bg-white dark:bg-slate-900/50 rounded-3xl border border-red-100 dark:border-red-900/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Delete this project</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">Once you delete a project, there is no going back. Please be certain.</p>
                            </div>
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-600/20 whitespace-nowrap"
                            >
                                Delete Project
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] w-full max-w-xl p-10 shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 blur-[80px] rounded-full -mr-20 -mt-20" />

                            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4 relative z-10">Are you absolutely sure?</h2>
                            <p className="text-slate-500 dark:text-slate-400 mb-8 relative z-10 leading-relaxed font-medium">
                                This action <span className="text-red-600 font-black">cannot</span> be undone. This will permanently delete the
                                <span className="text-slate-900 dark:text-white font-black px-1.5 underline decoration-red-500/30">
                                    {project?.name}
                                </span>
                                project and all associated tasks, chats, and activities.
                            </p>

                            <div className="space-y-4 mb-10 relative z-10">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                                    Type the project name to confirm
                                </label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 text-lg font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all placeholder:text-slate-400"
                                    placeholder={project?.name}
                                    value={confirmName}
                                    onChange={e => setConfirmName(e.target.value)}
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 relative z-10">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setConfirmName('');
                                    }}
                                    className="flex-1 px-8 py-4 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl font-bold transition-all text-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={confirmName !== project?.name || isDeleting}
                                    onClick={handleDeleteProject}
                                    className="flex-1 px-8 py-4 bg-red-600 hover:bg-red-700 disabled:opacity-30 disabled:hover:bg-red-600 text-white rounded-2xl font-black transition-all shadow-xl shadow-red-600/20 flex items-center justify-center gap-3 text-lg"
                                >
                                    {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                                    I understand, delete this project
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Task Editing Modal */}
            <AnimatePresence>
                {editingTask && (
                    <EditTaskModal
                        isOpen={!!editingTask}
                        onClose={() => setEditingTask(null)}
                        task={editingTask}
                        members={membersData}
                        onUpdate={handleUpdateTask}
                        isPersonal={isPersonal}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProjectDetails;
