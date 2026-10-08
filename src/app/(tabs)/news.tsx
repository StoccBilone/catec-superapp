import React from 'react';
import { NewsScreen } from '../../screens/NewsScreen';
import { CampusScreen } from '../../components/CampusScreen';
import { useCampus } from '../../context/CampusContext';

export default function NewsRoute() {
  const { profile, openNotifications } = useCampus();
  if (!profile) return null;
  return <CampusScreen><NewsScreen profile={profile} onOpenNotifications={openNotifications} /></CampusScreen>;
}
