import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp } from '@react-navigation/native';

import { RootStackParamList } from '../navigation/types';

type HeaderMenuProps = {
  navigation: NavigationProp<RootStackParamList>;
  iconColor?: string;
  topOffset?: number;
  rightOffset?: number;
};

export function HeaderMenu({
  navigation,
  iconColor = '#F6F8FE',
  topOffset = 84,
  rightOffset = 14,
}: HeaderMenuProps) {
  const [open, setOpen] = useState(false);

  const menuItems = useMemo(
    () => [
      { label: 'Profile', route: 'ProfileNative' as const, icon: 'person-outline' as const },
      { label: 'Subscription', route: 'SubscriptionNative' as const, icon: 'card-outline' as const },
      { label: 'Help Center', route: 'HelpCenterNative' as const, icon: 'help-circle-outline' as const },
    ],
    [],
  );

  const onSelect = (route: keyof RootStackParamList) => {
    setOpen(false);
    navigation.navigate(route as any);
  };

  return (
    <>
      <TouchableOpacity style={styles.iconBtn} onPress={() => setOpen(true)} activeOpacity={0.85}>
        <Ionicons name="menu" size={22} color={iconColor} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={[styles.dropdown, { top: topOffset, right: rightOffset }]}>
            {menuItems.map((item, idx) => (
              <TouchableOpacity
                key={item.label}
                style={[styles.menuItem, idx < menuItems.length - 1 && styles.menuItemDivider]}
                onPress={() => onSelect(item.route)}
                activeOpacity={0.85}
              >
                <Ionicons name={item.icon} size={16} color="#2C355C" />
                <Text style={styles.menuText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  iconBtn: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20,24,38,0.12)',
  },
  dropdown: {
    position: 'absolute',
    width: 170,
    borderRadius: 10,
    backgroundColor: '#F7F8FC',
    borderWidth: 1,
    borderColor: '#D7DDEB',
    overflow: 'hidden',
    shadowColor: '#1C2448',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 6,
  },
  menuItem: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  menuItemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E5F0',
  },
  menuText: {
    marginLeft: 8,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: '#2C355C',
  },
});
