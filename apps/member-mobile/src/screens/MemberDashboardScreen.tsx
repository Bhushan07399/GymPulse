import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import '../lib/i18n';
import { Colors } from '../theme/colors';
import { useMemberAuth } from '../store/auth.context';
import { memberDashboardService } from '../services/dashboard.service';
import { memberAttendanceService } from '../services/attendance.service';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { Header } from '../components/ui/Header';
import { MembershipStatusCard } from '../components/member/MembershipStatusCard';
import { GymQrScannerModal } from '../components/member/GymQrScannerModal';
import { Card } from '../components/ui/Card';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';

interface MemberDashboardScreenProps {
  navigation: any;
}

export const MemberDashboardScreen = ({ navigation }: MemberDashboardScreenProps) => {
  const { t } = useTranslation();
  const { member, logout } = useMemberAuth();
  const [scannerVisible, setScannerVisible] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const { data: summary, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['memberDashboardSummary'],
    queryFn: () => memberDashboardService.getSummary(),
  });

  const { data: attendanceHistory, refetch: refetchAttendance } = useQuery({
    queryKey: ['memberAttendanceHistory'],
    queryFn: () => memberAttendanceService.getAttendanceHistory(),
  });

  const todayAttendance = attendanceHistory?.today;
  const isCheckedIn = todayAttendance?.status === 'CHECKED_IN' || Boolean(todayAttendance?.checkedIn);
  const isCheckedOut =
    todayAttendance?.status === 'CHECKED_OUT' ||
    (!isCheckedIn && Boolean(todayAttendance?.checkOutTime));

  const handleDashboardCheckout = () => {
    Alert.alert(
      'Confirm Check-Out',
      'Are you ready to check out of the gym?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Check Out',
          style: 'destructive',
          onPress: async () => {
            setCheckingOut(true);
            try {
              await memberAttendanceService.checkOut();
              refetch();
              refetchAttendance();
              Alert.alert('Checked Out', 'Your gym session has ended. Have a great day!');
            } catch (err: any) {
              Alert.alert(
                'Checkout Failed',
                err.response?.data?.error?.message || err.message || 'Could not complete checkout.'
              );
            } finally {
              setCheckingOut(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer
      scrollable
      refreshing={isRefetching}
      onRefresh={() => {
        refetch();
        refetchAttendance();
      }}
    >
      <Header
        title={member?.gymName || 'GymPulse Fitness'}
        subtitle={`Member Pass #${member?.memberId || '...'}`}
        rightElement={
          <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.7}>
            <Text style={styles.logoutText}>{t('common.logout', 'Logout')}</Text>
          </TouchableOpacity>
        }
      />

      {isLoading ? (
        <LoadingState message={t('common.loading', 'Loading your membership details...')} />
      ) : error ? (
        <ErrorState message={(error as Error).message} onRetry={refetch} />
      ) : summary ? (
        <>
          <MembershipStatusCard summary={summary} />

          {/* Today's Gym Attendance Status Card */}
          {isCheckedIn ? (
            <View style={styles.todayCardActive}>
              <View style={styles.todayCardHeader}>
                <View style={styles.statusDotRow}>
                  <View style={styles.greenPulseDot} />
                  <Text style={styles.todayActiveTitle}>Currently Checked In</Text>
                </View>
                <View style={styles.inBadge}>
                  <Text style={styles.inBadgeText}>IN</Text>
                </View>
              </View>
              <Text style={styles.todayGymName}>{todayAttendance?.gymName || member?.gymName}</Text>
              <Text style={styles.todayTimeText}>
                Checked in at{' '}
                {todayAttendance?.checkInTime
                  ? new Date(todayAttendance.checkInTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'today'}
              </Text>
              <TouchableOpacity
                style={styles.checkoutBtn}
                onPress={handleDashboardCheckout}
                disabled={checkingOut}
                activeOpacity={0.8}
              >
                {checkingOut ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.checkoutBtnText}>🚪 Check Out</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : isCheckedOut ? (
            <View style={styles.todayCardCompleted}>
              <View style={styles.todayCardHeader}>
                <View style={styles.statusDotRow}>
                  <Text style={styles.completedIcon}>✓</Text>
                  <Text style={styles.todayCompletedTitle}>Checked Out Today</Text>
                </View>
                <View style={styles.completedBadge}>
                  <Text style={styles.completedBadgeText}>COMPLETED</Text>
                </View>
              </View>
              <Text style={styles.todayGymName}>{todayAttendance?.gymName || member?.gymName}</Text>
              <Text style={styles.todayTimeText}>
                In:{' '}
                {todayAttendance?.checkInTime
                  ? new Date(todayAttendance.checkInTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'N/A'}{' '}
                • Out:{' '}
                {todayAttendance?.checkOutTime
                  ? new Date(todayAttendance.checkOutTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'N/A'}
              </Text>
            </View>
          ) : (
            <View style={styles.todayCardEmpty}>
              <View style={styles.todayEmptyRow}>
                <View style={styles.todayEmptyLeft}>
                  <Text style={styles.todayEmptyTitle}>Today's Attendance</Text>
                  <Text style={styles.todayEmptySub}>Not checked in yet today</Text>
                </View>
                <TouchableOpacity
                  style={styles.scanGymQrBtn}
                  onPress={() => setScannerVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.scanGymQrBtnText}>📷 Scan Gym QR</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <Text style={styles.sectionTitle}>{t('dashboard.operationalOverview', 'Quick Access')}</Text>
          <View style={styles.gridRow}>
            <Card style={styles.gridCard} onPress={() => setScannerVisible(true)}>
              <Text style={styles.gridIcon}>📷</Text>
              <Text style={styles.gridTitle}>Scan Gym QR</Text>
              <Text style={styles.gridDesc}>Check in at gym QR code</Text>
            </Card>

            <Card style={styles.gridCard} onPress={() => navigation.navigate('QrPassTab')}>
              <Text style={styles.gridIcon}>📱</Text>
              <Text style={styles.gridTitle}>{t('qrPass.title', 'Digital QR Pass')}</Text>
              <Text style={styles.gridDesc}>{t('qrPass.showAtReception', 'Show at reception')}</Text>
            </Card>
          </View>

          {Boolean(summary?.hasClassFeature && summary?.hasClassEntitlement) && (
            <Card style={[styles.fullCard, { marginBottom: 12 }]} onPress={() => navigation.navigate('ClassesTab')}>
              <View style={styles.cardHeader}>
                <View style={styles.leftRow}>
                  <Text style={styles.cardIcon}>🏋️</Text>
                  <View>
                    <Text style={styles.cardTitle}>{t('classes.title', 'Group Classes')}</Text>
                    <Text style={styles.cardSub}>{t('classes.browseClasses', 'Browse & book daily sessions')}</Text>
                  </View>
                </View>
                <Text style={styles.arrowText}>›</Text>
              </View>
            </Card>
          )}

          <Card style={styles.fullCard} onPress={() => navigation.navigate('AttendanceTab')}>
            <View style={styles.cardHeader}>
              <View style={styles.leftRow}>
                <Text style={styles.cardIcon}>📊</Text>
                <View>
                  <Text style={styles.cardTitle}>{t('attendance.history', 'Attendance History')}</Text>
                  <Text style={styles.cardSub}>
                    {t('attendance.totalCheckins', 'Total Check-ins')}: {summary.attendance.totalCheckIns}
                  </Text>
                </View>
              </View>
              <Text style={styles.arrowText}>›</Text>
            </View>
          </Card>
        </>
      ) : null}

      <GymQrScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onSuccess={() => {
          refetch();
          refetchAttendance();
        }}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  langHeaderBtn: {
    backgroundColor: Colors.slate100,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  langHeaderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate700,
  },
  logoutBtn: {
    backgroundColor: Colors.slate100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.danger,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.slate900,
    marginBottom: 12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  gridCard: {
    flex: 1,
    padding: 16,
  },
  gridIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  gridTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.slate900,
    marginBottom: 4,
  },
  gridDesc: {
    fontSize: 11,
    color: Colors.slate500,
  },
  fullCard: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 26,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.slate900,
  },
  cardSub: {
    fontSize: 12,
    color: Colors.slate500,
    marginTop: 2,
  },
  arrowText: {
    fontSize: 22,
    color: Colors.slate400,
    fontWeight: '300',
  },
  todayCardActive: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  todayCardCompleted: {
    backgroundColor: Colors.slate100,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  todayCardEmpty: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  todayCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  greenPulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
  },
  completedIcon: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '900',
  },
  todayActiveTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#065F46',
  },
  todayCompletedTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.slate800,
  },
  inBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  inBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11,
  },
  completedBadge: {
    backgroundColor: Colors.slate200,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  completedBadgeText: {
    color: Colors.slate700,
    fontWeight: '700',
    fontSize: 10,
  },
  todayGymName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.slate900,
    marginTop: 4,
  },
  todayTimeText: {
    fontSize: 13,
    color: Colors.slate600,
    marginTop: 2,
    marginBottom: 12,
  },
  checkoutBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  todayEmptyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  todayEmptyLeft: {
    flex: 1,
    marginRight: 12,
  },
  todayEmptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.slate900,
  },
  todayEmptySub: {
    fontSize: 12,
    color: Colors.slate500,
    marginTop: 2,
  },
  scanGymQrBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  scanGymQrBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
