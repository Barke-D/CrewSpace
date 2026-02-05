import { User } from '../types';

export const checkProfileConstraints = (user: User | null): boolean => {
    if (!user) return false;

    // Required fields (bio is optional)
    const requiredFields: (keyof User)[] = ['username', 'groupNumber', 'school', 'major', 'year'];

    for (const field of requiredFields) {
        if (!user[field] || (typeof user[field] === 'string' && (user[field] as string).trim() === '')) {
            return false;
        }
    }

    return true;
};
