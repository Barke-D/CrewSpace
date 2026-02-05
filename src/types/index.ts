import { Timestamp } from 'firebase/firestore';

export interface User {
    uid: string;
    email: string;
    displayName: string | null;
    photoURL: string | null;
    username: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface Project {
    id: string;
    name: string;
    course: string;
    deadline: Timestamp;
    ownerId: string;
    members: string[]; // User UIDs
    inviteCode: string;
    type: 'personal' | 'team';
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface SubTask {
    id: string;
    title: string;
    status: 'todo' | 'done';
    deadline: Timestamp;
    assignedTo?: string; // Single user for sub-tasks
    completedAt?: Timestamp | null;
    isLate?: boolean;
}

export type TaskStatus = 'todo' | 'done';
export type TaskWeight = 'small' | 'medium' | 'large';

export interface Task {
    id: string;
    projectId: string;
    title: string;
    description: string;
    status: TaskStatus;
    weight: TaskWeight;
    deadline: Timestamp;
    assignedTo: string[]; // User UIDs
    completedBy?: string | null;
    completedAt?: Timestamp | null;
    isLate?: boolean;
    subTasks?: SubTask[];
    createdBy: string; // User UID who created the task
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface Attachment {
    url: string;
    name: string;
    version?: string;
}

export interface ContributionStats {
    uid: string;
    projectId: string;
    tasksAssigned: number;
    tasksCompleted: number;
    tasksLate: number;
    contributionScore: number; // 0-100 or weighted score
    isAtRisk: boolean;
}

export interface Activity {
    id: string;
    projectId: string;
    type: 'task_created' | 'task_completed' | 'task_late' | 'member_joined' | 'deadline_approaching';
    message: string;
    userId?: string;
    metadata?: any;
    createdAt: Timestamp;
}

export interface Notification {
    id: string;
    userId: string; // The recipient
    type: 'task_assigned' | 'subtask_assigned' | 'project_update' | 'mention';
    title: string;
    message: string;
    link?: string; // e.g., /projects/123?task=456
    read: boolean;
    createdAt: Timestamp;
}
