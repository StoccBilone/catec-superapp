import React from 'react';
import { useCampus } from '../../context/CampusContext';
import { BlocksScreen } from '../../games/blocks/BlocksScreen';
export default function BlocksRoute() { const {profile}=useCampus(); return profile ? <BlocksScreen key={profile.id} profileId={profile.id}/> : null; }
