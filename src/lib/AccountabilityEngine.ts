import { Project, Task, User, ContributionStats, SubTask } from '../types';

export const DEFAULT_RULES = {
    missedDeadlinePenalty: 15,
    lateSubmissionPenalty: 5,
    contributionThreshold: 20 // percent
};

const WEIGHT_MULTIPLIERS: Record<string, number> = {
    'small': 1,
    'medium': 2,
    'large': 4
};

export class AccountabilityEngine {

    static calculateTaskScore(task: { weight?: string }, isLate: boolean): number {
        const weightKey = (task.weight || 'medium').toLowerCase();
        const multiplier = WEIGHT_MULTIPLIERS[weightKey] || 2;
        const baseScore = multiplier * 10;
        if (isLate) {
            return Math.max(0, baseScore * 0.5);
        }
        return baseScore;
    }

    static calculateMemberStats(
        memberId: string,
        tasks: Task[],
        project: Project
    ): ContributionStats {
        const atomicItems: (Task | SubTask)[] = [];

        tasks.forEach(task => {
            const hasSubTasks = task.subTasks && task.subTasks.length > 0;
            if (hasSubTasks) {
                task.subTasks!.forEach(st => {
                    if (st.assignedTo === memberId) {
                        atomicItems.push(st);
                    }
                });
            } else {
                if (task.assignedTo?.includes(memberId)) {
                    atomicItems.push(task);
                }
            }
        });

        const tasksAssigned = atomicItems.length;

        const isTaskLate = (t: Task | SubTask) => {
            if (t.isLate) return true;
            if (t.status === 'done' && t.completedAt && t.deadline) {
                return t.completedAt.toMillis() > t.deadline.toMillis();
            }
            return false;
        };

        const tasksCompleted = atomicItems.filter(item => item.status === 'done').length;
        const tasksLate = atomicItems.filter(item => isTaskLate(item)).length;

        let rawScore = 0;
        tasks.forEach(task => {
            const hasSubTasks = task.subTasks && task.subTasks.length > 0;
            const taskLate = isTaskLate(task);

            if (task.status === 'done') {
                if (!hasSubTasks && task.assignedTo?.includes(memberId)) {
                    rawScore += this.calculateTaskScore(task, taskLate);
                }
                if (task.completedBy === memberId) {
                    const isExtraHelp = !task.assignedTo?.includes(memberId);
                    const multiplier = hasSubTasks ? 0.1 : (isExtraHelp ? 1 : 0.2);
                    rawScore += this.calculateTaskScore(task, taskLate) * multiplier;
                }
            }

            task.subTasks?.forEach(st => {
                if (st.status === 'done' && st.assignedTo === memberId) {
                    const subLate = isTaskLate(st);
                    rawScore += subLate ? 2.5 : 5;
                }
            });
        });

        const completionRate = tasksAssigned > 0 ? (tasksCompleted / tasksAssigned) : 1;
        const isAtRisk = (tasksAssigned > 2 && completionRate < 0.4) || tasksLate > 2;

        return {
            uid: memberId,
            projectId: project.id,
            tasksAssigned,
            tasksCompleted,
            tasksLate,
            contributionScore: Math.round(rawScore),
            isAtRisk
        };
    }

    static generateProjectStats(project: Project, tasks: Task[], members: User[]) {
        const memberStats = members.map(m => this.calculateMemberStats(m.uid, tasks, project));
        const totalScore = memberStats.reduce((sum, s) => sum + s.contributionScore, 0);

        return memberStats.map(stat => ({
            ...stat,
            relativeContribution: totalScore > 0 ? Math.round((stat.contributionScore / totalScore) * 100) : 0
        }));
    }
}
