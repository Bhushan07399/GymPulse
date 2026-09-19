/**
 * obo Mobile Design System — Input Component
 * Clean input with label, helper, error, and focus styling.
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../../theme';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

export const Input = ({
  label,
  error,
  hint,
  leftElement,
  rightElement,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...rest
}: InputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.container,
          isFocused && styles.containerFocused,
          Boolean(error) && styles.containerError,
        ]}
      >
        {leftElement && <View style={styles.leftBox}>{leftElement}</View>}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Colors.slate400}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {rightElement && <View style={styles.rightBox}>{rightElement}</View>}
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
  },
  containerFocused: {
    borderColor: Colors.borderFocus,
    backgroundColor: '#FFFFFF',
  },
  containerError: {
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerBgSubtle,
  },
  input: {
    flex: 1,
    height: '100%',
    ...Typography.body,
    color: Colors.textPrimary,
  },
  leftBox: {
    marginRight: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightBox: {
    marginLeft: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    ...Typography.caption,
    color: Colors.danger,
    marginTop: Spacing.xxs,
  },
  hintText: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: Spacing.xxs,
  },
});
