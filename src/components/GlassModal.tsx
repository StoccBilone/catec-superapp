import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { X } from 'lucide-react-native';
import { useTheme } from '../theme/themeContext';

interface GlassModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const GlassModal: React.FC<GlassModalProps> = ({
  visible,
  onClose,
  title,
  children,
}) => {
  const { colors, mode } = useTheme();
  const isDark = mode === 'dark';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          {Platform.OS === 'ios' ? (
            <BlurView
              intensity={isDark ? 28 : 20}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)' }]} />
          )}

          <TouchableWithoutFeedback>
            <View
              style={[
                styles.sheetContainer,
                {
                  backgroundColor: colors.canvasElevated,
                  borderColor: colors.cardBorderHighlight,
                },
              ]}
            >
              {/* iOS Pull Bar / Grabber */}
              <View style={styles.grabberWrapper}>
                <View
                  style={[
                    styles.grabber,
                    { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.2)' },
                  ]}
                />
              </View>

              {/* Close Button top-right */}
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: colors.inputBg }]}
                activeOpacity={0.7}
                onPress={onClose}
              >
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>

              <ScrollView
                style={styles.scrollArea}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {children}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    maxHeight: '88%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
  },
  grabberWrapper: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  grabber: {
    width: 38,
    height: 4.5,
    borderRadius: 2.5,
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 18,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  scrollArea: {
    maxHeight: '100%',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
});
