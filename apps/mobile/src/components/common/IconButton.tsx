/**
 * obo Mobile Design System — IconButton Component
 */

import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Colors, Radius } from '../../theme';

interface IconButtonProps {
  onPress: () => void;
  icon: React.ReactNode;
  size?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const IconButton = ({
  onPress,
  icon,
  size = 40,
  disabled = false,
  style,
}: IconButtonProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        styles.button,
        { width: size, height: size, borderRadius: size / 2 },
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.container,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  disabled: {
    opacity: 0.5,
  },
});
