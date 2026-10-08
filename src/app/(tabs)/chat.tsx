import React from 'react';
import { ChatScreen } from '../../screens/ChatScreen';
import { CampusScreen } from '../../components/CampusScreen';
import { useCampus } from '../../context/CampusContext';

export default function ChatRoute() {
  const { profile, openNotifications } = useCampus();
  if (!profile) return null;
  return <CampusScreen bottomInset><ChatScreen profile={profile} onOpenNotifications={openNotifications} /></CampusScreen>;
}
