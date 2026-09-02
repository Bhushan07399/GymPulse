import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import '../lib/i18n';
import { Colors } from '../theme/colors';
import { useMemberAuth } from '../store/auth.context';
import { memberDashboardService } from '../services/dashboard.service';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { Header } from '../components/ui/Header';
import { MembershipStatusCard } from '../components/member/MembershipStatusCard';
import { Card } from '../components/ui/Card';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { LanguageSelectorModal } from '../components/LanguageSelectorModal';

interface MemberDashboardScreenProps {
  navigation: any;
}

export const MemberDashboardScreen = ({ navigation }: MemberDashboardScreenProps) => {
  const { t, i18n } = useTranslation();
  const { logout } = useMemberAuth();
  const [langModalVisible, setLangModalVisible] = useState(false);

  const { data: summary, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['memberDashboard'],
    queryFn: () => memberDashboardService.getSummary(),
  });

  const getLangLabel = () => {
    const code = i18n.language || 'en';
    if (code === 'hi') return 'हिंदी';
    if (code === 'mr') return 'मराठी';
    return 'EN';
  };

  return (
    <ScreenContainer onRefresh={refetch} refreshing={isRefetching}>
      <Header
        title={summary?.member?.gymName || t('nav.dashboard', 'My Gym')}
        subtitle="GymPulse Member App"
        rightElement={
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <TouchableOpacity style={styles.langHeaderBtn} onPress={() => setLangModalVisible(true)} activeOpacity={0.7}>
              <Text style={styles.langHeaderBtnText}>🌐 {getLangLabel()}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={logout} style={styles.logoutBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.logoutText}>{t('common.logout', 'Logout')} 🚪</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {isLoading ? (
        <LoadingState message={t('common.loading', 'Loading your membership details...')} />
      ) : error ? (
        <ErrorState message={(error as Error).message} onRetry={refetch} />
      ) : summary ? (
        <>
          <MembershipStatusCard summary={summary} />

          <Text style={styles.sectionTitle}>{t('dashboard.operationalOverview', 'Quick Access')}</Text>
          <View style={styles.gridRow}>
            <Card style={styles.gridCard} onPress={() => navigation.navigate('QrPassTab')}>
              <Text style={styles.gridIcon}>📱</Text>
              <Text style={styles.gridTitle}>{t('qrPass.title', 'Digital QR Pass')}</Text>
              <Text style={styles.gridDesc}>{t('qrPass.showAtReception', 'Show at reception for check-in')}</Text>
            </Card>

            {Boolean(summary?.hasClassFeature && summary?.hasClassEntitlement) && (
              <Card style={styles.gridCard} onPress={() => navigation.navigate('ClassesTab')}>
                <Text style={styles.gridIcon}>🏋️</Text>
                <Text style={styles.gridTitle}>{t('classes.title', 'Group Classes')}</Text>
                <Text style={styles.gridDesc}>{t('classes.browseClasses', 'Browse & book daily sessions')}</Text>
              </Card>
            )}
          </View>

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

      <LanguageSelectorModal
        visible={langModalVisible}
        onClose={() => setLangModalVisible(false)}
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
});
