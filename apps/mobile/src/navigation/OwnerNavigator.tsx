/**
 * obo Mobile — Owner Navigator
 * Bottom tab bar with tabs for Home, Members, Attendance, Payments, and More.
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Users, ClipboardList, CreditCard, Settings } from 'lucide-react-native';
import { OwnerHomeScreen } from '../owner/OwnerHomeScreen';
import { OwnerMembersScreen } from '../owner/OwnerMembersScreen';
import { OwnerAttendanceScreen } from '../owner/OwnerAttendanceScreen';
import { OwnerPaymentsScreen } from '../owner/OwnerPaymentsScreen';
import { OwnerMoreScreen } from '../owner/OwnerMoreScreen';
import { OwnerTabParamList } from '../types';
import { Colors } from '../theme';

const Tab = createBottomTabNavigator<OwnerTabParamList>();

export const OwnerNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={OwnerHomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="MembersTab"
        component={OwnerMembersScreen}
        options={{
          tabBarLabel: 'Members',
          tabBarIcon: ({ color, size }) => <Users size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="AttendanceTab"
        component={OwnerAttendanceScreen}
        options={{
          tabBarLabel: 'Attendance',
          tabBarIcon: ({ color, size }) => <ClipboardList size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="PaymentsTab"
        component={OwnerPaymentsScreen}
        options={{
          tabBarLabel: 'Payments',
          tabBarIcon: ({ color, size }) => <CreditCard size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="MoreTab"
        component={OwnerMoreScreen}
        options={{
          tabBarLabel: 'More',
          tabBarIcon: ({ color, size }) => <Settings size={size || 20} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    height: 60,
    paddingBottom: 6,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
});
