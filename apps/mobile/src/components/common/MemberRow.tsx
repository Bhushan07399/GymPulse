/**
 * obo Mobile Design System — MemberRow Component
 * Renders member summary in directory and search lists.
 */

import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { StatusBadge } from './StatusBadge';
import { Member } from '../../types';
import { Colors, Typography, Spacing, Radius } from '../../theme';

export interface MemberRowProps {
  member: Member;
  onPress: (member: Member) => void;
}

export const MemberRow = ({ member, onPress }: MemberRowProps) => {
  const initials = `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase() || 'M';
  const isExpired = !member.isActive || (member.expiryDate && new Date(member.expiryDate) < new Date());

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(member)}
      activeOpacity={0.7}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {member.firstName} {member.lastName}
          </Text>
          <StatusBadge
            variant={isExpired ? 'expired' : 'active'}
            label={isExpired ? 'Expired' : 'Active'}
            size="sm"
          />
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.planText} numberOfLines={1}>
            {member.membershipPlanName || 'Plan'}
          </Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.idText}>{member.memberId || member.phone}</Text>
          {Number(member.outstandingAmount) > 0 ? (
            <>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.dueText}>Due: ₹{member.outstandingAmount}</Text>
            </>
          ) : null}
        </View>
      </View>

      <ChevronRight size={18} color={Colors.textMuted} />
    </TouchableOpacity>
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
  avatar: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    backgroundColor: Colors.container,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  avatarText: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  name: {
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
  planText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  dot: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginHorizontal: 4,
  },
  idText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  dueText: {
    ...Typography.caption,
    color: Colors.danger,
    fontWeight: '700',
  },
});
