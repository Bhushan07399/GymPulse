import React from 'react';
import { StyleSheet, View, Text, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import '../lib/i18n';
import { Colors } from '../theme/colors';
import { memberAttendanceService } from '../services/attendance.service';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { Header } from '../components/ui/Header';
import { AttendanceRow } from '../components/member/AttendanceRow';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';

export const AttendanceHistoryScreen = () => {
  const { t } = useTranslation();
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['memberAttendanceHistory'],
    queryFn: () => memberAttendanceService.getAttendanceHistory(),
  });

  const attendanceList = data?.attendance || [];

  return (
    <ScreenContainer scrollable={false}>
      <Header
        title={t('attendance.ledger', 'Attendance Ledger')}
        subtitle={data ? `${t('attendance.totalCheckins', 'Total Check-ins')}: ${data.totalCheckIns}` : t('attendance.history', 'Your gym visit logs')}
      />

      {isLoading ? (
        <LoadingState message={t('common.loading', 'Fetching attendance history...')} />
      ) : error ? (
        <ErrorState message={(error as Error).message} onRetry={refetch} />
      ) : attendanceList.length === 0 ? (
        <EmptyState
          icon="🗓️"
          title={t('attendance.noAttendance', 'No Check-ins Yet')}
          description={t('qrPass.showAtReception', 'Your attendance logs will appear here whenever you scan your digital pass at the reception desk.')}
        />
      ) : (
        <FlatList
          data={attendanceList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <AttendanceRow item={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isRefetching}
        />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 20,
  },
});
