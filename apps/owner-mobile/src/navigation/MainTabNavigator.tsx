import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Colors } from '../theme/colors';
import { MainTabParamList } from '../types/navigation';
import { OwnerDashboardScreen } from '../screens/OwnerDashboardScreen';
import { MemberListScreen } from '../screens/MemberListScreen';
import { ReceptionScannerScreen } from '../screens/ReceptionScannerScreen';
import { AttendanceLedgerScreen } from '../screens/AttendanceLedgerScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Dummy placeholder for payments tab until stack route is selected
const PaymentsTabScreen = ({ navigation }: any) => {
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      navigation.navigate('CollectPayment');
    });
    return unsubscribe;
  }, [navigation]);
  return <OwnerDashboardScreen navigation={navigation} />;
};

export const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.slate400,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={OwnerDashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🏠</Text>,
        }}
      />

      <Tab.Screen
        name="MembersTab"
        component={MemberListScreen}
        options={{
          tabBarLabel: 'Members',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>👥</Text>,
        }}
      />

      <Tab.Screen
        name="ScanTab"
        component={ReceptionScannerScreen}
        options={{
          tabBarLabel: 'Scan QR',
          tabBarIcon: () => (
            <View style={styles.centerScanBadge}>
              <Text style={styles.centerScanIcon}>📷</Text>
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="AttendanceTab"
        component={AttendanceLedgerScreen}
        options={{
          tabBarLabel: 'Attendance',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>📋</Text>,
        }}
      />

      <Tab.Screen
        name="PaymentsTab"
        component={PaymentsTabScreen}
        options={{
          tabBarLabel: 'Record Fee',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>💳</Text>,
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
  centerScanBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.slate900,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  centerScanIcon: {
    fontSize: 20,
    color: Colors.primary,
  },
});
