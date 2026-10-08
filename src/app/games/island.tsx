import React from 'react';
import { IslandScreen } from '../../games/island/IslandScreen';
import { useCampus } from '../../context/CampusContext';

export default function IslandRoute() {
  const { profile } = useCampus();
  return profile ? <IslandScreen key={profile.id} profileId={profile.id} /> : null;
}
