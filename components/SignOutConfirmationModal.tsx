import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../i18n/useI18n';

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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <View style={styles.modalContainer}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.iconContainer}>
              <Ionicons name="log-out-outline" size={32} color="#EF4444" />
            </View>
            
            <Text style={styles.title}>{t('auth.signOutConfirmTitle')}</Text>
            <Text style={styles.message}>{t('auth.signOutConfirmMessage')}</Text>

            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onCancel}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.confirmButton]}
                onPress={onConfirm}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmButtonText}>{t('auth.signOutConfirmYes')}</Text>
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
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 340,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 20,
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
  },
  cancelButtonText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 14,
    color: '#475569',
  },
  confirmButton: {
    backgroundColor: '#EF4444',
  },
  confirmButtonText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
});
