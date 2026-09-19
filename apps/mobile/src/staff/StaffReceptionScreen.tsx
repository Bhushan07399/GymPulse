/**
 * obo Mobile — Staff Reception Screen
 * Desk view for receptionists: scan passes, manual check-in, quick member search,
 * and live desk visits.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, UserCheck, Search, Users, ClipboardList } from 'lucide-react-native';
import { useAuth } from '../store/auth.context';
import { staffService } from '../api';
import {
  ScreenContainer,
  Header,
  Card,
  StatusBadge,
  AttendanceRow,
  LoadingState,
  ErrorState,
  EmptyState,
  GymQrScannerModal,
} from '../components/common';
import { ManualCheckInModal } from '../owner/ManualCheckInModal';
import { Colors, Spacing, Typography, Radius } from '../theme';
import { AttendanceRecord } from '../types';

interface StaffReceptionScreenProps {
  navigation: any;
}

export const StaffReceptionScreen = ({ navigation }: StaffReceptionScreenProps) => {
  const { user, session } = useAuth();
  const gym = session?.activeGym;
  const queryClient = useQueryClient();

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
    queryKey: ['staffTodayLedger', gym?.id],
    queryFn: () => staffService.getTodayLedger(),
  });

  const checkOutMutation = useMutation({
    mutationFn: (id: string) => staffService.checkOut(id),
    onSuccess: () => {
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

  const handleScanQr = async (qrData: string) => {
    const res = await staffService.scanQrCode({ qrData });
    await refetch();
    return {
      success: !res.alreadyCheckedIn,
      message: res.message || (res.alreadyCheckedIn ? 'Member already checked in today.' : 'Check-in confirmed!'),
    };
  };

  const handleCheckOut = (id: string) => {
    setCheckingOutId(id);
    checkOutMutation.mutate(id);
  };

  const currentlyIn = records.filter((r) => !r.checkOutTime).length;

  return (
    <ScreenContainer scrollable={false}>
      {/* HEADER */}
      <Header
        title={gym?.name || 'Reception Desk'}
        subtitle={`Staff: ${user?.firstName} ${user?.lastName}`}
        rightElement={
          <StatusBadge label="On Duty" variant="active" size="sm" />
        }
      />

      {/* QUICK CHECK-IN ACTION CARDS */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionCard, styles.actionCardPrimary]}
          onPress={() => setScannerVisible(true)}
          activeOpacity={0.8}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#FFFFFF' }]}>
            <Camera size={22} color={Colors.primary} />
          </View>
          <Text style={[styles.actionTitle, { color: '#FFFFFF' }]}>Scan Pass</Text>
          <Text style={[styles.actionSubtitle, { color: '#94A3B8' }]}>QR Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => setManualModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={styles.iconCircle}>
            <UserCheck size={22} color={Colors.textPrimary} />
          </View>
          <Text style={styles.actionTitle}>Manual Entry</Text>
          <Text style={styles.actionSubtitle}>By Member ID</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('MembersTab')}
          activeOpacity={0.8}
        >
          <View style={styles.iconCircle}>
            <Search size={22} color={Colors.textPrimary} />
          </View>
          <Text style={styles.actionTitle}>Lookup</Text>
          <Text style={styles.actionSubtitle}>Find Member</Text>
        </TouchableOpacity>
      </View>

      {/* LIVE ATTENDANCE LEDGER TITLE */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Today's Reception Ledger</Text>
          <Text style={styles.sectionSub}>
            {records.length} visits • {currentlyIn} currently in gym
          </Text>
        </View>
      </View>

      {/* LEDGER LIST */}
      {isLoading ? (
        <LoadingState message="Loading today's visits..." />
      ) : error ? (
        <ErrorState message={(error as Error).message} onRetry={refetch} />
      ) : records.length === 0 ? (
        <EmptyState
          title="No Visits Today"
          description="No member check-ins have been recorded at the desk yet today."
          actionTitle="Scan First Pass"
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

      {/* MODALS */}
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
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionCardPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    backgroundColor: Colors.container,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  actionTitle: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  actionSubtitle: {
    ...Typography.caption,
    fontSize: 10,
    color: Colors.textMuted,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.sectionTitle,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  sectionSub: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
