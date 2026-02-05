import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Menu, X, LogOut } from 'lucide-react';
import Logo from '../components/Logo';
import ProfileDropdown from '../components/ProfileDropdown';
import ProfileAvatar from '../components/ProfileAvatar';
import ThemeToggle from '../components/ThemeToggle';
import NotificationPanel from '../components/NotificationPanel';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

const SidebarLink = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
    <NavLink
        to={to}
        className={({ isActive }) => cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
            isActive
                ? "text-white bg-gradient-to-r from-blue-600 to-cyan-600 font-medium shadow-lg shadow-blue-500/25"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"
        )}
    >
        {({ isActive }) => (
            <>
                <Icon className={cn("w-5 h-5 transition-transform duration-300 group-hover:scale-110", isActive && "fill-current opacity-100")} />
                <span className="relative z-10">{label}</span>
                {!isActive && (
                    <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
            </>
        )}
    </NavLink>
);

const ProfileSidebarLink = ({ to }: { to: string }) => {
    const { currentUser } = useAuth();

    return (
        <NavLink
            to={to}
            className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group relative overflow-hidden",
                isActive
                    ? "text-white bg-gradient-to-r from-blue-600 to-cyan-600 font-medium shadow-lg shadow-blue-500/25"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            )}
        >
            {({ isActive }) => (
                <>
                    <ProfileAvatar
                        photoURL={currentUser?.photoURL}
                        displayName={currentUser?.displayName}
                        size="sm"
                        className={cn("ring-2 ring-transparent transition-all", isActive ? "ring-white/50" : "group-hover:ring-blue-500/30")}
                    />
                    <div className="flex flex-col min-w-0">
                        <span className="relative z-10 font-medium truncate">
                            {currentUser?.displayName || 'My Profile'}
                        </span>
                        <span className={cn(
                            "text-[10px] truncate transition-colors",
                            isActive ? "text-blue-100" : "text-slate-400"
                        )}>
                            Account Settings
                        </span>
                    </div>
                    {!isActive && (
                        <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                </>
            )}
        </NavLink>
    );
};

const AppLayout: React.FC = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    // Auto-close mobile menu on route change
    React.useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    return (
        <div className="flex min-h-screen bg-bg-secondary dark:bg-bg-primary transition-colors duration-300">
            {/* Desktop Sidebar */}
            <motion.aside
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="hidden lg:flex w-[260px] flex-col border-r border-border-color bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl fixed inset-y-0 z-40"
            >
                <div className="px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Logo />
                        <ThemeToggle />
                    </div>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2">
                    <div className="px-4 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Main
                    </div>
                    <SidebarLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" />

                    <div className="px-4 mt-8 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Settings
                    </div>
                    <ProfileSidebarLink to="/profile" />

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 mt-4 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all duration-300 group"
                    >
                        <LogOut className="w-5 h-5 transition-transform group-hover:scale-110" />
                        <span className="font-medium">Logout</span>
                    </button>
                </nav>

                <div className="p-4 border-t border-border-color bg-white/30 dark:bg-slate-900/30">
                    <div className="flex items-center gap-3 px-2">
                        <ProfileDropdown />
                    </div>
                </div>
            </motion.aside>

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 inset-x-0 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-border-color z-40 flex items-center justify-between px-4">
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600 dark:text-slate-300">
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
                <Logo collapsed animate={false} />
                <div className="flex items-center gap-2">
                    <NotificationPanel />
                    <ThemeToggle />
                    <ProfileDropdown />
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="lg:hidden fixed inset-0 top-16 bg-white dark:bg-slate-950 z-30 p-6 flex flex-col gap-4"
                    >
                        <SidebarLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                        <ProfileSidebarLink to="/profile" />
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="font-medium">Logout</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <main className="flex-1 lg:pl-[260px] pt-16 lg:pt-0 min-h-screen">
                <div className="max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AppLayout;
