import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Colors } from '../../theme/colors';

interface StatusBadgeProps {
  status: 'ACTIVE' | 'EXPIRED' | 'INACTIVE' | 'PAID' | 'PARTIAL' | 'UNPAID' | string;
  label?: string;
}

export const StatusBadge = ({ status, label }: StatusBadgeProps) => {
  const normalized = status.toUpperCase();

  const getColors = () => {
    switch (normalized) {
      case 'ACTIVE':
      case 'PAID':
        return { bg: Colors.successLight, text: Colors.success };
      case 'EXPIRED':
      case 'UNPAID':
      case 'INACTIVE':
        return { bg: Colors.dangerLight, text: Colors.danger };
      case 'PARTIAL':
        return { bg: Colors.warningLight, text: Colors.warning };
      default:
        return { bg: Colors.slate100, text: Colors.slate700 };
    }
  };

  const colors = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>{label || status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
});
