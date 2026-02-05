import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Globe, Zap, Shield, Sparkles, Calendar as CalendarIcon, PieChart, Layout, Users } from 'lucide-react';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import ProfileAvatar from '../components/ProfileAvatar';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { scrollY } = useScroll();

    // Smooth transitions for scroll-based effects
    const heroOpacity = useTransform(scrollY, [0, 200], [1, 0]);
    const heroScale = useTransform(scrollY, [0, 300], [1, 0.95]);

    const handleCTA = () => {
        navigate(currentUser ? '/dashboard' : '/login');
    };

    return (
        <div className="min-h-screen bg-white dark:bg-[#020617] text-slate-900 dark:text-slate-50 selection:bg-blue-500/20 selection:text-blue-600">
            {/* Soft Ambient Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[45%] bg-cyan-500/5 blur-[120px] rounded-full" />
            </div>

            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-[#020617]/70 backdrop-blur-xl transition-all duration-500">
                <div className="max-w-7xl mx-auto px-6 md:px-10 h-24 md:h-28 flex items-center justify-between">
                    <Logo />
                    <div className="flex items-center gap-6">
                        <ThemeToggle />
                        {currentUser ? (
                            <div
                                onClick={() => navigate('/dashboard')}
                                className="flex items-center gap-3 cursor-pointer group"
                            >
                                <div className="hidden sm:block text-right">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-none mb-1">
                                        {currentUser.displayName || 'Account'}
                                    </p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 group-hover:opacity-80 transition-opacity">
                                        Go to Workspace
                                    </p>
                                </div>
                                <ProfileAvatar
                                    photoURL={currentUser.photoURL}
                                    displayName={currentUser.displayName}
                                    className="border-2 border-slate-100 dark:border-slate-800 shadow-lg group-hover:scale-110 transition-transform"
                                />
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={handleCTA}
                                    className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors hidden sm:block"
                                >
                                    Log in
                                </button>
                                <button
                                    onClick={handleCTA}
                                    className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-black/5 dark:shadow-white/5"
                                >
                                    Get Started
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            <main className="pt-48 md:pt-56">
                {/* Hero Section */}
                <section className="max-w-7xl mx-auto px-6 mb-24 lg:mb-32">
                    <div
                        className="max-w-4xl mx-auto text-center space-y-10"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-black uppercase tracking-widest border border-blue-100 dark:border-blue-900/50"
                        >
                            <Sparkles className="w-3.5 h-3.5" /> Built by Barkot, for You
                        </motion.div>

                        <h1 className="text-4xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] text-slate-900 dark:text-white">
                            Group projects, <br />
                            <span className="text-blue-600 dark:text-blue-400">without the freeloading.</span>
                        </h1>

                        <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed font-bold">
                            I built CrewSpace for students and teams who are tired of carrying the work alone.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-10">
                            <button
                                onClick={handleCTA}
                                className="group w-full sm:w-auto px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-2xl shadow-blue-600/30 hover:bg-blue-500 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center justify-center gap-3"
                            >
                                Start Building Now
                                <ArrowRight className="w-6 h-6 group-hover:translate-x-1.5 transition-transform" />
                            </button>
                            <button
                                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                                className="w-full sm:w-auto px-10 py-5 border-2 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-black text-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-center"
                            >
                                See How It Works
                            </button>
                        </div>
                    </div>
                </section>

                {/* Sub-Hero / Problem Statement */}
                <section id="how-it-works" className="py-24 md:py-32 bg-slate-50 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800 scroll-mt-28">
                    <div className="max-w-4xl mx-auto px-6 text-center space-y-12">
                        <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white leading-tight">
                            Project management shouldn’t feel like babysitting.
                        </h2>
                        <div className="space-y-8 text-xl md:text-2xl text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                            <p>
                                Most tools help you organize tasks — but they fail at what actually breaks group projects: <br className="hidden md:block" />
                                <span className="text-slate-900 dark:text-white font-black underline decoration-blue-500 decoration-4 underline-offset-8 text-2xl md:text-3xl">unclear ownership, missed deadlines, and invisible effort.</span>
                            </p>
                            <p className="bg-white dark:bg-slate-950 p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl italic relative">
                                <span className="absolute -top-6 left-1/2 -translate-x-1/2 px-6 py-2 bg-blue-600 text-white text-xs font-black uppercase tracking-[0.3em] rounded-full shadow-lg">The Vision</span>
                                "I built CrewSpace because I was tired of guessing who was working, who wasn’t, and why projects always fell apart at the last minute."
                            </p>
                            <p className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white">
                                I replaced <span className="text-blue-600">assumptions</span> with <span className="text-blue-600">data</span>.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Core Philosophy */}
                <section className="py-24 md:py-32">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-16 md:mb-20 space-y-6">
                            <span className="text-blue-600 font-black uppercase text-xs tracking-[0.3em] block">Our Foundation</span>
                            <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white">
                                Built on three principles I care about
                            </h2>
                            <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium">
                                I didn't make CrewSpace feature-heavy on purpose. <br className="hidden md:block" />
                                It focuses on what actually makes teams work.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                {
                                    title: "Accountability",
                                    desc: "Everyone knows who owns what — and the system keeps the record.",
                                    icon: Shield,
                                    color: "blue"
                                },
                                {
                                    title: "Velocity",
                                    desc: "Progress isn’t just tracked, it’s measured against time and deadlines.",
                                    icon: Zap,
                                    color: "amber"
                                },
                                {
                                    title: "Clarity",
                                    desc: "No noise. No distractions. Just the work that matters.",
                                    icon: Sparkles,
                                    color: "emerald"
                                }
                            ].map((item, i) => (
                                <div key={i} className="group p-8 md:p-12 rounded-[2.5rem] md:rounded-[3rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:border-blue-500/30 transition-all duration-500">
                                    <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-${item.color}-100 dark:bg-${item.color}-900/30 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                                        <item.icon className={`w-7 h-7 md:w-8 md:h-8 text-${item.color}-600 dark:text-${item.color}-400`} />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4">{item.title}</h3>
                                    <p className="text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="py-24 md:py-32 bg-slate-50/50 dark:bg-slate-900/30 border-y border-slate-200 dark:border-slate-800">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { title: "Clear Roles", desc: "Every task has an owner", icon: Users },
                                { title: "Deadline Enforcement", desc: "Late is late, automatically", icon: CalendarIcon },
                                { title: "Contribution Tracking", desc: "See who actually delivered", icon: PieChart },
                                { title: "Team Sync", desc: "Everyone aligned, no reminders needed", icon: Globe },
                                { title: "Secure Data", desc: "Immutable, transparent records", icon: Shield },
                                { title: "Barkot Approved", desc: "Built for real-world execution", icon: Zap }
                            ].map((feature, i) => (
                                <div key={i} className="flex items-start gap-5 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all">
                                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 shrink-0">
                                        <feature.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-black text-slate-900 dark:text-white mb-1">{feature.title}</h4>
                                        <p className="text-slate-500 dark:text-slate-400 font-medium">{feature.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Accountability Section */}
                <section className="py-24 md:py-32 overflow-hidden">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div className="space-y-8">
                                <span className="text-blue-600 font-black uppercase text-xs tracking-[0.3em] block">Key Differentiator</span>
                                <h2 className="text-4xl md:text-7xl font-black text-slate-900 dark:text-white leading-tight">
                                    Accountability that feels fair — not awkward.
                                </h2>
                                <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                    I don't believe in spying on people. <br className="hidden md:block" />
                                    I believe in measuring outcomes.
                                </p>
                                <div className="space-y-6">
                                    <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">I track contribution scores based on facts:</p>
                                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {[
                                            "Tasks assigned",
                                            "Tasks completed",
                                            "Deadlines respected",
                                            "Late or overdue work"
                                        ].map((item, i) => (
                                            <li key={i} className="flex items-center gap-3 font-bold text-slate-700 dark:text-slate-200">
                                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="p-8 rounded-[2rem] bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
                                    <p className="text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                                        When someone falls behind, CrewSpace flags them as <span className="text-red-600 dark:text-red-400 font-black">“At Risk”</span> — automatically, objectively, and visibly.
                                    </p>
                                </div>
                                <p className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
                                    No confrontations. No guesswork. Just facts.
                                </p>
                                <p className="text-lg font-bold text-blue-600">I built this because group work should be fair.</p>
                            </div>

                            <div className="relative group">
                                {/* Visual Representation: The "Accountability Engine" Graph */}
                                <div className="p-1 rounded-[3.5rem] bg-gradient-to-br from-blue-500/20 to-cyan-500/20 shadow-2xl backdrop-blur-sm">
                                    <div className="bg-slate-900 dark:bg-slate-950 rounded-[3.3rem] aspect-video md:aspect-[16/10] relative overflow-hidden group-hover:shadow-[0_0_100px_rgba(59,130,246,0.2)] transition-all duration-700 p-8 md:p-12 flex flex-col justify-between">
                                        {/* Mesh Gradient Background */}
                                        <div className="absolute inset-0 opacity-40">
                                            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_30%,_rgba(59,130,246,0.4),_transparent_60%)]" />
                                            <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_70%,_rgba(6,182,212,0.3),_transparent_60%)]" />
                                        </div>

                                        <div className="relative z-10 flex justify-between items-start">
                                            <div className="space-y-4">
                                                {[
                                                    { name: "Teammate A", score: 85, status: "Solid", w: "w-[85%]" },
                                                    { name: "Teammate B", score: 42, status: "At Risk", w: "w-[42%]", color: "bg-red-500" },
                                                    { name: "Teammate C", score: 20, status: "At Risk", w: "w-[20%]", color: "bg-red-600" }
                                                ].map((t, i) => (
                                                    <div key={i} className="space-y-1.5 min-w-[200px] md:min-w-[280px]">
                                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/60">
                                                            <span>{t.name}</span>
                                                            <span className={t.color ? 'text-red-400' : 'text-blue-400'}>{t.score}%</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                whileInView={{ width: `${t.score}%` }}
                                                                transition={{ duration: 1, delay: i * 0.2 }}
                                                                className={`h-full ${t.color || 'bg-blue-600'}`}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex gap-2">
                                                {[1, 2].map(i => (
                                                    <div key={i} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10" />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Dynamic Bar Chart Animation */}
                                        <div className="relative z-10 flex-1 mt-10 flex items-end gap-1.5">
                                            {[40, 60, 45, 75, 55, 90, 65, 80, 50, 70, 85, 95, 60, 40].map((h, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ height: 0 }}
                                                    whileInView={{ height: `${h}%` }}
                                                    transition={{ delay: i * 0.05, duration: 1, ease: "easeOut" }}
                                                    className="flex-1 bg-gradient-to-t from-blue-600/50 to-cyan-400/80 rounded-t-sm"
                                                />
                                            ))}
                                        </div>

                                        <motion.div
                                            initial={{ opacity: 0, x: 20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.8 }}
                                            className="absolute top-1/2 right-4 md:right-12 glass-panel p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/20 shadow-2xl backdrop-blur-2xl"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-blue-600 flex items-center justify-center">
                                                    <Zap className="w-5 h-5 md:w-6 md:h-6 text-white" />
                                                </div>
                                                <div>
                                                    <p className="text-[8px] md:text-[10px] font-black tracking-widest text-white/40 uppercase">Velocity</p>
                                                    <p className="text-xl md:text-2xl font-black text-white">+12.4%</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Analytics Section */}
                <section className="py-24 md:py-32 bg-slate-900 text-white overflow-hidden relative">
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_30%,_rgba(59,130,246,0.3),_transparent_60%)]" />
                    </div>
                    <div className="max-w-7xl mx-auto px-6 relative z-10">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div className="order-2 lg:order-1">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="aspect-square bg-white/5 rounded-2xl md:rounded-3xl border border-white/10 p-6 md:p-8 flex flex-col justify-between hover:bg-white/10 transition-colors group">
                                        <PieChart className="w-8 h-8 md:w-10 md:h-10 text-blue-400 group-hover:scale-110 transition-transform" />
                                        <p className="text-sm md:text-base font-black opacity-60">Contribution Breakdowns</p>
                                    </div>
                                    <div className="aspect-square bg-white/5 rounded-2xl md:rounded-3xl border border-white/10 p-6 md:p-8 flex flex-col justify-between translate-y-6 md:translate-y-8 hover:bg-white/10 transition-colors group">
                                        <Layout className="w-8 h-8 md:w-10 md:h-10 text-emerald-400 group-hover:scale-110 transition-transform" />
                                        <p className="text-sm md:text-base font-black opacity-60">Task Completion Comparisons</p>
                                    </div>
                                    <div className="aspect-square bg-white/5 rounded-2xl md:rounded-3xl border border-white/10 p-6 md:p-8 flex flex-col justify-between hover:bg-white/10 transition-colors group">
                                        <Zap className="w-8 h-8 md:w-10 md:h-10 text-amber-400 group-hover:scale-110 transition-transform" />
                                        <p className="text-sm md:text-base font-black opacity-60">On-time vs Late Performance</p>
                                    </div>
                                    <div className="aspect-square bg-white/5 rounded-2xl md:rounded-3xl border border-white/10 p-6 md:p-8 flex flex-col justify-between translate-y-6 md:translate-y-8 hover:bg-white/10 transition-colors group">
                                        <Users className="w-8 h-8 md:w-10 md:h-10 text-cyan-400 group-hover:scale-110 transition-transform" />
                                        <p className="text-sm md:text-base font-black opacity-60">Mini Performance Reports</p>
                                    </div>
                                </div>
                            </div>
                            <div className="order-1 lg:order-2 space-y-8">
                                <span className="text-blue-400 font-black uppercase text-xs tracking-[0.3em] block">Real-time Insights</span>
                                <h2 className="text-4xl md:text-7xl font-black leading-tight">
                                    See the truth, instantly.
                                </h2>
                                <p className="text-xl md:text-2xl text-slate-400 font-medium leading-relaxed">
                                    I designed CrewSpace to turn project data into clear visuals. You don’t need meetings to understand what’s happening. The dashboard tells you everything.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Calendar & Flow Section */}
                <section className="py-24 md:py-32">
                    <div className="max-w-7xl mx-auto px-6 text-center space-y-16">
                        <div className="space-y-6">
                            <span className="text-blue-600 font-black uppercase text-xs tracking-[0.3em] block">No Excuses</span>
                            <h2 className="text-4xl md:text-7xl font-black text-slate-900 dark:text-white leading-tight">
                                Deadlines you can’t ignore.
                            </h2>
                            <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 font-medium max-w-3xl mx-auto">
                                When work has a place in time, your team moves faster — and the excuses disappear.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                            {[
                                { title: "Upcoming Deadlines", icon: CalendarIcon, color: "blue" },
                                { title: "Due Today", icon: Zap, color: "amber" },
                                { title: "Overdue Work", icon: Shield, color: "red" }
                            ].map((item, i) => (
                                <div key={i} className="p-8 md:p-12 rounded-[2rem] md:rounded-[2.5rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:scale-[1.02] transition-transform">
                                    <item.icon className={`w-10 h-10 md:w-12 md:h-12 text-${item.color}-500 mb-6 md:mb-8 mx-auto`} />
                                    <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">{item.title}</h3>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Team Sync Section - RESTORING CHAT BUBBLES ANIMATION */}
                <section className="py-24 md:py-32 bg-slate-50 dark:bg-slate-950/50 border-y border-slate-200 dark:border-slate-800">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div className="space-y-8">
                                <span className="text-cyan-600 font-black uppercase text-xs tracking-[0.3em] block">Real-time Unity</span>
                                <h2 className="text-4xl md:text-7xl font-black text-slate-900 dark:text-white leading-tight">
                                    Team Sync that <br className="hidden md:block" /> actually works.
                                </h2>
                                <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                    Everyone is aligned, no reminders needed. I built communication directly into the workflow so you never have to guess who's doing what.
                                </p>
                            </div>
                            <div className="relative group">
                                {/* Visual Representation: The "Collaboration" Chat Bubbles */}
                                <div className="glass-panel p-8 md:p-12 rounded-[3.5rem] border border-cyan-500/10 shadow-2xl relative overflow-hidden bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl">
                                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5" />

                                    <div className="space-y-6 relative z-10">
                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            className="flex items-end gap-3"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 shrink-0" />
                                            <div className="p-4 rounded-2xl rounded-bl-none bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm max-w-[80%]">
                                                <div className="h-2 w-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-2" />
                                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full" />
                                            </div>
                                        </motion.div>

                                        <motion.div
                                            initial={{ opacity: 0, x: 20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.2 }}
                                            className="flex items-end gap-3 justify-end"
                                        >
                                            <div className="p-4 rounded-2xl rounded-br-none bg-blue-600 text-white shadow-lg shadow-blue-600/20 max-w-[80%]">
                                                <div className="h-2 w-24 bg-white/20 rounded-full mb-2" />
                                                <div className="flex gap-1">
                                                    <div className="h-2 w-full bg-white/10 rounded-full" />
                                                    <div className="h-2 w-12 bg-white/10 rounded-full" />
                                                </div>
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shrink-0" />
                                        </motion.div>

                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            whileInView={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.4 }}
                                            className="p-6 rounded-3xl bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-100 dark:border-cyan-800 flex items-center gap-4 group-hover:translate-y-[-5px] transition-transform duration-500"
                                        >
                                            <div className="w-12 h-12 rounded-xl bg-cyan-500 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/20">
                                                <Globe className="w-6 h-6 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="h-2 w-32 bg-cyan-600 dark:bg-cyan-400 rounded-full mb-2" />
                                                <div className="h-2 w-full bg-cyan-200 dark:bg-cyan-900/40 rounded-full" />
                                            </div>
                                        </motion.div>
                                    </div>
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full border-[40px] border-white/5 dark:border-white/2 rounded-full pointer-events-none" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Builder Story Section */}
                <section className="py-24 md:py-32 bg-blue-600 text-white overflow-hidden">
                    <div className="max-w-5xl mx-auto px-6">
                        <div className="grid md:grid-cols-2 gap-16 items-center">
                            <div className="space-y-8">
                                <h2 className="text-4xl md:text-7xl font-black leading-tight">
                                    Why I built <br /> CrewSpace
                                </h2>
                                <div className="space-y-6 text-xl md:text-2xl opacity-90 font-medium leading-relaxed">
                                    <p>
                                        I’m Barkot Desalegn Shetie, and like many of you, I’ve been in groups where:
                                    </p>
                                    <ul className="space-y-4">
                                        <li className="flex items-center gap-4"><div className="w-2.5 h-2.5 rounded-full bg-white shrink-0" /> A few people carried the whole project</li>
                                        <li className="flex items-center gap-4"><div className="w-2.5 h-2.5 rounded-full bg-white shrink-0" /> Deadlines slipped without a word</li>
                                        <li className="flex items-center gap-4"><div className="w-2.5 h-2.5 rounded-full bg-white shrink-0" /> Accountability turned into personal conflict</li>
                                    </ul>
                                    <p className="pt-4 font-bold">
                                        CrewSpace is my answer. It’s not about control. It’s about fairness, clarity, and execution.
                                    </p>
                                </div>
                            </div>
                            <div className="aspect-[4/5] bg-white/10 rounded-[2.5rem] md:rounded-[3rem] border border-white/20 flex items-center justify-center p-8 md:p-12 text-center group">
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                >
                                    <p className="text-2xl md:text-4xl font-black mb-6 leading-tight">"I built this for the teams who actually show up."</p>
                                    <p className="text-xs md:text-sm font-black uppercase tracking-[0.3em] opacity-60">— Barkot Desalegn Shetie</p>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Call To Action */}
                <section className="py-24 px-6">
                    <div className="max-w-4xl mx-auto glass-card rounded-[3rem] p-10 md:p-20 text-center border-none shadow-2xl shadow-blue-600/10 relative overflow-hidden bg-slate-50 dark:bg-white/5 backdrop-blur-xl">
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/10 blur-[100px] rounded-full -z-10" />
                        <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-8 leading-tight">
                            Build with confidence. <br /> Execute with clarity.
                        </h2>
                        <p className="text-xl text-slate-500 dark:text-slate-400 mb-12 max-w-2xl mx-auto font-medium">
                            Join teams who want their work — and effort — to actually count.
                        </p>
                        <div className="flex flex-col items-center gap-6">
                            <button
                                onClick={handleCTA}
                                className="w-full sm:w-auto px-12 py-6 bg-blue-600 text-white rounded-2xl font-black text-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-600/25"
                            >
                                Start Your Project
                            </button>
                            <div className="space-y-2">
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No credit card. Just accountability.</p>
                                <p className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-tighter">
                                    Available on Web <span className="opacity-40 ml-2">(Mobile coming soon)</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="py-24 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
                        <div className="col-span-1 md:col-span-2 space-y-8">
                            <Logo />
                            <div className="space-y-4">
                                <p className="text-lg font-black text-slate-900 dark:text-white">Designed and built by Barkot Desalegn Shetie</p>
                                <p className="text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed font-bold">
                                    CrewSpace is a product of Barkot Labs, focused on tools that respect effort and reward execution.
                                </p>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <h4 className="font-black text-xs uppercase tracking-[0.3em] text-blue-600">Product</h4>
                            <ul className="space-y-4 text-sm font-bold text-slate-500 dark:text-slate-400">
                                <li className="hover:text-blue-600 transition-colors cursor-pointer">Features</li>
                                <li className="hover:text-blue-600 transition-colors opacity-50 cursor-not-allowed">Pricing (Coming Soon)</li>
                                <li className="hover:text-blue-600 transition-colors cursor-pointer">Beta Program</li>
                            </ul>
                        </div>
                        <div className="space-y-6">
                            <h4 className="font-black text-xs uppercase tracking-[0.3em] text-blue-600">Legal</h4>
                            <ul className="space-y-4 text-sm font-bold text-slate-500 dark:text-slate-400">
                                <li className="hover:text-blue-600 transition-colors cursor-pointer">Privacy Policy</li>
                                <li className="hover:text-blue-600 transition-colors cursor-pointer">Terms of Service</li>
                                <li className="hover:text-blue-600 transition-colors cursor-pointer">Security</li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-12 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white">B</div>
                            <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Barkot Labs</p>
                        </div>
                        <p className="text-xs text-slate-400 font-black uppercase tracking-widest">
                            &copy; 2026 CrewSpace. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
