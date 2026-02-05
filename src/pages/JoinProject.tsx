import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, updateDoc, doc, arrayUnion, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { checkProfileConstraints } from '../utils/profileUtils';
import { User } from '../types';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const JoinProject: React.FC = () => {
    const { inviteCode } = useParams<{ inviteCode: string }>();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const joinProject = async () => {
            if (!currentUser) {
                setStatus('error');
                setMessage('You must be logged in to join a project');
                return;
            }

            if (!inviteCode) {
                setStatus('error');
                setMessage('Invalid invite link');
                return;
            }

            // Check profile constraints
            try {
                const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data() as User;
                    if (!checkProfileConstraints(userData)) {
                        alert("Please complete your profile first!");
                        navigate('/profile');
                        return;
                    }
                } else {
                    // No profile doc implies incomplete profile
                    alert("Please complete your profile first!");
                    navigate('/profile');
                    return;
                }
            } catch (err) {
                console.error("Error checking profile:", err);
                // Continue or fail? safely fail
                setStatus('error');
                setMessage('Failed to verify profile.');
                return;
            }

            try {
                console.log("🔍 Looking for project with invite code:", inviteCode);

                // Find project with this invite code
                const projectsRef = collection(db, 'projects');
                const q = query(projectsRef, where('inviteCode', '==', inviteCode));
                const querySnapshot = await getDocs(q);

                if (querySnapshot.empty) {
                    setStatus('error');
                    setMessage('Project not found. This invite link may be invalid.');
                    return;
                }

                const projectDoc = querySnapshot.docs[0];
                const projectData = projectDoc.data();

                // Check if already a member
                if (projectData.members.includes(currentUser.uid)) {
                    console.log("✅ Already a member, redirecting...");
                    setStatus('success');
                    setMessage('You are already a member of this project!');
                    setTimeout(() => navigate(`/project/${projectDoc.id}`), 1500);
                    return;
                }

                // Add user to members
                console.log("➕ Adding user to project members...");
                await updateDoc(doc(db, 'projects', projectDoc.id), {
                    members: arrayUnion(currentUser.uid)
                });

                console.log("✅ Successfully joined project!");
                setStatus('success');
                setMessage(`You've joined "${projectData.name}"!`);
                setTimeout(() => navigate(`/project/${projectDoc.id}`), 1500);

            } catch (error: any) {
                console.error("❌ Error joining project:", error);
                setStatus('error');
                // Show actual error message if it's permission related
                if (error.code === 'permission-denied') {
                    setMessage('Permission denied. Please check your connection or try again.');
                } else {
                    setMessage(error.message || 'Failed to join project. Please try again.');
                }
            }
        };

        joinProject();
    }, [inviteCode, currentUser, navigate]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors">
            <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
                {status === 'loading' && (
                    <>
                        <Loader2 className="w-16 h-16 mx-auto mb-4 text-blue-500 animate-spin" />
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Joining Project...</h2>
                        <p className="text-slate-500 dark:text-gray-400">Please wait while we add you to the project</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Success!</h2>
                        <p className="text-slate-600 dark:text-gray-400">{message}</p>
                        <p className="text-sm text-slate-500 dark:text-gray-500 mt-4">Redirecting you to the project...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                            <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Oops!</h2>
                        <p className="text-slate-600 dark:text-gray-400 mb-6">{message}</p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => navigate('/login')}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                Login
                            </button>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="px-6 py-2 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition"
                            >
                                Dashboard
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default JoinProject;
