/**
 * obo Mobile Design System — PasswordInput Component
 * Password input with integrated show/hide toggle.
 */

import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Input, InputProps } from './Input';
import { Colors, Spacing } from '../../theme';

export const PasswordInput = (props: Omit<InputProps, 'secureTextEntry' | 'rightElement'>) => {
  const [isSecure, setIsSecure] = useState(true);

  const toggleSecure = () => {
    setIsSecure((prev) => !prev);
  };

  return (
    <Input
      secureTextEntry={isSecure}
      autoCapitalize="none"
      autoCorrect={false}
      rightElement={
        <TouchableOpacity
          onPress={toggleSecure}
          activeOpacity={0.7}
          style={styles.toggleBtn}
          accessibilityLabel={isSecure ? 'Show password' : 'Hide password'}
        >
          <Text style={styles.toggleText}>{isSecure ? 'SHOW' : 'HIDE'}</Text>
        </TouchableOpacity>
      }
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  toggleBtn: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  toggleText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.slate500,
    letterSpacing: 0.8,
  },
});
