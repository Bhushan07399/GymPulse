/**
 * obo Mobile — Member Navigator
 * Bottom tab bar with tabs for Home, Pass, Classes, Attendance, and Profile.
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, QrCode, Sparkles, ClipboardList, User } from 'lucide-react-native';
import { MemberHomeScreen } from '../member/MemberHomeScreen';
import { MemberPassScreen } from '../member/MemberPassScreen';
import { MemberClassesScreen } from '../member/MemberClassesScreen';
import { MemberAttendanceScreen } from '../member/MemberAttendanceScreen';
import { MemberProfileScreen } from '../member/MemberProfileScreen';
import { MemberTabParamList } from '../types';
import { Colors } from '../theme';

const Tab = createBottomTabNavigator<MemberTabParamList>();

export const MemberNavigator = () => {
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
        component={MemberHomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="PassTab"
        component={MemberPassScreen}
        options={{
          tabBarLabel: 'QR Pass',
          tabBarIcon: ({ color, size }) => <QrCode size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="ClassesTab"
        component={MemberClassesScreen}
        options={{
          tabBarLabel: 'Classes',
          tabBarIcon: ({ color, size }) => <Sparkles size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="AttendanceTab"
        component={MemberAttendanceScreen}
        options={{
          tabBarLabel: 'History',
          tabBarIcon: ({ color, size }) => <ClipboardList size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={MemberProfileScreen}
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
