/**
 * obo Mobile Design System — ErrorState Component
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from './Button';
import { Colors, Radius, Spacing, Typography } from '../../theme';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState = ({
  title = 'Something went wrong',
  message,
  onRetry,
}: ErrorStateProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <Button
          title="Try Again"
          onPress={onRetry}
          variant="primary"
          size="sm"
          style={styles.retryBtn}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dangerBgSubtle,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  icon: {
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  title: {
    ...Typography.cardTitle,
    color: Colors.dangerText,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  message: {
    ...Typography.caption,
    color: Colors.dangerText,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  retryBtn: {
    minWidth: 120,
  },
});
