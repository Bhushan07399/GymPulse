/**
 * obo Mobile — Member Profile Screen
 * Member user account, membership plan validity, payment receipts, and logout.
 */

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  User,
  CreditCard,
  Calendar,
  Building,
  Receipt,
  Phone,
  Mail,
  Info,
} from 'lucide-react-native';
import { useAuth } from '../store/auth.context';
import { memberService } from '../api';
import {
  ScreenContainer,
  Header,
  Card,
  Button,
  StatusBadge,
  LoadingState,
} from '../components/common';
import { Colors, Spacing, Typography, Radius } from '../theme';
import { Payment } from '../types';

export const MemberProfileScreen = () => {
  const { user, logout } = useAuth();

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['memberProfile'],
    queryFn: () => memberService.getProfile(),
  });

  const { data: payments = [], isLoading: loadingPayments } = useQuery({
    queryKey: ['memberPayments'],
    queryFn: () => memberService.getPayments(),
  });

  const handleLogoutConfirm = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of your member account?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const memberId = profile?.memberId || user?.memberId || '';
  const fullName = `${profile?.firstName || user?.firstName || 'Member'} ${profile?.lastName || user?.lastName || ''}`.trim();

  return (
    <ScreenContainer scrollable>
      {/* HEADER */}
      <Header
        title="My Profile"
        subtitle="Account & membership details"
      />

      <View style={styles.content}>
        {/* PROFILE HEADER CARD */}
        <Card style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {`${fullName[0] || 'M'}`.toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{fullName}</Text>
            {memberId ? (
              <Text style={styles.memberIdText}>Member ID: {memberId}</Text>
            ) : null}
            <View style={styles.badgeRow}>
              <StatusBadge variant="active" label="Verified Member" size="sm" />
            </View>
          </View>
        </Card>

        {/* CONTACT INFORMATION */}
        <Text style={styles.sectionTitle}>Contact Details</Text>
        <Card style={styles.card}>
          <View style={styles.itemRow}>
            <View style={styles.iconCircle}>
              <Phone size={18} color={Colors.textPrimary} />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemLabel}>Phone Number</Text>
              <Text style={styles.itemValue}>{profile?.phone || user?.phone || 'N/A'}</Text>
            </View>
          </View>

          {profile?.email || user?.email ? (
            <View style={[styles.itemRow, { borderBottomWidth: 0 }]}>
              <View style={styles.iconCircle}>
                <Mail size={18} color={Colors.textPrimary} />
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemLabel}>Email Address</Text>
                <Text style={styles.itemValue}>{profile?.email || user?.email}</Text>
              </View>
            </View>
          ) : null}
        </Card>

        {/* PAYMENT RECEIPTS (MEMBER SCOPED) */}
        <Text style={styles.sectionTitle}>Payment Receipts</Text>
        {loadingPayments ? (
          <LoadingState message="Loading payment history..." />
        ) : payments.length === 0 ? (
          <Card style={styles.card}>
            <Text style={styles.emptyReceiptsText}>No past fee receipts recorded yet.</Text>
          </Card>
        ) : (
          <Card style={styles.card}>
            {payments.map((p: Payment, idx: number) => (
              <View
                key={p.id || idx}
                style={[
                  styles.itemRow,
                  idx === payments.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={styles.iconCircle}>
                  <Receipt size={18} color={Colors.textPrimary} />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemValue}>₹{p.amount}</Text>
                  <Text style={styles.itemLabel}>
                    {p.receiptNumber} • {p.paymentMethod}
                  </Text>
                </View>
                <Text style={styles.receiptDate}>
                  {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : 'Paid'}
                </Text>
              </View>
            ))}
          </Card>
        )}

        {/* APP INFO */}
        <Text style={styles.sectionTitle}>Software System</Text>
        <Card style={styles.card}>
          <View style={[styles.itemRow, { borderBottomWidth: 0 }]}>
            <View style={styles.iconCircle}>
              <Info size={18} color={Colors.textPrimary} />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemLabel}>obo Smart Gym Management</Text>
              <Text style={styles.appMetaText}>Version 1.0.0 • Member Pass Edition</Text>
            </View>
          </View>
        </Card>

        {/* LOGOUT */}
        <Button
          title="Sign Out of Account"
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
    fontSize: 22,
    color: Colors.textPrimary,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...Typography.cardTitle,
    color: Colors.textPrimary,
  },
  memberIdText: {
    ...Typography.mono,
    fontSize: 12,
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
  receiptDate: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  emptyReceiptsText: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.sm,
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
