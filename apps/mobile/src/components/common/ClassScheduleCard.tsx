/**
 * obo Mobile Design System — ClassScheduleCard Component
 * Displays group fitness class details with capacity bar and booking action.
 */

import React from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import { Clock, User, Users } from 'lucide-react-native';
import { Card } from './Card';
import { Button } from './Button';
import { StatusBadge } from './StatusBadge';
import { AvailableGroupClass } from '../../types';
import { Colors, Typography, Spacing, Radius } from '../../theme';

export interface ClassScheduleCardProps {
  item: AvailableGroupClass;
  onBook: (item: AvailableGroupClass) => void;
  isBooking?: boolean;
  style?: ViewStyle;
}

export const ClassScheduleCard = ({
  item,
  onBook,
  isBooking,
  style,
}: ClassScheduleCardProps) => {
  const bookedPercent = item.capacity > 0
    ? Math.min(100, Math.round((item.bookedCount / item.capacity) * 100))
    : 0;

  const isFull = item.isFull || item.availableSeats <= 0;

  return (
    <Card style={[styles.card, style]}>
      <View style={styles.topRow}>
        <View style={styles.badgeWrap}>
          <StatusBadge
            variant={item.memberAccessStatus === 'INCLUDED' ? 'active' : 'info'}
            label={item.category || 'Fitness'}
            size="sm"
          />
        </View>
        <Text style={styles.price}>
          {item.monthlyPrice > 0 ? `₹${item.monthlyPrice}/mo` : 'Included'}
        </Text>
      </View>

      <Text style={styles.title}>{item.name}</Text>

      {item.description ? (
        <Text style={styles.desc} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}

      <View style={styles.metaRow}>
        {item.instructorName ? (
          <View style={styles.metaItem}>
            <User size={14} color={Colors.textMuted} />
            <Text style={styles.metaText}>{item.instructorName}</Text>
          </View>
        ) : null}

        <View style={styles.metaItem}>
          <Users size={14} color={Colors.textMuted} />
          <Text style={styles.metaText}>
            {item.bookedCount}/{item.capacity} booked
          </Text>
        </View>
      </View>

      {/* Capacity progress bar */}
      <View style={styles.progressBarBg}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${bookedPercent}%`,
              backgroundColor: isFull ? Colors.danger : Colors.textPrimary,
            },
          ]}
        />
      </View>

      <View style={styles.actionRow}>
        <Text style={styles.seatsLeft}>
          {isFull ? 'Class full' : `${item.availableSeats} spots left`}
        </Text>
        <Button
          title={item.isBookedByMember ? 'Booked' : isFull ? 'Full' : 'Book Now'}
          onPress={() => onBook(item)}
          disabled={item.isBookedByMember || isFull || isBooking}
          loading={isBooking}
          size="sm"
          variant={item.isBookedByMember ? 'outline' : 'primary'}
        />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  badgeWrap: {
    flexDirection: 'row',
  },
  price: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  title: {
    ...Typography.cardTitle,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  desc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.lg,
  },
  metaText: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginLeft: 4,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: Colors.container,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  seatsLeft: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: '600',
  },
});
