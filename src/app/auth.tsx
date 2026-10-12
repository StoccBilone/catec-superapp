import React from 'react';
import { AuthScreen } from '../screens/AuthScreen';
import { ScreenSafeArea } from '../components/ScreenSafeArea';
import { useCampus } from '../context/CampusContext';
import { useTheme } from '../theme/themeContext';
import { authPalette } from '../theme/authTheme';
export default function AuthRoute() {
  const { profile, authenticate } = useCampus();
  const { mode } = useTheme();
  return <ScreenSafeArea edges={['top','bottom','left','right']} style={{flex:1,backgroundColor:authPalette(mode).wash}}><AuthScreen existingProfile={profile} onSuccessLogin={authenticate} onRegisterNew={authenticate}/></ScreenSafeArea>;
}
