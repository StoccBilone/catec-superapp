import React from 'react';
import { ProfileScreen } from '../../screens/ProfileScreen';
import { CampusScreen } from '../../components/CampusScreen';
import { useCampus } from '../../context/CampusContext';

export default function ProfileRoute() {
  const { profile, openNotifications, updateProfile, logout } = useCampus();
  if (!profile) return null;
  return <CampusScreen><ProfileScreen profile={profile} onOpenNotifications={openNotifications} onUpdateProfile={updateProfile} onLogout={logout} /></CampusScreen>;
}
