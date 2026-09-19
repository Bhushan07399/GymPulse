/**
 * obo Unified Mobile App — Root Navigator
 * Role-aware root router switching between Auth and verified Role Navigators.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../store/auth.context';
import { AuthNavigator } from './AuthNavigator';
import { OwnerNavigator } from './OwnerNavigator';
import { StaffNavigator } from './StaffNavigator';
import { MemberNavigator } from './MemberNavigator';
import { LoadingState } from '../components/common';
import { Colors } from '../theme';

export const RootNavigator = () => {
  const { isAuthenticated, isLoading, role } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingState message="Restoring obo session..." />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!isAuthenticated || !role ? (
        <AuthNavigator />
      ) : role === 'Owner' ? (
        <OwnerNavigator />
      ) : role === 'Staff' ? (
        <StaffNavigator />
      ) : (
        <MemberNavigator />
      )}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
