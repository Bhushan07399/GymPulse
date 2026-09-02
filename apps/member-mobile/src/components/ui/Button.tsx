import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../../theme/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'normal' | 'small' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'normal',
  loading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        containerStyles.button,
        containerStyles[variant],
        containerStyles[`size_${size}` as keyof typeof containerStyles],
        isDisabled && containerStyles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? Colors.primary : Colors.surface} size="small" />
      ) : (
        <Text style={[textStyles.text, textStyles[`text_${variant}` as keyof typeof textStyles], textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const containerStyles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  danger: {
    backgroundColor: Colors.danger,
  },
  disabled: {
    opacity: 0.5,
  },
  size_small: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  size_normal: {
    paddingVertical: 13,
    paddingHorizontal: 18,
  },
  size_large: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
});

const textStyles = StyleSheet.create({
  text: {
    fontWeight: '700',
    fontSize: 15,
  },
  text_primary: {
    color: Colors.surface,
  },
  text_secondary: {
    color: Colors.surface,
  },
  text_outline: {
    color: Colors.primary,
  },
  text_danger: {
    color: Colors.surface,
  },
});
