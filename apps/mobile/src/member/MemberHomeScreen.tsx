/**
 * obo Mobile — Member Home Screen
 * Member dashboard: membership validity, check-in status, quick QR scan entry,
 * checkout action, and visit statistics.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  QrCode,
  LogOut,
  Clock,
  Calendar,
  Award,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import { useAuth } from '../store/auth.context';
import { memberService } from '../api';
import {
  ScreenContainer,
  Header,
  Card,
  Button,
  StatusBadge,
  KpiCard,
  LoadingState,
  ErrorState,
  GymQrScannerModal,
} from '../components/common';
import { Colors, Spacing, Typography, Radius } from '../theme';

interface MemberHomeScreenProps {
  navigation: any;
}

export const MemberHomeScreen = ({ navigation }: MemberHomeScreenProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [scannerVisible, setScannerVisible] = useState(false);

  const {
    data: summary,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['memberDashboard'],
    queryFn: () => memberService.getDashboard(),
  });

  const checkOutMutation = useMutation({
    mutationFn: () => memberService.checkOut(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['memberDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['memberAttendance'] });
      Alert.alert('Checked Out', res.message || 'Check-out recorded successfully.');
    },
    onError: (err: any) => {
      Alert.alert('Checkout Error', err.message || 'Unable to record check-out.');
    },
  });

  const handleScanGymQr = async (qrPayload: string) => {
    const res = await memberService.scanGymQr(qrPayload);
    await refetch();
    queryClient.invalidateQueries({ queryKey: ['memberAttendance'] });
    return {
      success: res.action === 'CHECK_IN',
      message: res.message,
    };
  };

  const isExpired = summary?.membership.status === 'Expired' || (summary?.membership.daysRemaining ?? 1) <= 0;
  const isCurrentlyIn = summary?.attendance.lastCheckInDate && !summary.attendance.lastCheckInDate.includes('out');

  return (
    <ScreenContainer scrollable refreshing={isRefetching} onRefresh={refetch}>
      {/* HEADER */}
      <Header
        title={summary?.member.gymName || 'obo Gym'}
        subtitle={`Welcome back, ${user?.firstName || summary?.member.firstName || 'Member'}!`}
        rightElement={
          <TouchableOpacity
            style={styles.passHeaderBtn}
            onPress={() => navigation.navigate('PassTab')}
            activeOpacity={0.8}
          >
            <QrCode size={16} color="#FFFFFF" />
            <Text style={styles.passHeaderBtnText}>Pass</Text>
          </TouchableOpacity>
        }
      />

      <View style={styles.content}>
        {isLoading ? (
          <LoadingState message="Loading your membership..." />
        ) : error ? (
          <ErrorState message={(error as Error).message} onRetry={refetch} />
        ) : (
          <>
            {/* MEMBERSHIP STATUS CARD */}
            <Card style={styles.membershipCard}>
              <View style={styles.membershipTop}>
                <View>
                  <Text style={styles.cardBrand}>obo MEMBERSHIP</Text>
                  <Text style={styles.planName}>{summary?.membership.planName}</Text>
                </View>
                <StatusBadge
                  variant={isExpired ? 'expired' : 'active'}
                  label={summary?.membership.status || 'Active'}
                />
              </View>

              <View style={styles.membershipDivider} />

              <View style={styles.membershipBottom}>
                <View>
                  <Text style={styles.metaLabel}>EXPIRES ON</Text>
                  <Text style={[styles.metaValue, isExpired ? styles.textDanger : null]}>
                    {summary?.membership.expiryDate}
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.metaLabel}>DAYS REMAINING</Text>
                  <Text style={[styles.daysValue, isExpired ? styles.textDanger : null]}>
                    {isExpired ? '0' : summary?.membership.daysRemaining}
                  </Text>
                </View>
              </View>
            </Card>

            {/* LIVE ENTRY / CHECK-IN CARD */}
            <Card style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <View style={styles.entryIconBox}>
                  <Clock size={20} color={Colors.textPrimary} />
                </View>
                <View style={styles.entryInfo}>
                  <Text style={styles.entryTitle}>
                    {isCurrentlyIn ? 'Currently Working Out' : 'Ready to Workout?'}
                  </Text>
                  <Text style={styles.entrySubtitle}>
                    {isCurrentlyIn
                      ? 'You are checked in at the gym.'
                      : 'Scan the entrance QR or present your pass.'}
                  </Text>
                </View>
              </View>

              <View style={styles.entryActions}>
                {isCurrentlyIn ? (
                  <Button
                    title="Check Out of Gym"
                    variant="danger"
                    onPress={() => checkOutMutation.mutate()}
                    loading={checkOutMutation.isPending}
                    style={styles.entryBtn}
                  />
                ) : (
                  <Button
                    title="Scan Gym Entry QR"
                    onPress={() => setScannerVisible(true)}
                    style={styles.entryBtn}
                  />
                )}
                <Button
                  title="Show Pass"
                  variant="outline"
                  onPress={() => navigation.navigate('PassTab')}
                  style={styles.showPassBtn}
                />
              </View>
            </Card>

            {/* ATTENDANCE KPI ROW */}
            <Text style={styles.sectionTitle}>Your Fitness Activity</Text>
            <View style={styles.kpiRow}>
              <KpiCard
                title="Total Visits"
                value={summary?.attendance.totalCheckIns ?? 0}
                subtitle="All-time workouts"
                icon={<Award size={18} color={Colors.textMuted} />}
              />
              <KpiCard
                title="Last Check-in"
                value={summary?.attendance.lastCheckInDate ? 'Recorded' : 'None yet'}
                subtitle="Attendance verified"
                icon={<Calendar size={18} color={Colors.textMuted} />}
              />
            </View>

            {/* CLASSES SHORTCUT (IF ENABLED) */}
            {summary?.hasClassFeature ? (
              <TouchableOpacity
                style={styles.classesCard}
                onPress={() => navigation.navigate('ClassesTab')}
                activeOpacity={0.8}
              >
                <View style={styles.classesIconBox}>
                  <Sparkles size={20} color={Colors.primary} />
                </View>
                <View style={styles.classesInfo}>
                  <Text style={styles.classesTitle}>Group Fitness Classes</Text>
                  <Text style={styles.classesSub}>
                    Browse schedules, view instructors, and book your spot.
                  </Text>
                </View>
                <ChevronRight size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </>
        )}
      </View>

      {/* GYM QR SCANNER MODAL */}
      <GymQrScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScan={handleScanGymQr}
        title="Scan Gym Entry QR"
        subtitle="Point camera at the QR code displayed at gym entrance"
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingVertical: Spacing.md,
  },
  passHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radius.md,
    gap: 4,
  },
  passHeaderBtnText: {
    ...Typography.caption,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  membershipCard: {
    padding: Spacing.xl,
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  membershipTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardBrand: {
    ...Typography.badge,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  planName: {
    ...Typography.sectionTitle,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  membershipDivider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
    marginVertical: Spacing.lg,
  },
  membershipBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  metaLabel: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  metaValue: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  daysValue: {
    ...Typography.pageTitle,
    fontSize: 26,
    color: Colors.textPrimary,
  },
  textDanger: {
    color: Colors.danger,
  },
  entryCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  entryIconBox: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.container,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  entryInfo: {
    flex: 1,
  },
  entryTitle: {
    ...Typography.cardTitle,
    color: Colors.textPrimary,
  },
  entrySubtitle: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
  entryActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  entryBtn: {
    flex: 2,
  },
  showPassBtn: {
    flex: 1,
  },
  sectionTitle: {
    ...Typography.sectionTitle,
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  classesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  classesIconBox: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    backgroundColor: Colors.container,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  classesInfo: {
    flex: 1,
  },
  classesTitle: {
    ...Typography.cardTitle,
    color: Colors.textPrimary,
  },
  classesSub: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
