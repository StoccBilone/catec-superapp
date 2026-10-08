import React, { forwardRef } from 'react';
import { Alert as NativeAlert, AlertButton, AlertOptions, Pressable as NativePressable, StyleSheet, Text as NativeText, TextInput as NativeTextInput, TextInputProps, TextProps, TouchableOpacity as NativeTouchableOpacity } from 'react-native';
import { usePreferences } from '../context/PreferencesContext';
import { translate } from '../i18n/strings';

export function Text({ children, style, translate: localize = true, ...props }: TextProps & { translate?: boolean }) {
  const { language, textSize } = usePreferences();
  const flat = StyleSheet.flatten(style) || {};
  const scale = textSize === 'large' ? 1.12 : 1;
  return <NativeText {...props} style={[style, { fontSize: (flat.fontSize || 14) * scale, ...(flat.lineHeight ? { lineHeight: flat.lineHeight * scale } : {}) }]}>{React.Children.map(children, child => typeof child === 'string' && localize ? translate(child, language) : child)}</NativeText>;
}
export const TextInput = forwardRef<NativeTextInput, TextInputProps>(function TextInput(props, ref) {
  const { language, textSize } = usePreferences();
  const flat = StyleSheet.flatten(props.style) || {};
  const scale = textSize === 'large' ? 1.12 : 1;
  return <NativeTextInput {...props} ref={ref} placeholder={props.placeholder ? translate(props.placeholder, language) : undefined} accessibilityLabel={props.accessibilityLabel ? translate(props.accessibilityLabel, language) : undefined} style={[props.style, { fontSize: (flat.fontSize || 16) * scale, ...(flat.lineHeight ? { lineHeight: flat.lineHeight * scale } : {}) }]} />;
});
export const Pressable = forwardRef<React.ComponentRef<typeof NativePressable>, React.ComponentProps<typeof NativePressable>>(function Pressable(props, ref) {
  const { language } = usePreferences();
  return <NativePressable {...props} ref={ref} accessibilityLabel={props.accessibilityLabel ? translate(props.accessibilityLabel, language) : undefined} />;
});
export const TouchableOpacity = forwardRef<React.ComponentRef<typeof NativeTouchableOpacity>, React.ComponentProps<typeof NativeTouchableOpacity>>(function TouchableOpacity(props, ref) {
  const { language } = usePreferences();
  return <NativeTouchableOpacity {...props} ref={ref} accessibilityLabel={props.accessibilityLabel ? translate(props.accessibilityLabel, language) : undefined} />;
});
export const Alert = { alert: (title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions) => NativeAlert.alert(translate(title), message ? translate(message) : message, buttons?.map(button => ({ ...button, text: button.text ? translate(button.text) : button.text })), options) };
