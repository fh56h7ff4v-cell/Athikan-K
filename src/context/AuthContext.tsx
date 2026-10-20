import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  isMember: boolean;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, pass: string, displayName: string) => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfileData: (data: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Bootstrapped administrator emails
const BOOTSTRAP_ADMIN_EMAILS = [
  's6710380123@pkru.ac.th',
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync profile from Firestore or bootstrap
  const fetchOrCreateProfile = async (firebaseUser: User): Promise<UserProfile> => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const path = `users/${firebaseUser.uid}`;

    try {
      const docSnap = await getDoc(userDocRef);
      const isBootstrapAdmin = BOOTSTRAP_ADMIN_EMAILS.includes((firebaseUser.email || '').toLowerCase());

      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        // If email is in bootstrap list but role is not admin, ensure admin privilege
        if (isBootstrapAdmin && data.role !== 'admin') {
          const elevatedProfile: UserProfile = {
            ...data,
            role: 'admin',
            updatedAt: new Date().toISOString(),
          };
          try {
            await updateDoc(userDocRef, { role: 'admin', updatedAt: elevatedProfile.updatedAt });
            // Also ensure in admins collection
            await setDoc(doc(db, 'admins', firebaseUser.uid), {
              email: firebaseUser.email,
              grantedAt: new Date().toISOString()
            }, { merge: true });
          } catch (e) {
            console.warn('Could not auto-sync admin doc:', e);
          }
          return elevatedProfile;
        }
        return data;
      } else {
        // Create new user profile document
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'ผู้ใช้งาน',
          photoURL: firebaseUser.photoURL || '',
          role: isBootstrapAdmin ? 'admin' : 'member',
          status: 'active',
          bio: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await setDoc(userDocRef, newProfile);

        if (isBootstrapAdmin) {
          try {
            await setDoc(doc(db, 'admins', firebaseUser.uid), {
              email: firebaseUser.email,
              grantedAt: new Date().toISOString()
            });
          } catch (e) {
            console.warn('Could not write admins document:', e);
          }
        }

        return newProfile;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  };

  const refreshProfile = async () => {
    if (auth.currentUser) {
      const p = await fetchOrCreateProfile(auth.currentUser);
      setUserProfile(p);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const profile = await fetchOrCreateProfile(currentUser);
          setUserProfile(profile);
        } catch (err) {
          console.error('Error fetching user profile:', err);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    if (result.user) {
      const profile = await fetchOrCreateProfile(result.user);
      setUserProfile(profile);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, displayName: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    if (userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
      // Send real email verification
      try {
        await sendEmailVerification(userCredential.user);
      } catch (err) {
        console.warn('Email verification send issue:', err);
      }
      const profile = await fetchOrCreateProfile(userCredential.user);
      setUserProfile(profile);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    if (userCredential.user) {
      const profile = await fetchOrCreateProfile(userCredential.user);
      setUserProfile(profile);
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const resendVerificationEmail = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setUserProfile(null);
  };

  const updateUserProfileData = async (data: Partial<UserProfile>) => {
    if (!user || !userProfile) throw new Error('กรุณาเข้าสู่ระบบก่อนทำรายการ');
    const path = `users/${user.uid}`;
    try {
      const updated = {
        ...data,
        updatedAt: new Date().toISOString(),
      };
      await updateDoc(doc(db, 'users', user.uid), updated);
      if (data.displayName && auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: data.displayName });
      }
      setUserProfile(prev => (prev ? { ...prev, ...updated } : null));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const role = userProfile?.role || 'guest';
  const isBootstrapAdmin = user?.email && BOOTSTRAP_ADMIN_EMAILS.includes(user.email.toLowerCase());
  const isAdmin = role === 'admin' || Boolean(isBootstrapAdmin);
  const isModerator = role === 'moderator' || isAdmin;
  const isMember = Boolean(user && userProfile && userProfile.status === 'active');

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        isAdmin,
        isModerator,
        isMember,
        signInWithGoogle,
        signUpWithEmail,
        loginWithEmail,
        resetPassword,
        resendVerificationEmail,
        signOut,
        updateUserProfileData,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
