import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import '../lib/i18n';
import { Colors } from '../theme/colors';
import { useAuth } from '../store/auth.context';
import { dashboardService } from '../services/dashboard.service';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { Header } from '../components/ui/Header';
import { KpiCard } from '../components/ui/KpiCard';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { Card } from '../components/ui/Card';

interface OwnerDashboardScreenProps {
  navigation: any;
}

export const OwnerDashboardScreen = ({ navigation }: OwnerDashboardScreenProps) => {
  const { t } = useTranslation();
  const { user, gym, logout } = useAuth();

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: () => dashboardService.getSummary(),
  });

  return (
    <ScreenContainer
      scrollable
      refreshing={isRefetching}
      onRefresh={refetch}
    >
      <Header
        title={gym?.name || 'GymPulse Fitness'}
        subtitle={`Logged in as ${user?.firstName || 'Owner'} (${user?.role || 'owner'})`}
        rightElement={
          <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.7}>
            <Text style={styles.logoutText}>{t('common.logout', 'Logout')}</Text>
          </TouchableOpacity>
        }
      />

      {/* QUICK RECEPTION ACTIONS BAR */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('dashboard.receptionActions', 'Reception Actions')}</Text>
      </View>

      <View style={styles.quickActionsGrid}>
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: Colors.slate900 }]}
          onPress={() => navigation.navigate('ReceptionScanner')}
          activeOpacity={0.8}
        >
          <Text style={styles.actionIcon}>📷</Text>
          <Text style={[styles.actionTitle, { color: Colors.primary }]}>{t('dashboard.scanQR', 'Scan QR Pass')}</Text>
          <Text style={styles.actionSub}>{t('dashboard.receptionScanner', 'Reception Scanner')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: Colors.surface }]}
          onPress={() => navigation.navigate('AddMember')}
          activeOpacity={0.8}
        >
          <Text style={styles.actionIcon}>👤+</Text>
          <Text style={styles.actionTitleDark}>{t('dashboard.addMember', 'Add Member')}</Text>
          <Text style={styles.actionSubDark}>{t('dashboard.quickRegistration', 'Quick Registration')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: Colors.surface }]}
          onPress={() => navigation.navigate('CollectPayment')}
          activeOpacity={0.8}
        >
          <Text style={styles.actionIcon}>💳</Text>
          <Text style={styles.actionTitleDark}>{t('dashboard.recordFee', 'Record Fee')}</Text>
          <Text style={styles.actionSubDark}>{t('dashboard.collectPayment', 'Collect Payment')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: Colors.surface }]}
          onPress={() => navigation.navigate('AttendanceLedger')}
          activeOpacity={0.8}
        >
          <Text style={styles.actionIcon}>📋</Text>
          <Text style={styles.actionTitleDark}>{t('dashboard.attendance', 'Attendance')}</Text>
          <Text style={styles.actionSubDark}>{t('dashboard.todaysLedger', 'Today\'s Ledger')}</Text>
        </TouchableOpacity>
      </View>

      {/* OPERATIONAL KPIS */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('dashboard.operationalOverview', 'Operational Overview')}</Text>
      </View>

      {isLoading ? (
        <LoadingState message={t('common.loading', 'Loading dashboard KPIs...')} />
      ) : error ? (
        <ErrorState message={(error as Error).message} onRetry={refetch} />
      ) : (
        <>
          <View style={styles.kpiGrid}>
            <KpiCard
              title={t('dashboard.activeMembers', 'Active Members')}
              value={data?.activeMembers ?? 0}
              subtitle={`${t('members.totalRegistered', 'Total registered')}: ${data?.totalMembers ?? 0}`}
              accentColor={Colors.success}
              badgeText={t('dashboard.liveLabel', 'Live')}
            />
            <KpiCard
              title={t('dashboard.todayCheckIns', 'Today\'s Check-ins')}
              value={data?.todayCheckIns ?? 0}
              subtitle={t('attendance.ledger', 'Attendance ledger')}
              accentColor={Colors.info}
            />
          </View>

          {/* REVENUE BREAKDOWN - DISTINCT GYM VS CLASS REVENUE */}
          <Card style={styles.revenueCard}>
            <Text style={styles.revenueHeader}>{t('dashboard.financials', 'Financial Breakdown')}</Text>
            
            <View style={styles.revenueRow}>
              <View style={styles.revenueItem}>
                <Text style={styles.revenueLabel}>{t('dashboard.membershipRevenue', 'Gym Membership Rev')}</Text>
                <Text style={styles.revenueValue}>₹{(data?.membershipRevenue ?? 0).toLocaleString('en-IN')}</Text>
              </View>

              <View style={styles.revenueDivider} />

              <View style={styles.revenueItem}>
                <Text style={styles.revenueLabel}>{t('dashboard.classRevenue', 'Class Revenue')}</Text>
                <Text style={[styles.revenueValue, { color: Colors.info }]}>₹{(data?.classRevenue ?? 0).toLocaleString('en-IN')}</Text>
              </View>
            </View>

            <View style={styles.revenueFooter}>
              <Text style={styles.totalLabel}>{t('dashboard.totalRevenue', 'Total Business Revenue')}:</Text>
              <Text style={styles.totalValue}>₹{((data?.membershipRevenue ?? 0) + (data?.classRevenue ?? 0)).toLocaleString('en-IN')}</Text>
            </View>
          </Card>
        </>
      )}

    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  langHeaderBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: Colors.slate100,
  },
  langHeaderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate700,
  },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.slate100,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.danger,
  },
  sectionHeader: {
    marginTop: 10,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.slate900,
    letterSpacing: -0.2,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  actionCard: {
    width: '48%',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionIcon: {
    fontSize: 22,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  actionSub: {
    fontSize: 11,
    color: Colors.slate400,
    marginTop: 2,
  },
  actionTitleDark: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.slate900,
  },
  actionSubDark: {
    fontSize: 11,
    color: Colors.slate500,
    marginTop: 2,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  revenueCard: {
    backgroundColor: Colors.surface,
    marginTop: 4,
    padding: 16,
  },
  revenueHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.slate900,
    marginBottom: 12,
  },
  revenueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  revenueItem: {
    flex: 1,
  },
  revenueDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.border,
    marginHorizontal: 12,
  },
  revenueLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.slate500,
    marginBottom: 4,
  },
  revenueValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.success,
  },
  revenueFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.slate700,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.slate900,
  },
});
