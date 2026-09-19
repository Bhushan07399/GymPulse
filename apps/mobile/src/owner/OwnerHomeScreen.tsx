/**
 * obo Mobile — Owner Home Screen
 * Authoritative dashboard for gym owners with real-time KPIs, financial breakdown,
 * quick reception action shortcuts, and multi-gym branch context.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  Camera,
  UserPlus,
  CreditCard,
  ClipboardList,
  Building,
  RefreshCw,
  Users,
  AlertTriangle,
} from 'lucide-react-native';
import { useAuth } from '../store/auth.context';
import { ownerService } from '../api';
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
import { AddMemberModal } from './AddMemberModal';
import { CollectPaymentModal } from './CollectPaymentModal';
import { BranchSwitchModal } from './BranchSwitchModal';
import { Colors, Spacing, Typography, Radius } from '../theme';

interface OwnerHomeScreenProps {
  navigation: any;
}

export const OwnerHomeScreen = ({ navigation }: OwnerHomeScreenProps) => {
  const { user, session } = useAuth();
  const gym = session?.activeGym;

  // Modals state
  const [scannerVisible, setScannerVisible] = useState(false);
  const [addMemberVisible, setAddMemberVisible] = useState(false);
  const [collectPaymentVisible, setCollectPaymentVisible] = useState(false);
  const [branchSwitchVisible, setBranchSwitchVisible] = useState(false);

  const {
    data: summary,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['dashboardSummary', gym?.id],
    queryFn: () => ownerService.getDashboardSummary(),
  });

  const handleScanQr = async (qrData: string) => {
    const res = await ownerService.scanQrCode({ qrData });
    await refetch();
    return {
      success: !res.alreadyCheckedIn,
      message: res.message || (res.alreadyCheckedIn ? 'Member already checked in today.' : 'Check-in recorded!'),
    };
  };

  return (
    <ScreenContainer scrollable refreshing={isRefetching} onRefresh={refetch}>
      {/* HEADER WITH BRANCH & OWNER CONTEXT */}
      <Header
        title={gym?.name || 'obo Gym Management'}
        subtitle={`Owner: ${user?.firstName} ${user?.lastName}`}
        rightElement={
          gym?.isMultiGym ? (
            <TouchableOpacity
              style={styles.branchSwitchBtn}
              onPress={() => setBranchSwitchVisible(true)}
              activeOpacity={0.7}
            >
              <Building size={14} color={Colors.textPrimary} />
              <Text style={styles.branchSwitchText}>Branches</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      <View style={styles.content}>
        {/* BRANCH / SUBSCRIPTION CONTEXT CARD */}
        <Card style={styles.branchCard}>
          <View style={styles.branchCardHeader}>
            <View>
              <Text style={styles.branchLabel}>ACTIVE LOCATION</Text>
              <Text style={styles.branchName} numberOfLines={1}>
                {gym?.name || 'Primary Gym'}
              </Text>
            </View>
            <StatusBadge
              label={gym?.subscriptionStatus || 'Active'}
              variant="active"
              size="sm"
            />
          </View>
          <View style={styles.planMetaRow}>
            <Text style={styles.planMeta}>
              Base Plan: {gym?.subscriptionPlan || 'Growth'}
            </Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.planMeta}>
              Billing: {gym?.billingCycle ? gym.billingCycle.charAt(0).toUpperCase() + gym.billingCycle.slice(1) : 'Monthly'}
            </Text>
            {gym?.isMultiGym ? (
              <>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.planMetaHighlight}>
                  {gym.maxLocations || 1} Locations
                </Text>
              </>
            ) : null}
          </View>
        </Card>

        {/* QUICK RECEPTION ACTIONS BAR */}
        <Text style={styles.sectionTitle}>Reception Quick Actions</Text>
        <View style={styles.quickGrid}>
          <TouchableOpacity
            style={[styles.quickCard, styles.quickCardPrimary]}
            onPress={() => setScannerVisible(true)}
            activeOpacity={0.8}
          >
            <View style={[styles.quickIconCircle, { backgroundColor: '#FFFFFF' }]}>
              <Camera size={20} color={Colors.primary} />
            </View>
            <Text style={[styles.quickTitle, { color: '#FFFFFF' }]}>Scan Pass</Text>
            <Text style={[styles.quickSubtitle, { color: '#94A3B8' }]}>QR Check-in</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => setAddMemberVisible(true)}
            activeOpacity={0.8}
          >
            <View style={styles.quickIconCircle}>
              <UserPlus size={20} color={Colors.textPrimary} />
            </View>
            <Text style={styles.quickTitle}>Add Member</Text>
            <Text style={styles.quickSubtitle}>Walk-in</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => setCollectPaymentVisible(true)}
            activeOpacity={0.8}
          >
            <View style={styles.quickIconCircle}>
              <CreditCard size={20} color={Colors.textPrimary} />
            </View>
            <Text style={styles.quickTitle}>Record Fee</Text>
            <Text style={styles.quickSubtitle}>Collect</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate('AttendanceTab')}
            activeOpacity={0.8}
          >
            <View style={styles.quickIconCircle}>
              <ClipboardList size={20} color={Colors.textPrimary} />
            </View>
            <Text style={styles.quickTitle}>Attendance</Text>
            <Text style={styles.quickSubtitle}>Ledger</Text>
          </TouchableOpacity>
        </View>

        {/* OPERATIONAL KPIS */}
        <Text style={styles.sectionTitle}>Today's Operational Overview</Text>

        {isLoading ? (
          <LoadingState message="Loading dashboard KPIs..." />
        ) : error ? (
          <ErrorState message={(error as Error).message} onRetry={refetch} />
        ) : (
          <>
            <View style={styles.kpiRow}>
              <KpiCard
                title="Active Members"
                value={summary?.activeMembers ?? 0}
                subtitle={`Total registered: ${summary?.totalMembers ?? 0}`}
                icon={<Users size={18} color={Colors.textMuted} />}
              />
              <KpiCard
                title="Today's Check-ins"
                value={summary?.todayCheckIns ?? 0}
                subtitle="Live desk visits"
                icon={<ClipboardList size={18} color={Colors.textMuted} />}
              />
            </View>

            {/* EXPIRY ALERTS BANNER (IF ANY) */}
            {summary?.expiredMembers && summary.expiredMembers > 0 ? (
              <TouchableOpacity
                style={styles.alertCard}
                onPress={() => navigation.navigate('MembersTab')}
                activeOpacity={0.8}
              >
                <AlertTriangle size={18} color={Colors.warning} />
                <View style={styles.alertTextWrap}>
                  <Text style={styles.alertTitle}>Membership Expiry Alerts</Text>
                  <Text style={styles.alertSub}>
                    {summary.expiredMembers} members have expired memberships.
                  </Text>
                </View>
              </TouchableOpacity>
            ) : null}

            {/* FINANCIAL BREAKDOWN CARD */}
            <Card style={styles.financeCard}>
              <View style={styles.financeHeader}>
                <Text style={styles.financeTitle}>REVENUE BREAKDOWN</Text>
                <Text style={styles.financeCurrency}>INR (₹)</Text>
              </View>

              <View style={styles.financeRow}>
                <View style={styles.financeItem}>
                  <Text style={styles.financeItemLabel}>Gym Memberships</Text>
                  <Text style={styles.financeItemValue}>
                    ₹{(summary?.membershipRevenue ?? 0).toLocaleString('en-IN')}
                  </Text>
                </View>

                {summary?.hasClassFeature ? (
                  <>
                    <View style={styles.financeDivider} />
                    <View style={styles.financeItem}>
                      <Text style={styles.financeItemLabel}>Group Classes</Text>
                      <Text style={[styles.financeItemValue, { color: Colors.infoText }]}>
                        ₹{(summary?.classRevenue ?? 0).toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </>
                ) : null}
              </View>

              <View style={styles.financeFooter}>
                <View>
                  <Text style={styles.totalRevenueLabel}>Total Business Revenue</Text>
                  <Text style={styles.totalRevenueValue}>
                    ₹{((summary?.membershipRevenue ?? 0) + (summary?.hasClassFeature ? (summary?.classRevenue ?? 0) : 0)).toLocaleString('en-IN')}
                  </Text>
                </View>

                {Number(summary?.outstandingAmount) > 0 ? (
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.dueLabel}>Outstanding Dues</Text>
                    <Text style={styles.dueValue}>
                      ₹{Number(summary?.outstandingAmount).toLocaleString('en-IN')}
                    </Text>
                  </View>
                ) : null}
              </View>
            </Card>
          </>
        )}
      </View>

      {/* INTEGRATED RECEPTION MODALS */}
      <GymQrScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScan={handleScanQr}
        title="Reception Pass Scanner"
        subtitle="Scan member QR pass for immediate attendance check-in"
      />

      <AddMemberModal
        visible={addMemberVisible}
        onClose={() => setAddMemberVisible(false)}
        onSuccess={() => refetch()}
      />

      <CollectPaymentModal
        visible={collectPaymentVisible}
        onClose={() => setCollectPaymentVisible(false)}
        onSuccess={() => refetch()}
      />

      <BranchSwitchModal
        visible={branchSwitchVisible}
        onClose={() => setBranchSwitchVisible(false)}
        onSwitched={() => refetch()}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingVertical: Spacing.md,
  },
  branchSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.container,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.md,
    gap: 4,
  },
  branchSwitchText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  branchCard: {
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  branchCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  branchLabel: {
    ...Typography.badge,
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  branchName: {
    ...Typography.sectionTitle,
    color: Colors.textPrimary,
  },
  planMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  planMeta: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  planMetaHighlight: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '700',
  },
  dot: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginHorizontal: 6,
  },
  sectionTitle: {
    ...Typography.sectionTitle,
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  quickCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickCardPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  quickIconCircle: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: Colors.container,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  quickTitle: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  quickSubtitle: {
    ...Typography.caption,
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warningBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
    marginBottom: Spacing.md,
  },
  alertTextWrap: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  alertTitle: {
    ...Typography.bodyBold,
    color: Colors.warningText,
  },
  alertSub: {
    ...Typography.caption,
    color: Colors.warningText,
  },
  financeCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  financeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    marginBottom: Spacing.md,
  },
  financeTitle: {
    ...Typography.badge,
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  financeCurrency: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  financeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  financeItem: {
    flex: 1,
  },
  financeItemLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  financeItemValue: {
    ...Typography.sectionTitle,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  financeDivider: {
    width: 1,
    backgroundColor: Colors.borderSubtle,
    marginHorizontal: Spacing.md,
  },
  financeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  totalRevenueLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  totalRevenueValue: {
    ...Typography.pageTitle,
    fontSize: 22,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  dueLabel: {
    ...Typography.caption,
    color: Colors.danger,
    fontWeight: '600',
  },
  dueValue: {
    ...Typography.cardTitle,
    color: Colors.danger,
    fontWeight: '800',
    marginTop: 2,
  },
});
