import React from 'react';
import { ScheduleScreen } from '../../screens/ScheduleScreen';
import { CampusScreen } from '../../components/CampusScreen';
import { useCampus } from '../../context/CampusContext';

export default function ScheduleRoute() {
  const { profile, openNotifications, updateGroup } = useCampus();
  if (!profile) return null;
  return <CampusScreen><ScheduleScreen profile={profile} onOpenNotifications={openNotifications} onUpdateGroup={updateGroup} /></CampusScreen>;
}
