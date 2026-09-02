import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Colors } from '../../theme/colors';
import { AvailableGroupClass } from '../../types/class';
import { Button } from '../ui/Button';

interface ClassScheduleCardProps {
  item: AvailableGroupClass;
  onBook: (cls: AvailableGroupClass) => void;
  bookingLoading?: boolean;
}

export const ClassScheduleCard = ({ item, onBook, bookingLoading }: ClassScheduleCardProps) => {
  const firstSession = item.schedule && item.schedule.length > 0 ? item.schedule[0] : null;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.badgeCategory}>
          <Text style={styles.categoryText}>{item.category || 'Group Fitness'}</Text>
        </View>
        <Text style={[styles.seatsText, item.isFull && styles.textRed]}>
          {item.isFull ? 'FULL' : `${item.availableSeats} Seats Left`}
        </Text>
      </View>

      <Text style={styles.title}>{item.name}</Text>
      {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}

      <View style={styles.infoRow}>
        {item.instructorName && (
          <Text style={styles.infoTag}>🏋️ {item.instructorName}</Text>
        )}
        {firstSession && (
          <Text style={styles.infoTag}>
            📅 {firstSession.dayOfWeek}: {firstSession.startTime} - {firstSession.endTime}
          </Text>
        )}
      </View>

      <View style={styles.actionRow}>
        {item.isBookedByMember ? (
          <View style={styles.bookedBadge}>
            <Text style={styles.bookedText}>✓ Booked</Text>
          </View>
        ) : (
          <Button
            title={item.isFull ? 'Class Full' : 'Book Session 🎟️'}
            onPress={() => onBook(item)}
            disabled={item.isFull || bookingLoading}
            loading={bookingLoading}
            size="small"
            style={styles.bookBtn}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badgeCategory: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
  },
  seatsText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.success,
  },
  textRed: {
    color: Colors.danger,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.slate900,
    marginBottom: 4,
  },
  desc: {
    fontSize: 13,
    color: Colors.slate500,
    lineHeight: 18,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  infoTag: {
    fontSize: 12,
    color: Colors.slate600,
    backgroundColor: Colors.slate100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontWeight: '500',
  },
  actionRow: {
    alignItems: 'flex-end',
  },
  bookBtn: {
    minWidth: 120,
  },
  bookedBadge: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  bookedText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.success,
  },
});
