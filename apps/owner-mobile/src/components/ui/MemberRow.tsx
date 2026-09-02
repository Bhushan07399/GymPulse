import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Colors } from '../../theme/colors';
import { Member } from '../../types/member';
import { StatusBadge } from './StatusBadge';

interface MemberRowProps {
  member: Member;
  onPress?: () => void;
}

export const MemberRow = ({ member, onPress }: MemberRowProps) => {
  const initials = `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase() || 'GP';

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7} disabled={!onPress}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{member.firstName} {member.lastName}</Text>
          <StatusBadge status={member.isActive ? 'ACTIVE' : 'EXPIRED'} />
        </View>
        
        <View style={styles.detailsRow}>
          <Text style={styles.idText}>ID: {member.memberId}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.planText}>{member.membershipPlan?.planName || 'Plan'}</Text>
        </View>

        <Text style={styles.expiryText}>Exp: {new Date(member.expiryDate).toLocaleDateString()}</Text>
      </View>

      {onPress && <Text style={styles.chevron}>›</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.slate900,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: Colors.surface,
    fontSize: 15,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.slate900,
    marginRight: 8,
    flex: 1,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  idText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate600,
  },
  dot: {
    fontSize: 12,
    color: Colors.slate400,
    marginHorizontal: 4,
  },
  planText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.slate500,
  },
  expiryText: {
    fontSize: 11,
    color: Colors.slate400,
  },
  chevron: {
    fontSize: 22,
    fontWeight: '300',
    color: Colors.slate400,
    marginLeft: 8,
  },
});
