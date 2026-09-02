import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Colors } from '../../theme/colors';
import { StatusBadge } from '../ui/StatusBadge';
import { MemberDashboardSummary } from '../../types/member';

interface MembershipStatusCardProps {
  summary: MemberDashboardSummary;
}

export const MembershipStatusCard = ({ summary }: MembershipStatusCardProps) => {
  const { member, membership } = summary;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {member.firstName ? member.firstName[0].toUpperCase() : 'M'}
          </Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{member.firstName} {member.lastName}</Text>
          <Text style={styles.gymName}>📍 {member.gymName}</Text>
        </View>
        <StatusBadge status={membership.status} />
      </View>

      <View style={styles.divider} />

      <View style={styles.detailsGrid}>
        <View style={styles.detailCol}>
          <Text style={styles.detailLabel}>Active Plan</Text>
          <Text style={styles.detailVal}>{membership.planName}</Text>
        </View>
        <View style={styles.detailCol}>
          <Text style={styles.detailLabel}>Expiry Date</Text>
          <Text style={styles.detailVal}>{membership.expiryDate}</Text>
        </View>
        <View style={styles.detailCol}>
          <Text style={styles.detailLabel}>Days Left</Text>
          <Text style={[styles.detailVal, membership.daysRemaining <= 5 && styles.textWarning]}>
            {membership.daysRemaining > 0 ? `${membership.daysRemaining} Days` : 'Expired'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.slate900,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.slate900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.surface,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.surface,
  },
  gymName: {
    fontSize: 12,
    color: Colors.slate400,
    marginTop: 2,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginVertical: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: Colors.slate400,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailVal: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.surface,
  },
  textWarning: {
    color: Colors.warning,
  },
});
