import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '../theme/colors';
import { MainTabParamList } from '../types/navigation';
import { MemberDashboardScreen } from '../screens/MemberDashboardScreen';
import { QrPassScreen } from '../screens/QrPassScreen';
import { AttendanceHistoryScreen } from '../screens/AttendanceHistoryScreen';
import { ClassScheduleScreen } from '../screens/ClassScheduleScreen';
import { memberDashboardService } from '../services/dashboard.service';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TabIcon = ({ icon, focused }: { icon: string; focused: boolean }) => (
  <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
    <Text style={styles.iconText}>{icon}</Text>
  </View>
);

export const MainTabNavigator = () => {
  const { data: summary } = useQuery({
    queryKey: ['memberDashboardSummary'],
    queryFn: () => memberDashboardService.getSummary(),
  });

  const showClasses = Boolean(summary?.hasClassFeature && summary?.hasClassEntitlement);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.slate400,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={MemberDashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="QrPassTab"
        component={QrPassScreen}
        options={{
          tabBarLabel: 'QR Pass',
          tabBarIcon: ({ focused }) => <TabIcon icon="📱" focused={focused} />,
        }}
      />
      {showClasses && (
        <Tab.Screen
          name="ClassesTab"
          component={ClassScheduleScreen}
          options={{
            tabBarLabel: 'Classes',
            tabBarIcon: ({ focused }) => <TabIcon icon="🏋️" focused={focused} />,
          }}
        />
      )}
      <Tab.Screen
        name="AttendanceTab"
        component={AttendanceHistoryScreen}
        options={{
          tabBarLabel: 'Attendance',
          tabBarIcon: ({ focused }) => <TabIcon icon="📊" focused={focused} />,
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
    height: 64,
    paddingBottom: 8,
    paddingTop: 6,
    elevation: 8,
    shadowColor: Colors.slate900,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  iconContainerFocused: {
    backgroundColor: Colors.primaryLight,
  },
  iconText: {
    fontSize: 16,
  },
});
