import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '../lib/utils';

export type AlertType = 'success' | 'error' | 'info';

interface CustomAlertProps {
    message: string;
    type: AlertType;
    isOpen: boolean;
    onClose: () => void;
}

const CustomAlert: React.FC<CustomAlertProps> = ({ message, type, isOpen, onClose }) => {
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(onClose, 5000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose]);

    const icons = {
        success: <CheckCircle2 className="w-6 h-6 text-emerald-500" />,
        error: <AlertCircle className="w-6 h-6 text-red-500" />,
        info: <Info className="w-6 h-6 text-blue-500" />
    };

    const backgrounds = {
        success: 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/20',
        error: 'bg-red-50/80 dark:bg-red-950/20 border-red-200/50 dark:border-red-800/20',
        info: 'bg-blue-50/80 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-800/20'
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className={cn(
                            "pointer-events-auto max-w-sm w-full p-6 rounded-[2rem] border backdrop-blur-xl shadow-2xl relative overflow-hidden",
                            backgrounds[type]
                        )}
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-current opacity-[0.03] blur-3xl -mr-16 -mt-16" />

                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm">
                                {icons[type]}
                            </div>
                            <div className="flex-1 min-w-0 pt-1">
                                <p className="text-slate-900 dark:text-white font-bold leading-tight">
                                    {type === 'error' ? 'Oops!' : type === 'success' ? 'Great!' : 'Note'}
                                </p>
                                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 font-medium leading-relaxed">
                                    {message}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={onClose}
                                className={cn(
                                    "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                    type === 'error' ? "bg-red-600 text-white hover:bg-red-700" :
                                        type === 'success' ? "bg-emerald-600 text-white hover:bg-emerald-700" :
                                            "bg-blue-600 text-white hover:bg-blue-700"
                                )}
                            >
                                Got it
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CustomAlert;
