import { AppText } from './AppText';
import React from 'react';
import { Modal, StyleSheet, TouchableOpacity, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../i18n/useI18n';
import { colors, radii, shadows, spacing, typography } from '../constants/theme';
import { useResponsiveMetrics } from '../utils/responsive';

interface SignOutConfirmationModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function SignOutConfirmationModal({
  visible,
  onCancel,
  onConfirm,
}: SignOutConfirmationModalProps) {
  const { t } = useI18n();
  const r = useResponsiveMetrics();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={[styles.backdrop, { padding: r.scale(24) }]} onPress={onCancel}>
        <View style={styles.modalContainer}>
          <Pressable style={[styles.modalContent, { borderRadius: r.radius(radii.xl), padding: r.scale(24) }]} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.iconContainer, { width: r.scale(64), height: r.scale(64), borderRadius: r.scale(32), marginBottom: r.verticalScale(16) }]}>
              <Ionicons name="log-out-outline" size={r.icon(30)} color={colors.red} />
            </View>
            
            <AppText style={[styles.title, { marginBottom: r.verticalScale(8), fontSize: r.font(17), lineHeight: r.lineHeight(17) }]}>{t('auth.signOutConfirmTitle')}</AppText>
            <AppText style={[styles.message, { marginBottom: r.verticalScale(24), fontSize: r.font(14), lineHeight: r.lineHeight(14) }]} lines={null}>{t('auth.signOutConfirmMessage')}</AppText>

            <View style={[styles.footer, { gap: r.scale(spacing.md) }]}>
              <TouchableOpacity
                style={[styles.button, { height: r.touch(48), borderRadius: r.radius(radii.md) }, styles.cancelButton]}
                onPress={onCancel}
                activeOpacity={0.7}
              >
                <AppText style={[styles.cancelButtonText, { fontSize: r.font(14), lineHeight: r.lineHeight(14) }]}>{t('common.cancel')}</AppText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, { height: r.touch(48), borderRadius: r.radius(radii.md) }, styles.confirmButton]}
                onPress={onConfirm}
                activeOpacity={0.8}
              >
                <AppText style={[styles.confirmButtonText, { fontSize: r.font(14), lineHeight: r.lineHeight(14) }]}>{t('auth.signOutConfirmYes')}</AppText>
              </TouchableOpacity>
            </View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '100%',
    maxWidth: 340,
  },
  modalContent: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    ...shadows.floating,
  },
  iconContainer: {
    backgroundColor: colors.redSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...typography.title,
    color: colors.ink,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    color: colors.inkMuted,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    width: '100%',
  },
  button: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cancelButtonText: {
    fontFamily: 'Poppins-Bold',
    color: colors.inkMuted,
  },
  confirmButton: {
    backgroundColor: colors.red,
  },
  confirmButtonText: {
    fontFamily: 'Poppins-Bold',
    color: colors.white,
  },
});
