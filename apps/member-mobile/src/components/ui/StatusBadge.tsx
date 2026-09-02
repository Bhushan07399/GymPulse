import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../theme/colors';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const normalized = (status || '').toLowerCase();

  let bg = Colors.slate100;
  let fg = Colors.slate700;

  if (normalized === 'active' || normalized === 'paid' || normalized === 'attended' || normalized === 'booked') {
    bg = Colors.successLight;
    fg = Colors.success;
  } else if (normalized.includes('expir') || normalized === 'pending' || normalized === 'partial') {
    bg = Colors.warningLight;
    fg = Colors.warning;
  } else if (normalized === 'expired' || normalized === 'inactive' || normalized === 'failed' || normalized === 'cancelled') {
    bg = Colors.dangerLight;
    fg = Colors.danger;
  }

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg }]}>{status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
});
