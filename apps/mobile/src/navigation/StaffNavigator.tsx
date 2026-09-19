/**
 * obo Mobile — Staff Navigator
 * Bottom tab bar for reception desk staff.
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Bell, ClipboardList, CreditCard, Search, User } from 'lucide-react-native';
import { StaffReceptionScreen } from '../staff/StaffReceptionScreen';
import { StaffAttendanceScreen } from '../staff/StaffAttendanceScreen';
import { StaffPaymentsScreen } from '../staff/StaffPaymentsScreen';
import { StaffMembersScreen } from '../staff/StaffMembersScreen';
import { StaffProfileScreen } from '../staff/StaffProfileScreen';
import { StaffTabParamList } from '../types';
import { Colors } from '../theme';

const Tab = createBottomTabNavigator<StaffTabParamList>();

export const StaffNavigator = () => {
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
        name="ReceptionTab"
        component={StaffReceptionScreen}
        options={{
          tabBarLabel: 'Reception',
          tabBarIcon: ({ color, size }) => <Bell size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="AttendanceTab"
        component={StaffAttendanceScreen}
        options={{
          tabBarLabel: 'Attendance',
          tabBarIcon: ({ color, size }) => <ClipboardList size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="PaymentsTab"
        component={StaffPaymentsScreen}
        options={{
          tabBarLabel: 'Payments',
          tabBarIcon: ({ color, size }) => <CreditCard size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="MembersTab"
        component={StaffMembersScreen}
        options={{
          tabBarLabel: 'Search',
          tabBarIcon: ({ color, size }) => <Search size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={StaffProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size || 20} color={color} />,
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
