import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../store/auth.context';
import { RootStackParamList } from '../types/navigation';

import { OwnerLoginScreen } from '../screens/OwnerLoginScreen';
import { MainTabNavigator } from './MainTabNavigator';
import { MemberDetailScreen } from '../screens/MemberDetailScreen';
import { AddMemberModalScreen } from '../screens/AddMemberModalScreen';
import { CollectPaymentModalScreen } from '../screens/CollectPaymentModalScreen';
import { AttendanceLedgerScreen } from '../screens/AttendanceLedgerScreen';
import { ReceptionScannerScreen } from '../screens/ReceptionScannerScreen';
import { LoadingState } from '../components/ui/LoadingState';
import { ScreenContainer } from '../components/ui/ScreenContainer';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <ScreenContainer scrollable={false}>
        <LoadingState message="Restoring GymPulse session..." />
      </ScreenContainer>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={OwnerLoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen name="MemberDetail" component={MemberDetailScreen} />
            <Stack.Screen name="AddMember" component={AddMemberModalScreen} />
            <Stack.Screen name="CollectPayment" component={CollectPaymentModalScreen} />
            <Stack.Screen name="AttendanceLedger" component={AttendanceLedgerScreen} />
            <Stack.Screen name="ReceptionScanner" component={ReceptionScannerScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
