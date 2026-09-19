/**
 * obo Mobile Design System — StatusBadge Component
 * Semantic pill badge matching Owner Web status chips.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../../theme';

export type BadgeVariant = 'active' | 'warning' | 'danger' | 'info' | 'neutral' | 'expired' | 'inactive';

export interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}

export const StatusBadge = ({
  label,
  variant = 'neutral',
  size = 'md',
  style,
}: StatusBadgeProps) => {
  const resolvedVariant = variant === 'expired' ? 'danger' : variant === 'inactive' ? 'neutral' : variant;
  return (
    <View style={[styles.badge, size === 'sm' && styles.badgeSm, styles[resolvedVariant], style]}>
      <Text style={[styles.text, size === 'sm' && styles.textSm, styles[`text_${resolvedVariant}`]]}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  badgeSm: {
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  active: {
    backgroundColor: Colors.successBg,
    borderColor: Colors.successBorder,
  },
  warning: {
    backgroundColor: Colors.warningBg,
    borderColor: Colors.warningBorder,
  },
  danger: {
    backgroundColor: Colors.dangerBg,
    borderColor: Colors.dangerBorder,
  },
  info: {
    backgroundColor: Colors.infoBg,
    borderColor: Colors.infoBorder,
  },
  neutral: {
    backgroundColor: Colors.container,
    borderColor: Colors.border,
  },
  text: {
    ...Typography.badge,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  textSm: {
    fontSize: 9,
    letterSpacing: 0.3,
  },
  text_active: {
    color: Colors.successText,
  },
  text_warning: {
    color: Colors.warningText,
  },
  text_danger: {
    color: Colors.dangerText,
  },
  text_info: {
    color: Colors.infoText,
  },
  text_neutral: {
    color: Colors.textSecondary,
  },
});
