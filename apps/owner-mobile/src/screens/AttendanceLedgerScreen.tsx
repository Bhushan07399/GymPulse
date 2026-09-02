import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '../theme/colors';
import { attendanceService } from '../services/attendance.service';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { Header } from '../components/ui/Header';
import { SearchInput } from '../components/ui/SearchInput';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';
import { StatusBadge } from '../components/ui/StatusBadge';
import { AttendanceRecord } from '../types/attendance';

interface AttendanceLedgerScreenProps {
  navigation: any;
}

export const AttendanceLedgerScreen = ({ navigation }: AttendanceLedgerScreenProps) => {
  const [search, setSearch] = useState('');

  const { data: records = [], isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['todayLedger', search],
    queryFn: () => attendanceService.getTodayLedger({ search: search.trim() || undefined }),
  });

  return (
    <ScreenContainer scrollable={false}>
      <Header
        title="Today's Attendance"
        subtitle={`${records.length} check-ins today`}
        onBack={() => navigation.goBack()}
        rightElement={
          <TouchableOpacity
            style={styles.scanBtn}
            onPress={() => navigation.navigate('ReceptionScanner')}
            activeOpacity={0.8}
          >
            <Text style={styles.scanBtnText}>📷 Scan Pass</Text>
          </TouchableOpacity>
        }
      />

      <SearchInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search attendee by name or ID..."
      />

      {isLoading ? (
        <LoadingState message="Loading today's check-ins..." />
      ) : error ? (
        <ErrorState message={(error as Error).message} onRetry={refetch} />
      ) : records.length === 0 ? (
        <EmptyState
          iconText="📋"
          title="No Check-ins Today"
          description={
            search
              ? `No check-in matching "${search}"`
              : "No members have checked in at reception today."
          }
          actionTitle="Open Camera Scanner"
          onAction={() => navigation.navigate('ReceptionScanner')}
        />
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: AttendanceRecord }) => (
            <View style={styles.rowCard}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitials}>
                  {item.member
                    ? `${item.member.firstName?.[0] || ''}${item.member.lastName?.[0] || ''}`.toUpperCase()
                    : 'GP'}
                </Text>
              </View>

              <View style={styles.info}>
                <Text style={styles.memberName}>
                  {item.member ? `${item.member.firstName} ${item.member.lastName}` : 'Gym Member'}
                </Text>
                <Text style={styles.memberIdText}>
                  ID: {item.member?.memberId || 'N/A'} • Method: {item.checkInMethod || 'QR'}
                </Text>
              </View>

              <View style={styles.rightCol}>
                <StatusBadge status="PRESENT" label="Checked In" />
                <Text style={styles.timeText}>
                  {new Date(item.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          )}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isRefetching}
          contentContainerStyle={styles.listContent}
        />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scanBtn: {
    backgroundColor: Colors.slate900,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  scanBtnText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  listContent: {
    paddingBottom: 24,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.slate900,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarInitials: {
    color: Colors.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.slate900,
    marginBottom: 2,
  },
  memberIdText: {
    fontSize: 12,
    color: Colors.slate500,
  },
  rightCol: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.slate500,
    marginTop: 4,
  },
});
