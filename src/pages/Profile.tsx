import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Loader2, Upload, User as UserIcon } from 'lucide-react';

import { User } from '../types';

// Omit fields that are managed elsewhere or system-generated
type ProfileFormData = Pick<User, 'bio' | 'school' | 'major' | 'year' | 'groupNumber' | 'photoURL' | 'username'>;


const Profile: React.FC = () => {
    const { currentUser, isGuest } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [profile, setProfile] = useState<ProfileFormData>({
        username: '',
        bio: '',
        school: '',
        major: '',
        year: '',
        groupNumber: '',
        photoURL: currentUser?.photoURL || ''
    });

    const [previewImage, setPreviewImage] = useState<string | null>(null);

    useEffect(() => {
        const loadProfile = async () => {
            if (!currentUser) {
                navigate('/login');
                return;
            }

            try {
                const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setProfile({
                        username: data.username || '',
                        bio: data.bio || '',
                        school: data.school || '',
                        major: data.major || '',
                        year: data.year || '',
                        groupNumber: data.groupNumber || '',
                        photoURL: data.photoURL || currentUser.photoURL || ''
                    });
                    setPreviewImage(data.photoURL || currentUser.photoURL || null);
                }
            } catch (error) {
                console.error("Error loading profile:", error);
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [currentUser, navigate]);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !currentUser) return;

        // GUEST MODE: Provide local preview only
        if (isGuest) {
            const localURL = URL.createObjectURL(file);
            setProfile(prev => ({ ...prev, photoURL: localURL }));
            setPreviewImage(localURL);
            return;
        }

        setUploading(true);
        try {
            // Create a reference to the storage location
            const storageRef = ref(storage, `profile-photos/${currentUser.uid}`);

            // Upload the file
            await uploadBytes(storageRef, file);

            // Get the download URL
            const photoURL = await getDownloadURL(storageRef);

            setProfile(prev => ({ ...prev, photoURL }));
            setPreviewImage(photoURL);

            console.log("✅ Photo uploaded successfully!");
        } catch (error: any) {
            console.error("❌ Photo upload failed:", error);
            // Provide specific helpful feedback
            if (error?.code === 'storage/unauthorized') {
                alert("Upload blocked by Firebase Security Rules. Please ensure you have applied the Storage Rules provided in the walkthrough.");
            } else {
                alert(`Upload failed: ${error?.message || "Please check your internet connection."}`);
            }
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        setSaving(true);
        try {
            await setDoc(doc(db, 'users', currentUser.uid), {
                ...profile,
                displayName: currentUser.displayName,
                email: currentUser.email,
                updatedAt: new Date()
            }, { merge: true });

            console.log("✅ Profile saved successfully!");
            alert("Profile updated successfully!");
            navigate('/dashboard');
        } catch (error) {
            console.error("❌ Save failed:", error);
            alert("Failed to save profile. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12 transition-colors">
            <div className="max-w-2xl mx-auto">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="text-slate-500 dark:text-gray-400 hover:text-blue-500 mb-6 text-sm"
                >
                    ← Back to Dashboard
                </button>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-lg">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Edit Profile</h1>

                    <form onSubmit={handleSave} className="space-y-6">
                        {/* Photo Upload */}
                        <div className="flex flex-col items-center">
                            <div className="relative mb-4">
                                {previewImage ? (
                                    <img
                                        src={previewImage}
                                        alt="Profile"
                                        className="w-32 h-32 rounded-full object-cover border-4 border-blue-500"
                                    />
                                ) : (
                                    <div className="w-32 h-32 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center border-4 border-slate-300 dark:border-slate-600">
                                        <UserIcon className="w-16 h-16 text-slate-400" />
                                    </div>
                                )}
                                {uploading && (
                                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                                    </div>
                                )}
                            </div>
                            <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                                <Upload className="w-4 h-4" />
                                Upload Photo
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                    disabled={uploading}
                                />
                            </label>
                        </div>

                        {/* Username */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                                Username <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={profile.username}
                                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                placeholder="e.g. user123"
                                required
                            />
                        </div>

                        {/* Bio */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                                Bio
                            </label>
                            <textarea
                                value={profile.bio}
                                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                rows={3}
                                placeholder="Tell us about yourself..."
                            />
                        </div>

                        {/* School */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                                School/University <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={profile.school}
                                onChange={(e) => setProfile({ ...profile, school: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                placeholder="e.g. MIT, Harvard"
                                required
                            />
                        </div>

                        {/* Major */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                                Major/Field of Study <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={profile.major}
                                onChange={(e) => setProfile({ ...profile, major: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                placeholder="e.g. Computer Science"
                                required
                            />
                        </div>

                        {/* Year */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                                Year <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={profile.year}
                                onChange={(e) => setProfile({ ...profile, year: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                required
                            >
                                <option value="">Select Year</option>
                                <option value="Freshman">Freshman</option>
                                <option value="Sophomore">Sophomore</option>
                                <option value="Junior">Junior</option>
                                <option value="Senior">Senior</option>
                                <option value="Graduate">Graduate</option>
                            </select>
                        </div>

                        {/* Group Number */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                                Group Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={profile.groupNumber}
                                onChange={(e) => setProfile({ ...profile, groupNumber: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                placeholder="e.g. 7"
                                required
                            />
                        </div>

                        {/* Save Button */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => navigate('/dashboard')}
                                className="flex-1 px-6 py-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-gray-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                Save Profile
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
