import React from 'react';
import { Game2048Screen } from '../../games/2048/Game2048Screen';
import { useCampus } from '../../context/CampusContext';

export default function Game2048Route() {
  const { profile } = useCampus();
  return profile ? <Game2048Screen key={profile.id} profileId={profile.id} /> : null;
}
