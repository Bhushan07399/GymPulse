/**
 * obo Mobile — Owner More Screen
 * Account settings, subscription information, branch switcher, and logout.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  User,
  Building,
  CreditCard,
  Shield,
  LogOut,
  ChevronRight,
  Info,
} from 'lucide-react-native';
import { useAuth } from '../store/auth.context';
import {
  ScreenContainer,
  Header,
  Card,
  Button,
  StatusBadge,
} from '../components/common';
import { BranchSwitchModal } from './BranchSwitchModal';
import { Colors, Spacing, Typography, Radius } from '../theme';

export const OwnerMoreScreen = () => {
  const { user, session, logout } = useAuth();
  const gym = session?.activeGym;
  const [branchModalVisible, setBranchModalVisible] = useState(false);

  const handleLogoutConfirm = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of obo?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <ScreenContainer scrollable>
      {/* HEADER */}
      <Header
        title="Settings & More"
        subtitle="Manage business profile and branches"
      />

      <View style={styles.content}>
        {/* OWNER PROFILE CARD */}
        <Card style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {`${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || 'OW'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <View style={styles.badgeRow}>
              <StatusBadge variant="active" label="Owner Account" size="sm" />
            </View>
          </View>
        </Card>

        {/* SUBSCRIPTION & TENANT INFO */}
        <Text style={styles.sectionTitle}>Subscription & Plan</Text>
        <Card style={styles.card}>
          <View style={styles.itemRow}>
            <View style={styles.iconCircle}>
              <CreditCard size={18} color={Colors.textPrimary} />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemLabel}>Base Subscription Plan</Text>
              <Text style={styles.itemValue}>{gym?.subscriptionPlan || 'Growth Plan'}</Text>
            </View>
            <StatusBadge label={gym?.subscriptionStatus || 'Active'} variant="active" size="sm" />
          </View>

          <View style={styles.itemRow}>
            <View style={styles.iconCircle}>
              <Shield size={18} color={Colors.textPrimary} />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemLabel}>Billing Cycle</Text>
              <Text style={styles.itemValue}>
                {gym?.billingCycle ? gym.billingCycle.charAt(0).toUpperCase() + gym.billingCycle.slice(1) : 'Monthly'}
              </Text>
            </View>
          </View>

          <View style={[styles.itemRow, { borderBottomWidth: 0 }]}>
            <View style={styles.iconCircle}>
              <Building size={18} color={Colors.textPrimary} />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemLabel}>Authorized Locations</Text>
              <Text style={styles.itemValue}>
                {gym?.isMultiGym ? `${gym.maxLocations || 1} Branches Allowed` : 'Single Location'}
              </Text>
            </View>
          </View>
        </Card>

        {/* BRANCH SWITCHER (MULTI-GYM) */}
        {gym?.isMultiGym ? (
          <>
            <Text style={styles.sectionTitle}>Branch Management</Text>
            <Card style={styles.card}>
              <TouchableOpacity
                style={styles.branchActionRow}
                onPress={() => setBranchModalVisible(true)}
                activeOpacity={0.7}
              >
                <View style={styles.iconCircle}>
                  <Building size={18} color={Colors.textPrimary} />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemLabel}>Current Branch</Text>
                  <Text style={styles.itemValue}>{gym?.name || 'Primary Gym'}</Text>
                </View>
                <View style={styles.switchPrompt}>
                  <Text style={styles.switchText}>Switch</Text>
                  <ChevronRight size={16} color={Colors.textMuted} />
                </View>
              </TouchableOpacity>
            </Card>
          </>
        ) : null}

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

        {/* LOGOUT BUTTON */}
        <Button
          title="Sign Out of Account"
          variant="outline"
          onPress={handleLogoutConfirm}
          style={styles.logoutBtn}
        />
      </View>

      {/* BRANCH SWITCH MODAL */}
      <BranchSwitchModal
        visible={branchModalVisible}
        onClose={() => setBranchModalVisible(false)}
      />
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
  branchActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
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
  switchPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  switchText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.primary,
  },
  logoutBtn: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xxl,
    borderColor: Colors.dangerBorder,
  },
});
