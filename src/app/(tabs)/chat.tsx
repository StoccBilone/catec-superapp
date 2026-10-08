import React from 'react';
import { ChatListScreen } from '../../screens/ChatListScreen';
import { CampusScreen } from '../../components/CampusScreen';
import { useCampus } from '../../context/CampusContext';

export default function ChatRoute() {
  const { profile } = useCampus();
  if (!profile) return null;
  return <CampusScreen><ChatListScreen profile={profile} /></CampusScreen>;
}
