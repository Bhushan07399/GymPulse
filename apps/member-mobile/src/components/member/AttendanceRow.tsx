import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Colors } from '../../theme/colors';
import { MemberAttendanceItem } from '../../types/attendance';

interface AttendanceRowProps {
  item: MemberAttendanceItem;
}

export const AttendanceRow = ({ item }: AttendanceRowProps) => {
  const formattedDate = item.attendanceDate ? new Date(item.attendanceDate).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }) : 'Date N/A';

  const formattedTime = item.checkInTime ? new Date(item.checkInTime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }) : 'Check-in Time';

  const formattedOutTime = item.checkOutTime ? new Date(item.checkOutTime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }) : null;

  const isCompleted = item.status === 'COMPLETED' || Boolean(formattedOutTime);

  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, !isCompleted && styles.iconCircleActive]}>
        <Text style={styles.iconText}>{isCompleted ? '✓' : '💪'}</Text>
      </View>
      <View style={styles.infoCol}>
        <View style={styles.topRow}>
          <Text style={styles.dateText}>{formattedDate}</Text>
          {Boolean(item.gymName) && (
            <Text style={styles.gymNameBadge} numberOfLines={1}>
              {item.gymName}
            </Text>
          )}
        </View>
        <Text style={styles.timeText}>
          {formattedOutTime ? `In: ${formattedTime} • Out: ${formattedOutTime}` : `In: ${formattedTime} (Active)`}
        </Text>
      </View>
      <View style={styles.rightCol}>
        <View style={[styles.statusBadge, isCompleted ? styles.statusBadgeCompleted : styles.statusBadgeActive]}>
          <Text style={[styles.statusBadgeText, isCompleted ? styles.statusTextCompleted : styles.statusTextActive]}>
            {isCompleted ? 'COMPLETED' : 'IN'}
          </Text>
        </View>
        <View style={styles.methodChip}>
          <Text style={styles.methodText}>{item.attendanceMethod || 'QR'}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconCircleActive: {
    backgroundColor: '#ECFDF5',
  },
  iconText: {
    fontSize: 18,
  },
  infoCol: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.slate900,
  },
  gymNameBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  timeText: {
    fontSize: 12,
    color: Colors.slate500,
    marginTop: 2,
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeActive: {
    backgroundColor: '#ECFDF5',
  },
  statusBadgeCompleted: {
    backgroundColor: Colors.slate100,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusTextActive: {
    color: '#059669',
  },
  statusTextCompleted: {
    color: Colors.slate600,
  },
  methodChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    backgroundColor: Colors.slate50,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  methodText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.slate600,
  },
});
