/**
 * obo Mobile — Staff Profile Screen
 * Staff user account info, gym branch context, duty status, and logout.
 */

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Alert,
} from 'react-native';
import { Building, Shield, Info } from 'lucide-react-native';
import { useAuth } from '../store/auth.context';
import {
  ScreenContainer,
  Header,
  Card,
  Button,
  StatusBadge,
} from '../components/common';
import { Colors, Spacing, Typography, Radius } from '../theme';

export const StaffProfileScreen = () => {
  const { user, session, logout } = useAuth();
  const gym = session?.activeGym;

  const handleLogoutConfirm = () => {
    Alert.alert('Sign Out', 'Are you sure you want to clock out and sign out of obo?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <ScreenContainer scrollable>
      {/* HEADER */}
      <Header
        title="Staff Profile"
        subtitle="Receptionist shift & account info"
      />

      <View style={styles.content}>
        {/* USER PROFILE CARD */}
        <Card style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {`${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || 'ST'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <View style={styles.badgeRow}>
              <StatusBadge variant="info" label="Staff / Receptionist" size="sm" />
            </View>
          </View>
        </Card>

        {/* DUTY & LOCATION CARD */}
        <Text style={styles.sectionTitle}>Shift Information</Text>
        <Card style={styles.card}>
          <View style={styles.itemRow}>
            <View style={styles.iconCircle}>
              <Shield size={18} color={Colors.textPrimary} />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemLabel}>Shift Status</Text>
              <Text style={styles.itemValue}>Active on Duty</Text>
            </View>
            <StatusBadge label="On Duty" variant="active" size="sm" />
          </View>

          <View style={[styles.itemRow, { borderBottomWidth: 0 }]}>
            <View style={styles.iconCircle}>
              <Building size={18} color={Colors.textPrimary} />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemLabel}>Assigned Location</Text>
              <Text style={styles.itemValue}>{gym?.name || 'Primary Gym'}</Text>
            </View>
          </View>
        </Card>

        {/* APP INFO */}
        <Text style={styles.sectionTitle}>Software System</Text>
        <Card style={styles.card}>
          <View style={[styles.itemRow, { borderBottomWidth: 0 }]}>
            <View style={styles.iconCircle}>
              <Info size={18} color={Colors.textPrimary} />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemLabel}>obo Smart Gym Management</Text>
              <Text style={styles.appMetaText}>Version 1.0.0 • Production Build</Text>
            </View>
          </View>
        </Card>

        {/* LOGOUT */}
        <Button
          title="Sign Out of Desk"
          variant="outline"
          onPress={handleLogoutConfirm}
          style={styles.logoutBtn}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingVertical: Spacing.md,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: Radius.full,
    backgroundColor: Colors.container,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.md,
  },
  avatarText: {
    ...Typography.pageTitle,
    fontSize: 20,
    color: Colors.textPrimary,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...Typography.cardTitle,
    color: Colors.textPrimary,
  },
  profileEmail: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
  badgeRow: {
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.sectionTitle,
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  card: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.container,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  itemValue: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  appMetaText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  logoutBtn: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xxl,
    borderColor: Colors.dangerBorder,
  },
});
