import React, { createContext, useContext, useEffect, useState } from 'react';
import { StorageService } from '../services/storage';
import { UserProfile } from '../types';

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
    await StorageService.saveUserProfile(userProfile);
    await StorageService.setLoggedIn(true);
    setProfile(userProfile);
    setIsLoggedIn(true);
  };

  const logout = async () => {
    await StorageService.setLoggedIn(false);
    setShowNotifications(false);
    setIsLoggedIn(false);
  };

  const updateGroup = async (group: string) => {
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
      authenticate, logout, updateProfile: setProfile, updateGroup,
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
