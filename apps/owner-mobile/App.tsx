import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import './src/lib/i18n';
import { queryClient } from './src/lib/react-query';
import { AuthProvider } from './src/store/auth.context';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </AuthProvider>
    </QueryClientProvider>
  );
}
