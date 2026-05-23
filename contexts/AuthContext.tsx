
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { signInAnonymously, signOut, onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isAuthReady: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Sync Firebase Auth state with our internal User state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // If we have a Firebase session but no local user object (e.g. on refresh)
        // We might need to re-fetch user details if they were stored in Firestore
        // For now, we just mark that the connection is technically ready
      } else {
        setUser(null);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    const u = username.toLowerCase().trim();
    const p = password.trim();

    const finalizeLogin = async (userData: User) => {
        try {
            // This gives the browser the "Authenticated" status Firestore rules require
            await signInAnonymously(auth);
            setUser(userData);
            return true;
        } catch (authError) {
            console.error("Firebase Auth Error:", authError);
            return false;
        }
    };

    // 1. Check Hardcoded Super Admins
    if (u === 'admin' && p === 'GaryAdmin') {
        return await finalizeLogin({
            id: '6',
            email: 'admin@prop101.co.nz',
            name: 'Admin User',
            role: 'admin',
            title: 'System Administrator'
        });
    }

    if (u === 'kareen' && p === 'Prop101') {
        return await finalizeLogin({
            id: '1',
            name: "Kareen Mackey",
            role: 'admin',
            title: "Director",
            email: "kareen@prop101.co.nz",
            phone: "027 291 8811"
        });
    }

    if (u === 'celia' && p === 'Prop101') {
        return await finalizeLogin({
            id: '3',
            name: "Celia Iddon",
            role: 'account_manager',
            title: "Body Corporate Manager",
            email: "celia@prop101.co.nz",
            phone: "021 165 8067"
        });
    }

    // 2. Check Firestore Users
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', u.includes('@') ? u : `${u}@prop101.co.nz`));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data() as User;
            const expectedPassword = userData.password || 'Prop101';
            if (p === expectedPassword) {
                return await finalizeLogin({ ...userData, id: querySnapshot.docs[0].id });
            }
        }
    } catch (error) {
        console.error("Login lookup error:", error);
    }

    return false;
  };

  const logout = () => {
    signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isAuthReady }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
