import React, { ReactNode } from 'react';
import { StyleSheet, TouchableOpacity, Text, ViewStyle } from 'react-native';
import { Colors } from '../../theme/colors';

interface IconButtonProps {
  iconText: string;
  label?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'amber';
  style?: ViewStyle;
}

export const IconButton = ({ iconText, label, onPress, variant = 'primary', style }: IconButtonProps) => {
  const getBgColor = () => {
    switch (variant) {
      case 'amber': return Colors.primary;
      case 'secondary': return Colors.slate100;
      default: return Colors.slate900;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'secondary': return Colors.slate800;
      default: return Colors.surface;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: getBgColor() }, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.icon, { color: getTextColor() }]}>{iconText}</Text>
      {label && <Text style={[styles.label, { color: getTextColor() }]}>{label}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  icon: {
    fontSize: 16,
    fontWeight: '700',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
});
