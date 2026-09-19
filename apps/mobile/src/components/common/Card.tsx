/**
 * obo Mobile Design System — Card Component
 * Surface white container with rounded-2xl (16px) corners and subtle border.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, TouchableOpacity } from 'react-native';
import { Colors, Radius, Spacing, Shadows } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  bordered?: boolean;
}

export const Card = ({
  children,
  style,
  onPress,
  bordered = true,
}: CardProps) => {
  const containerStyle = [
    styles.card,
    bordered && styles.bordered,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={containerStyle}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  bordered: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
