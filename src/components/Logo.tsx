import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';


interface LogoProps {
    className?: string;
    collapsed?: boolean;
    animate?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className, collapsed = false, animate = true }) => {
    return (
        <Link
            to="/"
            className={cn("flex items-center gap-2 font-bold", className)}
            onClick={() => window.scrollTo(0, 0)}
        >
            <motion.div
                initial={animate ? { scale: 0.5, rotate: -180, opacity: 0 } : false}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    duration: 0.8
                }}
                className="relative flex items-center justify-center"
            >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/25 relative overflow-hidden group">
                    {/* Team Icon - Connected People */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white drop-shadow-md">
                        {/* Center person */}
                        <circle cx="12" cy="8" r="2.5" fill="currentColor" />
                        <path d="M12 11C9.5 11 8 12.5 8 14.5V16H16V14.5C16 12.5 14.5 11 12 11Z" fill="currentColor" />

                        {/* Left person */}
                        <circle cx="6" cy="9" r="2" fill="currentColor" fillOpacity="0.7" />
                        <path d="M6 11.5C4 11.5 3 12.8 3 14.5V16H6V14C6 12.8 6 12 6 11.5Z" fill="currentColor" fillOpacity="0.7" />

                        {/* Right person */}
                        <circle cx="18" cy="9" r="2" fill="currentColor" fillOpacity="0.7" />
                        <path d="M18 11.5C20 11.5 21 12.8 21 14.5V16H18V14C18 12.8 18 12 18 11.5Z" fill="currentColor" fillOpacity="0.7" />
                    </svg>

                    {/* Inner sheen */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                {/* Glow effect */}
                <div className="absolute inset-0 bg-blue-500/50 blur-lg rounded-full -z-10 opacity-40" />
            </motion.div>

            {!collapsed && (
                <motion.div
                    initial={animate ? { opacity: 0, x: -10 } : false}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="flex flex-col"
                >
                    <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-blue-800 to-slate-900 dark:from-white dark:via-blue-200 dark:to-white leading-none">
                        CrewSpace
                    </span>
                    {/*<span className="text-[0.6rem] font-semibold text-slate-500 dark:text-slate-400 tracking-widest uppercase ml-0.5">
                        by Barkot Labs
                    </span>*/}
                </motion.div>
            )}
        </Link>
    );
};

export default Logo;
