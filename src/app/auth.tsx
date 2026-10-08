import React from 'react';
import { AuthScreen } from '../screens/AuthScreen';
import { CampusScreen } from '../components/CampusScreen';
import { useCampus } from '../context/CampusContext';

export default function AuthRoute() {
  const { profile, authenticate } = useCampus();
  return (
    <CampusScreen>
      <AuthScreen existingProfile={profile} onSuccessLogin={authenticate} onRegisterNew={authenticate} />
    </CampusScreen>
  );
}
