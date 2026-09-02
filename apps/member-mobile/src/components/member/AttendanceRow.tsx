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

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Text style={styles.iconText}>💪</Text>
      </View>
      <View style={styles.infoCol}>
        <Text style={styles.dateText}>{formattedDate}</Text>
        <Text style={styles.timeText}>Check-in at {formattedTime}</Text>
      </View>
      <View style={styles.methodChip}>
        <Text style={styles.methodText}>{item.attendanceMethod || 'QR'}</Text>
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
  iconText: {
    fontSize: 18,
  },
  infoCol: {
    flex: 1,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.slate900,
  },
  timeText: {
    fontSize: 12,
    color: Colors.slate500,
    marginTop: 2,
  },
  methodChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: Colors.slate100,
    borderRadius: 8,
  },
  methodText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.slate700,
  },
});
