import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { User, ChatMessage } from '../types';
import {
    Send,
    Smile,
    Paperclip,
    Download,
    Loader2,
    User as UserIcon,
    Maximize2,
    Minimize2,
    Reply,
    Pencil,
    Trash2,
    Pin,
    X,
    ChevronDown,
    Check,
    FileText
} from 'lucide-react';
import EmojiPicker, { Theme as EmojiTheme } from 'emoji-picker-react';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { downloadFile } from '../utils/downloadFile';
import ProfileAvatar from './ProfileAvatar';

interface ChatSystemProps {
    projectId: string;
    members: User[];
    isPersonal?: boolean;
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

const ChatSystem: React.FC<ChatSystemProps> = ({ projectId, members, isPersonal }) => {
    const { currentUser } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showScrollBtn, setShowScrollBtn] = useState(false);

    // Reply / Edit state
    const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
    const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);

    // Hover action menu
    const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
    const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);

    // Pinned message
    const [pinnedMessage, setPinnedMessage] = useState<ChatMessage | null>(null);
    const [showPinnedBar, setShowPinnedBar] = useState(true);

    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    // ── Firestore Listener ──────────────────────────────────────────────
    useEffect(() => {
        if (!projectId) return;
        const q = query(
            collection(db, 'projects', projectId, 'messages'),
            orderBy('createdAt', 'asc')
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as ChatMessage[];
            setMessages(msgs);
            setLoading(false);

            // Find latest pinned message
            const pinned = msgs.filter(m => m.pinnedBy).sort((a, b) =>
                (b.pinnedAt?.toMillis() || 0) - (a.pinnedAt?.toMillis() || 0)
            );
            setPinnedMessage(pinned.length > 0 ? pinned[0] : null);
        }, (err) => {
            console.error("❌ ChatSystem Firestore Error:", err);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [projectId]);

    // ── Auto‑scroll ─────────────────────────────────────────────────────
    const scrollToBottom = useCallback((smooth = true) => {
        setTimeout(() => {
            scrollRef.current?.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: smooth ? 'smooth' : 'auto'
            });
        }, 80);
    }, []);

    useEffect(() => {
        if (messages.length) scrollToBottom(false);
    }, [messages.length]); // eslint-disable-line

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 200);
    };

    // ── Scroll to a specific message ────────────────────────────────────
    const scrollToMessage = (messageId: string) => {
        const el = messageRefs.current.get(messageId);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('ring-2', 'ring-blue-500/50');
            setTimeout(() => el.classList.remove('ring-2', 'ring-blue-500/50'), 2000);
        }
    };

    // ── Send / Edit Message ─────────────────────────────────────────────
    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if ((!newMessage.trim() && !isUploading) || !currentUser) return;

        const msgText = newMessage.trim();
        setNewMessage('');
        setShowEmojiPicker(false);

        // If editing
        if (editingMessage) {
            try {
                await updateDoc(doc(db, 'projects', projectId, 'messages', editingMessage.id), {
                    text: msgText,
                    editedAt: serverTimestamp()
                });
            } catch (err) {
                console.error("Error editing message:", err);
            }
            setEditingMessage(null);
            return;
        }

        // New message
        const payload: any = {
            text: msgText,
            senderId: currentUser.uid,
            createdAt: serverTimestamp(),
            isDeleted: false
        };

        if (replyingTo) {
            const senderOfReply = members.find(m => m.uid === replyingTo.senderId);
            payload.replyTo = {
                messageId: replyingTo.id,
                text: replyingTo.text || (replyingTo.fileName ? `📎 ${replyingTo.fileName}` : 'Media'),
                senderName: senderOfReply?.displayName || 'Unknown'
            };
            setReplyingTo(null);
        }

        try {
            await addDoc(collection(db, 'projects', projectId, 'messages'), payload);
        } catch (err) {
            console.error("Error sending message:", err);
        }
    };

    // ── File Upload (Cloudinary) ─────────────────────────────────────────
    const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
    const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string;

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !currentUser) return;

        // Warn for large files
        if (file.size > 25 * 1024 * 1024) {
            if (!window.confirm(`This file is ${(file.size / 1024 / 1024).toFixed(1)}MB. Files over 25MB may fail. Continue?`)) {
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }
        }

        setIsUploading(true);
        setUploadProgress(0);

        try {
            console.log('📤 Starting Cloudinary upload...');

            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
            formData.append('public_id', `chat/${projectId}/${Date.now()}_${file.name}`);

            // Use XMLHttpRequest so we can track upload progress
            const xhr = new XMLHttpRequest();
            xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`, true);

            xhr.upload.onprogress = (ev) => {
                if (ev.lengthComputable) {
                    const progress = Math.round((ev.loaded / ev.total) * 100);
                    console.log(`📤 Upload progress: ${progress}%`);
                    setUploadProgress(progress);
                }
            };

            xhr.onload = async () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    const result = JSON.parse(xhr.responseText);
                    const secureUrl: string = result.secure_url;
                    console.log('✅ Upload complete to Cloudinary:', secureUrl);

                    try {
                        const payload: any = {
                            text: '',
                            fileUrl: secureUrl,
                            fileName: file.name,
                            fileType: file.type,
                            senderId: currentUser.uid,
                            createdAt: serverTimestamp(),
                            isDeleted: false
                        };

                        if (replyingTo) {
                            const senderOfReply = members.find(m => m.uid === replyingTo.senderId);
                            payload.replyTo = {
                                messageId: replyingTo.id,
                                text: replyingTo.text || '📎 Media',
                                senderName: senderOfReply?.displayName || 'Unknown'
                            };
                            setReplyingTo(null);
                        }

                        await addDoc(collection(db, 'projects', projectId, 'messages'), payload);
                        console.log('✅ File message saved to Firestore');
                    } catch (err) {
                        console.error('❌ Error saving file message to Firestore:', err);
                        alert('File uploaded but failed to save the message. Please try again.');
                    } finally {
                        setIsUploading(false);
                        setUploadProgress(0);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                    }
                } else {
                    console.error('❌ Cloudinary upload error:', xhr.statusText, xhr.responseText);
                    alert(`Failed to upload file: ${xhr.statusText}`);
                    setIsUploading(false);
                    setUploadProgress(0);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                }
            };

            xhr.onerror = () => {
                console.error('❌ Upload error (network): XHR failed');
                alert('Failed to upload file. Check your connection.');
                setIsUploading(false);
                setUploadProgress(0);
                if (fileInputRef.current) fileInputRef.current.value = '';
            };

            xhr.send(formData);
        } catch (err: any) {
            console.error('❌ Error starting upload:', err);
            alert(`Failed to start file upload: ${err.message || 'Unknown error'}`);
            setIsUploading(false);
            setUploadProgress(0);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // ── Delete Message (Soft) ───────────────────────────────────────────
    const handleDelete = async (msg: ChatMessage) => {
        if (msg.senderId !== currentUser?.uid) return;
        try {
            await updateDoc(doc(db, 'projects', projectId, 'messages', msg.id), {
                isDeleted: true,
                text: '',
                fileUrl: null,
                fileName: null,
                fileType: null
            });
        } catch (err) {
            console.error("Error deleting message:", err);
        }
        setActiveMessageId(null);
    };

    // ── Pin / Unpin ─────────────────────────────────────────────────────
    const handlePin = async (msg: ChatMessage) => {
        if (!currentUser) return;
        const isPinned = msg.pinnedBy;
        try {
            await updateDoc(doc(db, 'projects', projectId, 'messages', msg.id), {
                pinnedBy: isPinned ? null : currentUser.uid,
                pinnedAt: isPinned ? null : serverTimestamp()
            });
        } catch (err) {
            console.error("Error pinning message:", err);
        }
        setActiveMessageId(null);
    };

    // ── Reactions ───────────────────────────────────────────────────────
    const handleReaction = async (msg: ChatMessage, emoji: string) => {
        if (!currentUser) return;
        const reactions = { ...(msg.reactions || {}) };
        const users = reactions[emoji] || [];

        if (users.includes(currentUser.uid)) {
            reactions[emoji] = users.filter(uid => uid !== currentUser.uid);
            if (reactions[emoji].length === 0) delete reactions[emoji];
        } else {
            reactions[emoji] = [...users, currentUser.uid];
        }

        try {
            await updateDoc(doc(db, 'projects', projectId, 'messages', msg.id), { reactions });
        } catch (err) {
            console.error("Error adding reaction:", err);
        }
        setShowReactionPicker(null);
        setActiveMessageId(null);
    };

    // ── Start edit ──────────────────────────────────────────────────────
    const startEdit = (msg: ChatMessage) => {
        setEditingMessage(msg);
        setNewMessage(msg.text);
        setReplyingTo(null);
        setActiveMessageId(null);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    // ── Start reply ─────────────────────────────────────────────────────
    const startReply = (msg: ChatMessage) => {
        setReplyingTo(msg);
        setEditingMessage(null);
        setActiveMessageId(null);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const onEmojiClick = (emojiObject: any) => {
        setNewMessage(prev => prev + emojiObject.emoji);
    };

    const cancelEditReply = () => {
        setEditingMessage(null);
        setReplyingTo(null);
        setNewMessage('');
    };

    // ── Date separator helper ───────────────────────────────────────────
    const getDateLabel = (date: Date) => {
        if (isToday(date)) return 'Today';
        if (isYesterday(date)) return 'Yesterday';
        return format(date, 'MMMM d, yyyy');
    };

    // ── Render helpers ──────────────────────────────────────────────────
    const getSender = (uid: string) => members.find(m => m.uid === uid);

    // ── Escape fullscreen on Escape key ──────────────────────────────────
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullscreen]);

    if (loading) {
        return (
            <div className="h-[500px] flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/30 rounded-3xl border border-slate-200 dark:border-slate-800">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    // ── The chat content (shared between inline and fullscreen) ──────────
    const chatContent = (
        <div className={cn(
            "flex flex-col relative",
            isFullscreen
                ? "fixed inset-0 z-[9999] bg-white dark:bg-slate-950"
                : "h-[700px] glass-card rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl"
        )}>
            {/* ── Header ───────────────────────────────────────────── */}
            <div className="px-6 md:px-8 py-4 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        {isPersonal ? <UserIcon className="w-5 h-5 text-white" /> : <Smile className="w-5 h-5 text-white" />}
                    </div>
                    <div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                            {isPersonal ? 'Saved Messages' : 'Team Collaboration'}
                        </h3>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                {isPersonal ? 'Private Vault' : `${members.length} Members active`}
                            </p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400"
                    title={isFullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen'}
                >
                    {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
            </div>

            {/* ── Pinned Message Bar ────────────────────────────────── */}
            <AnimatePresence>
                {pinnedMessage && showPinnedBar && !pinnedMessage.isDeleted && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-b border-slate-100 dark:border-slate-800 bg-amber-50/80 dark:bg-amber-900/10 backdrop-blur-sm overflow-hidden shrink-0"
                    >
                        <div className="px-6 md:px-8 py-2.5 flex items-center gap-3">
                            <Pin className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                            <button
                                onClick={() => scrollToMessage(pinnedMessage.id)}
                                className="flex-1 min-w-0 text-left"
                            >
                                <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest">Pinned Message</p>
                                <p className="text-xs text-slate-700 dark:text-slate-300 truncate font-medium">
                                    {pinnedMessage.text || `📎 ${pinnedMessage.fileName || 'Media'}`}
                                </p>
                            </button>
                            <button
                                onClick={() => setShowPinnedBar(false)}
                                className="p-1 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Message Area ──────────────────────────────────────── */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-1 custom-scrollbar bg-gradient-to-b from-slate-50/50 to-slate-100/30 dark:from-slate-950/30 dark:to-slate-900/20"
            >
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                        <div className="w-20 h-20 rounded-full border-4 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center">
                            <Send className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-sm font-bold text-slate-500 max-w-[200px]">
                            {isPersonal ? 'Your private space for notes and files.' : 'Start the conversation with your team!'}
                        </p>
                    </div>
                ) : (
                    messages.map((msg, i) => {
                        const isMe = msg.senderId === currentUser?.uid;
                        const sender = getSender(msg.senderId);
                        const prevMsg = i > 0 ? messages[i - 1] : null;
                        const isFirstInGroup = !prevMsg || prevMsg.senderId !== msg.senderId;
                        const msgDate = msg.createdAt?.toDate?.();
                        const prevDate = prevMsg?.createdAt?.toDate?.();
                        const showDateSep = msgDate && (!prevDate || !isSameDay(msgDate, prevDate));

                        return (
                            <React.Fragment key={msg.id}>
                                {/* Date Separator */}
                                {showDateSep && msgDate && (
                                    <div className="flex items-center justify-center py-3">
                                        <span className="px-4 py-1 rounded-full bg-slate-200/80 dark:bg-slate-800/80 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest backdrop-blur-sm">
                                            {getDateLabel(msgDate)}
                                        </span>
                                    </div>
                                )}

                                {/* Message Bubble */}
                                <div
                                    ref={(el) => { if (el) messageRefs.current.set(msg.id, el); }}
                                    className={cn(
                                        "group flex items-end gap-2 transition-all rounded-2xl",
                                        isMe ? "flex-row-reverse" : "flex-row",
                                        isFirstInGroup ? "mt-4" : "mt-0.5"
                                    )}
                                    onMouseEnter={() => setActiveMessageId(msg.id)}
                                    onMouseLeave={() => { setActiveMessageId(null); setShowReactionPicker(null); }}
                                >
                                    {/* Avatar */}
                                    {!isMe ? (
                                        <div className="w-8 h-8 rounded-full shrink-0 mb-1">
                                            {isFirstInGroup ? (
                                                <ProfileAvatar size="sm" photoURL={sender?.photoURL} displayName={sender?.displayName || 'User'} />
                                            ) : <div className="w-8" />}
                                        </div>
                                    ) : <div className="w-8 shrink-0" />}

                                    <div className={cn("max-w-[75%] relative", isMe ? "items-end" : "items-start")}>
                                        {/* Sender Name */}
                                        {!isMe && isFirstInGroup && !isPersonal && (
                                            <p className="text-[10px] font-extrabold text-slate-400 mb-1 ml-3 uppercase tracking-wider">
                                                {sender?.displayName || 'Unknown'}
                                            </p>
                                        )}

                                        {/* Action Buttons (hover) */}
                                        <AnimatePresence>
                                            {activeMessageId === msg.id && !msg.isDeleted && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                    className={cn(
                                                        "absolute -top-8 z-30 flex items-center gap-0.5 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 px-1 py-0.5",
                                                        isMe ? "right-0" : "left-0"
                                                    )}
                                                >
                                                    <button onClick={() => startReply(msg)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors" title="Reply">
                                                        <Reply className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => setShowReactionPicker(showReactionPicker === msg.id ? null : msg.id)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors" title="React">
                                                        <Smile className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => handlePin(msg)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors" title={msg.pinnedBy ? "Unpin" : "Pin"}>
                                                        <Pin className="w-3.5 h-3.5" />
                                                    </button>
                                                    {isMe && msg.text && !msg.fileUrl && (
                                                        <button onClick={() => startEdit(msg)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors" title="Edit">
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                    {isMe && (
                                                        <button onClick={() => handleDelete(msg)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-400 transition-colors" title="Delete">
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Quick Reaction Picker */}
                                        <AnimatePresence>
                                            {showReactionPicker === msg.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 4, scale: 0.9 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 4, scale: 0.9 }}
                                                    className={cn(
                                                        "absolute -top-16 z-40 flex items-center gap-1 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 px-2 py-1.5",
                                                        isMe ? "right-0" : "left-0"
                                                    )}
                                                >
                                                    {QUICK_REACTIONS.map(emoji => (
                                                        <button
                                                            key={emoji}
                                                            onClick={() => handleReaction(msg, emoji)}
                                                            className="text-lg hover:scale-125 transition-transform p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                                                        >
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Bubble */}
                                        <div className={cn(
                                            "px-4 py-2.5 text-sm break-words relative",
                                            msg.isDeleted
                                                ? "bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 italic rounded-2xl"
                                                : isMe
                                                    ? cn("bg-blue-600 text-white shadow-sm shadow-blue-500/10",
                                                        isFirstInGroup ? "rounded-2xl rounded-br-sm" : "rounded-2xl rounded-br-sm")
                                                    : cn("bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm",
                                                        isFirstInGroup ? "rounded-2xl rounded-bl-sm" : "rounded-2xl rounded-bl-sm"),
                                            msg.pinnedBy && !msg.isDeleted && "ring-1 ring-amber-400/40"
                                        )}>
                                            {/* Pin badge */}
                                            {msg.pinnedBy && !msg.isDeleted && (
                                                <div className="flex items-center gap-1 mb-1">
                                                    <Pin className="w-3 h-3 text-amber-500" />
                                                    <span className={cn("text-[9px] font-bold uppercase tracking-widest", isMe ? "text-blue-200" : "text-amber-600 dark:text-amber-400")}>Pinned</span>
                                                </div>
                                            )}

                                            {/* Reply preview */}
                                            {msg.replyTo && !msg.isDeleted && (
                                                <button
                                                    onClick={() => scrollToMessage(msg.replyTo!.messageId)}
                                                    className={cn(
                                                        "w-full text-left mb-2 pl-3 py-1.5 rounded-lg border-l-[3px] text-xs",
                                                        isMe
                                                            ? "border-blue-300 bg-blue-700/40 text-blue-100"
                                                            : "border-blue-500 bg-blue-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300"
                                                    )}
                                                >
                                                    <p className="font-bold text-[10px] mb-0.5">{msg.replyTo.senderName}</p>
                                                    <p className="truncate opacity-80">{msg.replyTo.text}</p>
                                                </button>
                                            )}

                                            {/* Deleted state */}
                                            {msg.isDeleted ? (
                                                <p className="flex items-center gap-1.5 text-xs">
                                                    <Trash2 className="w-3 h-3" /> This message was deleted
                                                </p>
                                            ) : (
                                                <>
                                                    {/* Text */}
                                                    {msg.text && <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>}

                                                    {/* File attachments */}
                                                    {msg.fileUrl && (
                                                        <div className={cn(msg.text && "mt-2")}>
                                                            {msg.fileType?.startsWith('image/') ? (
                                                                <div className="relative group/img rounded-xl overflow-hidden">
                                                                    <img src={msg.fileUrl} alt={msg.fileName} className="max-w-full h-auto max-h-[300px] object-cover rounded-xl" />
                                                                    <button
                                                                        onClick={() => downloadFile(msg.fileUrl!, msg.fileName || 'image')}
                                                                        className="absolute bottom-2 right-2 opacity-0 group-hover/img:opacity-100 transition-opacity p-1.5 bg-black/50 hover:bg-black/70 rounded-lg text-white"
                                                                        title="Download image"
                                                                    >
                                                                        <Download className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            ) : msg.fileType?.startsWith('video/') ? (
                                                                <div className="relative rounded-xl overflow-hidden bg-black/5 dark:bg-black/20">
                                                                    <video
                                                                        src={msg.fileUrl}
                                                                        className="max-w-full max-h-[300px] rounded-xl"
                                                                        controls
                                                                        preload="metadata"
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => downloadFile(msg.fileUrl!, msg.fileName || 'file')}
                                                                    className={cn(
                                                                        "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                                                                        isMe ? "bg-blue-700/40 border-blue-400/30 hover:bg-blue-700/60" : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                                                                    )}
                                                                >
                                                                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", isMe ? "bg-blue-500/30" : "bg-slate-200 dark:bg-slate-700")}>
                                                                        <FileText className="w-5 h-5" />
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="text-xs font-bold truncate">{msg.fileName}</p>
                                                                        <p className="text-[10px] opacity-60">Click to download</p>
                                                                    </div>
                                                                    <Download className="w-4 h-4 opacity-60 shrink-0" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Timestamp + edited label */}
                                                    <div className={cn(
                                                        "mt-1 flex items-center gap-1.5 text-[9px] font-semibold opacity-50",
                                                        isMe ? "justify-end" : "justify-start"
                                                    )}>
                                                        {msg.editedAt && <span className="italic">edited</span>}
                                                        {msg.createdAt && format(msg.createdAt.toDate(), 'HH:mm')}
                                                        {isMe && (
                                                            <Check className="w-3 h-3 opacity-70" />
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Reactions */}
                                        {msg.reactions && Object.keys(msg.reactions).length > 0 && !msg.isDeleted && (
                                            <div className={cn("flex flex-wrap gap-1 mt-1", isMe ? "justify-end mr-1" : "justify-start ml-1")}>
                                                {Object.entries(msg.reactions).map(([emoji, users]) => (
                                                    <button
                                                        key={emoji}
                                                        onClick={() => handleReaction(msg, emoji)}
                                                        className={cn(
                                                            "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all",
                                                            users.includes(currentUser?.uid || '')
                                                                ? "bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                                                                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                                                        )}
                                                    >
                                                        <span>{emoji}</span>
                                                        <span className="font-bold text-[10px]">{users.length}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })
                )}
            </div>

            {/* ── Scroll to Bottom FAB ─────────────────────────────── */}
            <AnimatePresence>
                {showScrollBtn && (
                    <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        onClick={() => scrollToBottom()}
                        className="absolute bottom-32 right-6 z-30 w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        <ChevronDown className="w-5 h-5" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* ── Upload Progress Bar ──────────────────────────────── */}
            <AnimatePresence>
                {isUploading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="px-6 md:px-8 py-2 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-100 dark:border-blue-900/30 shrink-0"
                    >
                        <div className="flex items-center gap-3">
                            <Loader2 className="w-4 h-4 text-blue-500 animate-spin shrink-0" />
                            <div className="flex-1 h-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-blue-500 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${uploadProgress}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 tabular-nums">{uploadProgress}%</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Reply / Edit Bar ─────────────────────────────────── */}
            <AnimatePresence>
                {(replyingTo || editingMessage) && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-6 md:px-8 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/80 overflow-hidden shrink-0"
                    >
                        <div className="flex items-center gap-3 py-2.5">
                            <div className={cn(
                                "w-1 h-8 rounded-full shrink-0",
                                editingMessage ? "bg-amber-500" : "bg-blue-500"
                            )} />
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                                    {editingMessage ? '✏️ Editing message' : `↩ Replying to ${getSender(replyingTo!.senderId)?.displayName || 'Unknown'}`}
                                </p>
                                <p className="text-xs text-slate-500 truncate">
                                    {editingMessage ? editingMessage.text : (replyingTo?.text || `📎 ${replyingTo?.fileName || 'Media'}`)}
                                </p>
                            </div>
                            <button onClick={cancelEditReply} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Input Area ───────────────────────────────────────── */}
            <div className="px-4 md:px-8 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/80 shrink-0 relative">
                <form
                    onSubmit={handleSendMessage}
                    className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all"
                >
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="p-2.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500"
                        title="Attach file, photo, or video"
                    >
                        {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                    </button>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.7z"
                        className="hidden"
                    />

                    <div className="relative flex-1">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder={
                                editingMessage ? "Edit your message..." :
                                    isPersonal ? "Save a note or file..." : "Type a message..."
                            }
                            className="w-full bg-transparent py-2.5 px-2 text-sm outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                        />
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="p-2.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors text-amber-500"
                    >
                        <Smile className="w-5 h-5" />
                    </button>

                    <button
                        type="submit"
                        disabled={!newMessage.trim() && !isUploading}
                        className={cn(
                            "p-2.5 rounded-xl transition-all shadow-lg active:scale-90 text-white",
                            editingMessage
                                ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20 disabled:opacity-50"
                                : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20 disabled:opacity-50"
                        )}
                    >
                        {editingMessage ? <Check className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                    </button>
                </form>

                {/* Emoji picker - positioned relative to input area */}
                <AnimatePresence>
                    {showEmojiPicker && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-full right-4 mb-2 z-[100] shadow-2xl rounded-2xl overflow-hidden"
                        >
                            <EmojiPicker
                                theme={EmojiTheme.AUTO}
                                onEmojiClick={onEmojiClick}
                                skinTonesDisabled
                                searchPlaceholder="Search emoji..."
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );

    // When fullscreen, render via portal to escape parent layout constraints
    if (isFullscreen) {
        return ReactDOM.createPortal(chatContent, document.body);
    }

    return chatContent;
};

export default ChatSystem;
