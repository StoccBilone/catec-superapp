import React from 'react';
import { DynamicColorIOS, Platform } from 'react-native';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useTheme } from '../../theme/themeContext';

export default function TabLayout() {
  const { mode, colors } = useTheme();
  const iconColor = Platform.OS === 'ios'
    ? DynamicColorIOS({ dark: '#ffffff', light: '#1c1c1e' })
    : mode === 'dark' ? '#ffffff' : '#1c1c1e';

  return (
    <NativeTabs iconColor={iconColor} tintColor={iconColor} minimizeBehavior="never">
      <NativeTabs.Trigger name="index" accessibilityLabel="Расписание" contentStyle={{ backgroundColor: colors.canvas }}>
        <NativeTabs.Trigger.Icon sf="calendar" md="calendar_month" />
        <NativeTabs.Trigger.Label hidden>Расписание</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="news" accessibilityLabel="Новости" contentStyle={{ backgroundColor: colors.canvas }}>
        <NativeTabs.Trigger.Icon sf={{ default: 'newspaper', selected: 'newspaper.fill' }} md="newspaper" />
        <NativeTabs.Trigger.Label hidden>Новости</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="chat" disableAutomaticContentInsets accessibilityLabel="Беседа, непрочитанных: 3" contentStyle={{ backgroundColor: colors.canvas }}>
        <NativeTabs.Trigger.Icon sf={{ default: 'bubble.left', selected: 'bubble.left.fill' }} md="chat_bubble" />
        <NativeTabs.Trigger.Label hidden>Беседа</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Badge>3</NativeTabs.Trigger.Badge>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile" accessibilityLabel="Кабинет" contentStyle={{ backgroundColor: colors.canvas }}>
        <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} md="person" />
        <NativeTabs.Trigger.Label hidden>Кабинет</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
