/**
 * obo Mobile — Staff Attendance Screen
 * Dedicated attendance ledger for desk staff with QR scanning and checkout.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, Plus } from 'lucide-react-native';
import { useAuth } from '../store/auth.context';
import { staffService } from '../api';
import {
  ScreenContainer,
  Header,
  SearchInput,
  AttendanceRow,
  LoadingState,
  ErrorState,
  EmptyState,
  GymQrScannerModal,
} from '../components/common';
import { ManualCheckInModal } from '../owner/ManualCheckInModal';
import { Colors, Spacing, Radius } from '../theme';
import { AttendanceRecord } from '../types';

export const StaffAttendanceScreen = () => {
  const { session } = useAuth();
  const gymId = session?.gymId;
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [scannerVisible, setScannerVisible] = useState(false);
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [checkingOutId, setCheckingOutId] = useState<string | null>(null);

  const {
    data: records = [],
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['staffAttendance', gymId, search],
    queryFn: () => staffService.getTodayLedger({ search: search.trim() || undefined }),
  });

  const checkOutMutation = useMutation({
    mutationFn: (id: string) => staffService.checkOut(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffAttendance'] });
      queryClient.invalidateQueries({ queryKey: ['staffTodayLedger'] });
      Alert.alert('Checked Out', 'Member check-out recorded successfully.');
    },
    onError: (err: any) => {
      Alert.alert('Checkout Error', err.message || 'Unable to record check-out.');
    },
    onSettled: () => {
      setCheckingOutId(null);
    },
  });

  const handleCheckOut = (id: string) => {
    setCheckingOutId(id);
    checkOutMutation.mutate(id);
  };

  const handleScanQr = async (qrData: string) => {
    const res = await staffService.scanQrCode({ qrData });
    await refetch();
    return {
      success: !res.alreadyCheckedIn,
      message: res.message || (res.alreadyCheckedIn ? 'Member already checked in today.' : 'Check-in confirmed!'),
    };
  };

  return (
    <ScreenContainer scrollable={false}>
      {/* HEADER */}
      <Header
        title="Attendance Ledger"
        subtitle={`${records.length} total visits today`}
        rightElement={
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setManualModalVisible(true)}
              activeOpacity={0.8}
            >
              <Plus size={16} color={Colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnPrimary]}
              onPress={() => setScannerVisible(true)}
              activeOpacity={0.8}
            >
              <Camera size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        }
      />

      <View style={styles.searchWrap}>
        <SearchInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search attendee by name or ID..."
          onClear={() => setSearch('')}
        />
      </View>

      {/* LIST OR STATES */}
      {isLoading ? (
        <LoadingState message="Loading today's attendance..." />
      ) : error ? (
        <ErrorState message={(error as Error).message} onRetry={refetch} />
      ) : records.length === 0 ? (
        <EmptyState
          title="No Check-ins Found"
          description={
            search
              ? `No check-ins matching "${search}" found.`
              : 'No members have checked in at reception today.'
          }
          actionTitle="Scan QR Pass"
          onAction={() => setScannerVisible(true)}
        />
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AttendanceRow
              record={item}
              onCheckOut={handleCheckOut}
              isCheckingOut={checkingOutId === item.id}
            />
          )}
          refreshing={isRefetching}
          onRefresh={refetch}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Spacing.xl }}
        />
      )}

      {/* SCANNER & MANUAL ENTRY MODALS */}
      <GymQrScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScan={handleScanQr}
        title="Reception Pass Scanner"
        subtitle="Align the member's digital QR pass within the frame"
      />

      <ManualCheckInModal
        visible={manualModalVisible}
        onClose={() => setManualModalVisible(false)}
        onSuccess={() => refetch()}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.container,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  searchWrap: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
});
