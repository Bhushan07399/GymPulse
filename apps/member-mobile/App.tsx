import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import './src/lib/i18n';
import { memberQueryClient } from './src/lib/react-query';
import { MemberAuthProvider } from './src/store/auth.context';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={memberQueryClient}>
        <MemberAuthProvider>
          <AppNavigator />
        </MemberAuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
