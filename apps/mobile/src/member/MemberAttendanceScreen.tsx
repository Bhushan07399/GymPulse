/**
 * obo Mobile — Member Attendance Screen
 * Displays personal attendance workout logs, streak, and check-out action.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Award, Clock, Camera } from 'lucide-react-native';
import { memberService } from '../api';
import {
  ScreenContainer,
  Header,
  Card,
  Button,
  StatusBadge,
  AttendanceRow,
  LoadingState,
  ErrorState,
  EmptyState,
  GymQrScannerModal,
} from '../components/common';
import { Colors, Spacing, Typography, Radius } from '../theme';
import { MemberAttendanceItem } from '../types';

export const MemberAttendanceScreen = () => {
  const queryClient = useQueryClient();
  const [scannerVisible, setScannerVisible] = useState(false);

  const {
    data,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['memberAttendance'],
    queryFn: () => memberService.getAttendanceHistory(),
  });

  const checkOutMutation = useMutation({
    mutationFn: () => memberService.checkOut(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['memberAttendance'] });
      queryClient.invalidateQueries({ queryKey: ['memberDashboard'] });
      Alert.alert('Checked Out', res.message || 'Check-out recorded successfully.');
    },
    onError: (err: any) => {
      Alert.alert('Checkout Error', err.message || 'Unable to record check-out.');
    },
  });

  const handleScanGymQr = async (qrPayload: string) => {
    const res = await memberService.scanGymQr(qrPayload);
    await refetch();
    queryClient.invalidateQueries({ queryKey: ['memberDashboard'] });
    return {
      success: res.action === 'CHECK_IN',
      message: res.message,
    };
  };

  const today = data?.today;
  const isCheckedInToday = today?.status === 'CHECKED_IN' || today?.checkedIn;
  const logs = data?.attendance || [];

  return (
    <ScreenContainer scrollable={false}>
      {/* HEADER */}
      <Header
        title="Attendance History"
        subtitle={`${data?.totalCheckIns || logs.length} total gym visits`}
      />

      {/* TODAY STATUS CARD */}
      <View style={styles.todayCardWrap}>
        <Card style={styles.todayCard}>
          <View style={styles.todayTop}>
            <View>
              <Text style={styles.todayLabel}>TODAY'S STATUS</Text>
              <Text style={styles.todayTitle}>
                {isCheckedInToday ? 'Checked in at gym' : today?.status === 'CHECKED_OUT' ? 'Checked out today' : 'Not checked in yet'}
              </Text>
            </View>
            <StatusBadge
              variant={isCheckedInToday ? 'active' : 'neutral'}
              label={isCheckedInToday ? 'In Gym' : 'Not In Gym'}
              size="sm"
            />
          </View>

          {isCheckedInToday ? (
            <View style={styles.todayBottom}>
              <Text style={styles.timeInfo}>Check-in: {today?.checkInTime ? new Date(today.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recorded'}</Text>
              <Button
                title="Check Out"
                variant="danger"
                size="sm"
                onPress={() => checkOutMutation.mutate()}
                loading={checkOutMutation.isPending}
              />
            </View>
          ) : (
            <View style={styles.todayBottom}>
              <Text style={styles.timeInfo}>Ready for today's workout?</Text>
              <Button
                title="Scan Gym QR"
                size="sm"
                onPress={() => setScannerVisible(true)}
              />
            </View>
          )}
        </Card>
      </View>

      {/* ATTENDANCE HISTORY LIST */}
      {isLoading ? (
        <LoadingState message="Loading workout attendance logs..." />
      ) : error ? (
        <ErrorState message={(error as Error).message} onRetry={refetch} />
      ) : logs.length === 0 ? (
        <EmptyState
          title="No Attendance History"
          description="Your verified gym check-in records will show here."
          actionTitle="Scan Gym Entry QR"
          onAction={() => setScannerVisible(true)}
        />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AttendanceRow
              record={item}
              onCheckOut={item.status === 'IN' ? () => checkOutMutation.mutate() : undefined}
            />
          )}
          refreshing={isRefetching}
          onRefresh={refetch}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Spacing.xl }}
        />
      )}

      {/* SCANNER MODAL */}
      <GymQrScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScan={handleScanGymQr}
        title="Scan Gym Entry QR"
        subtitle="Align the QR code displayed at the entrance"
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  todayCardWrap: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  todayCard: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
  },
  todayTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  todayLabel: {
    ...Typography.badge,
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  todayTitle: {
    ...Typography.cardTitle,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  todayBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.xs,
  },
  timeInfo: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
});
