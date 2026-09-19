/**
 * obo Mobile Design System — AttendanceRow Component
 * Renders check-in record in today's ledger and attendance history.
 */

import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { LogOut, QrCode, UserCheck } from 'lucide-react-native';
import { StatusBadge } from './StatusBadge';
import { AttendanceRecord, MemberAttendanceItem } from '../../types';
import { Colors, Typography, Spacing, Radius } from '../../theme';

export interface AttendanceRowProps {
  record: AttendanceRecord | MemberAttendanceItem;
  onCheckOut?: (recordId: string) => void;
  isCheckingOut?: boolean;
}

export const AttendanceRow = ({ record, onCheckOut, isCheckingOut }: AttendanceRowProps) => {
  const isMemberRow = 'attendanceDate' in record;
  const memberName = 'member' in record && record.member
    ? `${record.member.firstName || ''} ${record.member.lastName || ''}`.trim()
    : 'gymName' in record && record.gymName
    ? record.gymName
    : 'Member Check-in';

  const memberId = 'member' in record && record.member?.memberId
    ? record.member.memberId
    : 'memberId' in record
    ? (record as any).memberId
    : '';

  const checkInFormatted = record.checkInTime
    ? new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  const checkOutFormatted = record.checkOutTime
    ? new Date(record.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  const isCurrentlyIn = !record.checkOutTime;
  const isQr = 'checkInMethod' in record
    ? record.checkInMethod === 'QR'
    : record.attendanceMethod === 'QR';

  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        {isQr ? (
          <QrCode size={18} color={Colors.textSecondary} />
        ) : (
          <UserCheck size={18} color={Colors.textSecondary} />
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.title} numberOfLines={1}>
            {memberName}
          </Text>
          <StatusBadge
            variant={isCurrentlyIn ? 'active' : 'inactive'}
            label={isCurrentlyIn ? 'In Gym' : 'Checked Out'}
            size="sm"
          />
        </View>

        <View style={styles.metaRow}>
          {memberId ? <Text style={styles.metaText}>{memberId}</Text> : null}
          {memberId ? <Text style={styles.dot}>•</Text> : null}
          <Text style={styles.timeText}>In: {checkInFormatted}</Text>
          {checkOutFormatted ? (
            <>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.timeText}>Out: {checkOutFormatted}</Text>
            </>
          ) : null}
        </View>
      </View>

      {isCurrentlyIn && onCheckOut ? (
        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() => onCheckOut(record.id)}
          disabled={isCheckingOut}
        >
          <LogOut size={16} color={Colors.danger} />
          <Text style={styles.checkoutText}>Out</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: Colors.container,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  title: {
    ...Typography.cardTitle,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  dot: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginHorizontal: 4,
  },
  timeText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dangerBgSubtle,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  checkoutText: {
    ...Typography.caption,
    color: Colors.danger,
    fontWeight: '700',
    marginLeft: 4,
  },
});
