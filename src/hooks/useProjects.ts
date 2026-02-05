import { useState, useEffect } from 'react';
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    Timestamp,
    QuerySnapshot,
    DocumentData
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Project } from '../types';

const GUEST_PROJECTS_KEY = 'guest_projects';

export const useProjects = () => {
    const { currentUser, isGuest } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!currentUser) {
            setProjects([]);
            setLoading(false);
            return;
        }

        // Set loading to true whenever user/mode changes to avoid "empty list" flash
        setLoading(true);

        if (isGuest) {
            const savedProjects = localStorage.getItem(GUEST_PROJECTS_KEY);
            let guestProjects: Project[] = [];

            if (savedProjects) {
                try {
                    // Convert stored timestamps back to objects
                    guestProjects = JSON.parse(savedProjects).map((p: any) => ({
                        ...p,
                        createdAt: p.createdAt ? new Timestamp(p.createdAt.seconds, p.createdAt.nanoseconds) : Timestamp.now(),
                        updatedAt: p.updatedAt ? new Timestamp(p.updatedAt.seconds, p.updatedAt.nanoseconds) : Timestamp.now(),
                        deadline: p.deadline ? new Timestamp(p.deadline.seconds, p.deadline.nanoseconds) : undefined,
                    }));
                } catch (e) {
                    console.error("Failed to parse guest projects", e);
                }
            }

            // If first time, add a demo
            if (guestProjects.length === 0) {
                guestProjects = [
                    {
                        id: 'mock-1',
                        name: 'Guest Demo Project',
                        course: 'DEMO 101',
                        ownerId: currentUser.uid,
                        members: [currentUser.uid],
                        inviteCode: 'guest-code',
                        type: 'team',
                        createdAt: Timestamp.now(),
                        updatedAt: Timestamp.now()
                    }
                ];
                localStorage.setItem(GUEST_PROJECTS_KEY, JSON.stringify(guestProjects));
            }

            setProjects(guestProjects);
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'projects'),
            where('members', 'array-contains', currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
            const projectsData = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            })) as Project[];

            projectsData.sort((a, b) => {
                const timeA = a.createdAt?.toMillis() || 0;
                const timeB = b.createdAt?.toMillis() || 0;
                return timeB - timeA;
            });

            setProjects(projectsData);
            setLoading(false);
        }, (err) => {
            console.error("❌ Firestore Subscription Error:", err);
            setError("Failed to fetch projects. Please check your connection.");
            setLoading(false);
        });

        return unsubscribe;
    }, [currentUser?.uid, isGuest]);

    const createProject = async (name: string, course: string, deadline?: Date, type: 'personal' | 'team' = 'team') => {
        if (!currentUser) return;

        const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        if (isGuest) {
            const newProject: Project = {
                id: `guest-${Date.now()}`,
                name,
                course,
                deadline: deadline ? Timestamp.fromDate(deadline) : undefined,
                ownerId: currentUser.uid,
                members: [currentUser.uid],
                inviteCode: 'guest-code',
                type,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            };

            const updatedProjects = [newProject, ...projects];
            setProjects(updatedProjects);
            localStorage.setItem(GUEST_PROJECTS_KEY, JSON.stringify(updatedProjects));
            return newProject.id;
        }

        // Real User Logic with Optimistic UI
        const tempId = `temp-${Date.now()}`;
        const optimisticProject: Project = {
            id: tempId,
            name,
            course,
            deadline: deadline ? Timestamp.fromDate(deadline) : undefined,
            ownerId: currentUser.uid,
            members: [currentUser.uid],
            inviteCode,
            type,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        };

        setProjects(prev => [optimisticProject, ...prev]);

        try {
            const projectData: any = {
                name,
                course,
                ownerId: currentUser.uid,
                members: [currentUser.uid],
                inviteCode,
                type,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            // Only add deadline if it is defined to avoid Firestore 'undefined' error
            if (deadline) {
                projectData.deadline = Timestamp.fromDate(deadline);
            }

            const docRef = await addDoc(collection(db, 'projects'), projectData);

            // The onSnapshot will take care of replacing the optimistic UI
            return docRef.id;
        } catch (err) {
            console.error("❌ Failed to save to Firestore:", err);
            setProjects(prev => prev.filter(p => p.id !== tempId));
            throw err;
        }
    };

    const deleteProject = async (projectId: string) => {
        if (!currentUser) return;

        if (isGuest) {
            const updatedProjects = projects.filter(p => p.id !== projectId);
            setProjects(updatedProjects);
            localStorage.setItem(GUEST_PROJECTS_KEY, JSON.stringify(updatedProjects));
            return;
        }

        try {
            await deleteDoc(doc(db, 'projects', projectId));
        } catch (err) {
            console.error("❌ Failed to delete project:", err);
            throw err;
        }
    };

    return { projects, loading, error, createProject, deleteProject };
};
