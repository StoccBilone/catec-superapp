import React from 'react';
import { MemoryScreen } from '../../games/memory/MemoryScreen';
import { useCampus } from '../../context/CampusContext';
export default function MemoryRoute() {
  const { profile } = useCampus();
  return profile ? <MemoryScreen key={profile.id} profileId={profile.id} /> : null;
}
