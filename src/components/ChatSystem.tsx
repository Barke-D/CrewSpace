import React, { useState, useEffect, useRef } from 'react';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';
import {
    Send,
    File as FileIcon,
    Smile,
    Paperclip,
    Download,
    Loader2,
    User as UserIcon
} from 'lucide-react';
import EmojiPicker, { Theme as EmojiTheme } from 'emoji-picker-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import ProfileAvatar from './ProfileAvatar';

interface Message {
    id: string;
    text: string;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
    senderId: string;
    createdAt: Timestamp;
}

interface ChatSystemProps {
    projectId: string;
    members: User[];
    isPersonal?: boolean;
}

const ChatSystem: React.FC<ChatSystemProps> = ({ projectId, members, isPersonal }) => {
    const { currentUser } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [loading, setLoading] = useState(true);

    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!projectId) {
            console.error("💬 ChatSystem: No projectId provided");
            return;
        }

        console.log("💬 ChatSystem: Initializing listener for project:", projectId);

        const q = query(
            collection(db, 'projects', projectId, 'messages'),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            console.log(`💬 ChatSystem: Received ${snapshot.size} messages`);
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Message[];
            setMessages(msgs);
            setLoading(false);
            scrollToBottom();
        }, (err) => {
            console.error("❌ ChatSystem Firestore Error:", err);
            setLoading(false);
            // If it's a permission error, it might be due to missing indexes or rules
            if (err.code === 'permission-denied') {
                alert("Chat Error: Permission denied. Please check Firebase rules.");
            }
        });

        return () => {
            console.log("💬 ChatSystem: Cleaning up listener");
            unsubscribe();
        };
    }, [projectId]);

    const scrollToBottom = () => {
        setTimeout(() => {
            scrollRef.current?.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }, 100);
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if ((!newMessage.trim() && !isUploading) || !currentUser) return;

        const msgText = newMessage.trim();
        setNewMessage('');
        setShowEmojiPicker(false);

        try {
            await addDoc(collection(db, 'projects', projectId, 'messages'), {
                text: msgText,
                senderId: currentUser.uid,
                createdAt: serverTimestamp()
            });
        } catch (err) {
            console.error("Error sending message:", err);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !currentUser) return;

        setIsUploading(true);
        try {
            const fileRef = ref(storage, `projects/${projectId}/chats/${Date.now()}_${file.name}`);
            await uploadBytes(fileRef, file);
            const downloadUrl = await getDownloadURL(fileRef);

            await addDoc(collection(db, 'projects', projectId, 'messages'), {
                text: '',
                fileUrl: downloadUrl,
                fileName: file.name,
                fileType: file.type,
                senderId: currentUser.uid,
                createdAt: serverTimestamp()
            });
        } catch (err) {
            console.error("Error uploading file:", err);
            alert("Failed to upload file");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const onEmojiClick = (emojiObject: any) => {
        setNewMessage(prev => prev + emojiObject.emoji);
    };

    if (loading) {
        return (
            <div className="h-[500px] flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/30 rounded-3xl border border-slate-200 dark:border-slate-800">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[600px] glass-card rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        {isPersonal ? <UserIcon className="w-6 h-6 text-white" /> : <Smile className="w-6 h-6 text-white" />}
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
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
            </div>

            {/* Message Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-slate-50/30 dark:bg-slate-950/20"
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
                        const sender = members.find(m => m.uid === msg.senderId);
                        const isFirstInGroup = i === 0 || messages[i - 1].senderId !== msg.senderId;

                        return (
                            <motion.div
                                initial={{ opacity: 0, x: isMe ? 20 : -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                key={msg.id}
                                className={cn(
                                    "flex items-end gap-3",
                                    isMe ? "flex-row-reverse" : "flex-row"
                                )}
                            >
                                {!isMe && (
                                    <div className="w-8 h-8 rounded-full mb-1 flex-shrink-0 bg-slate-200 dark:bg-slate-800">
                                        {isFirstInGroup && (
                                            <ProfileAvatar size="sm" photoURL={sender?.photoURL} displayName={sender?.displayName || 'User'} />
                                        )}
                                    </div>
                                )}

                                <div className={cn(
                                    "max-w-[75%] space-y-1",
                                    isMe ? "items-end" : "items-start"
                                )}>
                                    {!isMe && isFirstInGroup && (
                                        <p className="text-[10px] font-black text-slate-400 mb-1 ml-2 uppercase tracking-wider">
                                            {sender?.displayName || 'Unknown Member'}
                                        </p>
                                    )}

                                    <div className={cn(
                                        "px-5 py-3 rounded-[1.5rem] text-sm break-words shadow-sm",
                                        isMe
                                            ? "bg-blue-600 text-white rounded-br-none shadow-blue-500/20"
                                            : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-none"
                                    )}>
                                        {msg.text && <p className="leading-relaxed">{msg.text}</p>}

                                        {msg.fileUrl && (
                                            <div className="space-y-2">
                                                {msg.fileType?.startsWith('image/') ? (
                                                    <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="block rounded-xl overflow-hidden hover:opacity-90 transition">
                                                        <img src={msg.fileUrl} alt={msg.fileName} className="max-w-full h-auto max-h-[300px] object-cover" />
                                                    </a>
                                                ) : (
                                                    <a
                                                        href={msg.fileUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={cn(
                                                            "flex items-center gap-3 p-3 rounded-xl border transition-all",
                                                            isMe ? "bg-blue-700 border-blue-500 hover:bg-blue-800" : "bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:bg-slate-100"
                                                        )}
                                                    >
                                                        <FileIcon className="w-5 h-5 flex-shrink-0" />
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs font-bold truncate">{msg.fileName}</p>
                                                            <p className="text-[10px] opacity-60">Click to download</p>
                                                        </div>
                                                        <Download className="w-4 h-4 opacity-60" />
                                                    </a>
                                                )}
                                            </div>
                                        )}

                                        <div className={cn(
                                            "mt-1.5 text-[9px] font-bold opacity-60 flex items-center gap-2",
                                            isMe ? "justify-end" : "justify-start"
                                        )}>
                                            {msg.createdAt && format(msg.createdAt.toDate(), 'HH:mm')}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })
                )}
            </div>

            {/* Input Area */}
            <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/80">
                <form
                    onSubmit={handleSendMessage}
                    className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-2 rounded-[2rem] border border-slate-200 dark:border-slate-800 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all"
                >
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="p-3 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"
                    >
                        {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                    </button>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                    />

                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder={isPersonal ? "Save a note or file..." : "Type a message..."}
                            className="w-full bg-transparent py-3 px-2 text-sm outline-none text-slate-900 dark:text-white"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                        />
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="p-3 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-amber-500"
                    >
                        <Smile className="w-5 h-5" />
                    </button>

                    <button
                        type="submit"
                        disabled={(!newMessage.trim() && !isUploading)}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-3 rounded-full transition-all shadow-lg shadow-blue-500/20 active:scale-90"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>

                <AnimatePresence>
                    {showEmojiPicker && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-24 right-8 z-[100] shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95"
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
};

export default ChatSystem;
