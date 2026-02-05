import React from 'react';
import { User } from 'lucide-react';

interface ProfileAvatarProps {
    photoURL?: string | null;
    displayName?: string | null;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
    photoURL,
    displayName,
    size = 'md',
    className = ''
}) => {
    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-16 h-16 text-xl'
    };

    const getInitials = () => {
        if (!displayName) return '?';
        const names = displayName.split(' ');
        if (names.length >= 2) {
            return `${names[0][0]}${names[1][0]}`.toUpperCase();
        }
        return displayName.substring(0, 2).toUpperCase();
    };

    if (photoURL) {
        return (
            <img
                src={photoURL}
                alt={displayName || 'User'}
                className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
            />
        );
    }

    return (
        <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-semibold text-white ${className}`}>
            {displayName ? getInitials() : <User className="w-1/2 h-1/2" />}
        </div>
    );
};

export default ProfileAvatar;
