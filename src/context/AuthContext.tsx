import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    loginAsGuest: () => void;
    logout: () => Promise<void>;
    isGuest: boolean;
}

const AuthContext = createContext<AuthContextType>({
    currentUser: null,
    loading: true,
    loginAsGuest: () => { },
    logout: async () => { },
    isGuest: false
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isGuest, setIsGuest] = useState(() => {
        return localStorage.getItem('isGuest') === 'true';
    });

    useEffect(() => {
        // If guest, don't listen to firebase
        if (isGuest) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, [isGuest]);

    const loginAsGuest = () => {
        // Create a mock user object conforming to Firebase User interface (partially)
        const guestUser = {
            uid: 'guest-dev-user-123',
            displayName: 'Guest Developer',
            email: 'guest@bmanager.app',
            photoURL: null,
            emailVerified: true,
            isAnonymous: true,
            metadata: {},
            providerData: [],
            refreshToken: '',
            tenantId: null,
            delete: async () => { },
            getIdToken: async () => 'mock-token',
            getIdTokenResult: async () => ({
                token: 'mock-token',
                signInProvider: 'custom',
                claims: {},
                authTime: Date.now().toString(),
                issuedAtTime: Date.now().toString(),
                expirationTime: (Date.now() + 3600000).toString(),
            }),
            reload: async () => { },
            toJSON: () => ({}),
            phoneNumber: null,
            providerId: 'custom'
        } as unknown as User;

        setIsGuest(true);
        localStorage.setItem('isGuest', 'true');
        setCurrentUser(guestUser);
    };

    const logout = async () => {
        if (isGuest) {
            setIsGuest(false);
            localStorage.removeItem('isGuest');
            setCurrentUser(null);
        } else {
            await firebaseSignOut(auth);
        }
    };

    const value = {
        currentUser,
        loading,
        loginAsGuest,
        logout,
        isGuest
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
