import React from 'react';
import { MazeScreen } from '../../games/maze/MazeScreen';
import { useCampus } from '../../context/CampusContext';
export default function MazeRoute() {
  const { profile } = useCampus();
  return profile ? <MazeScreen key={profile.id} profileId={profile.id} /> : null;
}
