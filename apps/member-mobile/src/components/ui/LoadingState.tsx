import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { Colors } from '../../theme/colors';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState = ({ message = 'Loading details...' }: LoadingStateProps) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.slate500,
    fontWeight: '500',
  },
});
