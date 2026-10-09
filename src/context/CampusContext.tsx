import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { StorageService } from '../services/storage';
import { UserProfile } from '../types';
import { cloud } from '../services/cloud';

interface CampusState {
  profile: UserProfile | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  showNotifications: boolean;
  openNotifications: () => void;
  closeNotifications: () => void;
  authenticate: (profile: UserProfile) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profile: UserProfile) => void;
  updateGroup: (group: string) => Promise<void>;
}

const CampusContext = createContext<CampusState | null>(null);

export function CampusProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const sessionVersion = useRef(0);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [stored, logged] = await Promise.all([
          StorageService.getUserProfile(), StorageService.isUserLoggedIn(),
        ]);
        if (mounted) {
          setProfile(stored);
          setIsLoggedIn(logged && !!stored);
          setIsLoading(false);
        }
        if (stored && logged) {
          const version = sessionVersion.current;
          const synced = { ...stored };
          // Unlock the saved device immediately; a slow network must not block startup.
          void StorageService.saveUserProfile(synced).then(() => {
            if (mounted && version === sessionVersion.current) setProfile(synced);
          }).catch(() => { console.warn('Profile sync unavailable; using saved profile.'); });
        }
      } catch (error) {
        console.warn('Init error', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    void load();
    return () => { mounted = false; };
  }, []);

  const authenticate = async (userProfile: UserProfile) => {
    sessionVersion.current += 1;
    if (profile && profile.id !== userProfile.id) {
      const { error } = await cloud.auth.signOut({ scope: 'local' });
      if (error) throw error;
    }
    try { await StorageService.saveUserProfile(userProfile); }
    catch (error) {
      // An existing PIN unlocks this device even without a network connection.
      if (!profile || profile.id !== userProfile.id || profile.passCode !== userProfile.passCode) throw error;
    }
    await StorageService.setLoggedIn(true);
    setProfile(userProfile);
    setIsLoggedIn(true);
  };

  const logout = async () => {
    sessionVersion.current += 1;
    await StorageService.setLoggedIn(false);
    setShowNotifications(false);
    setIsLoggedIn(false);
  };

  const updateGroup = async (group: string) => {
    sessionVersion.current += 1;
    if (!profile) return;
    const updated = { ...profile, group };
    await StorageService.saveUserProfile(updated);
    setProfile(updated);
  };

  return (
    <CampusContext.Provider value={{
      profile, isLoggedIn, isLoading, showNotifications,
      openNotifications: () => setShowNotifications(true),
      closeNotifications: () => setShowNotifications(false),
      authenticate, logout, updateProfile: updated => { sessionVersion.current += 1; setProfile(updated); }, updateGroup,
    }}>
      {children}
    </CampusContext.Provider>
  );
}

export function useCampus() {
  const context = useContext(CampusContext);
  if (!context) throw new Error('useCampus requires CampusProvider');
  return context;
}
