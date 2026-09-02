import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors } from '../theme/colors';
import { membersService } from '../services/members.service';
import { attendanceService } from '../services/attendance.service';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { Header } from '../components/ui/Header';
import { Card } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';

interface MemberDetailScreenProps {
  route: any;
  navigation: any;
}

export const MemberDetailScreen = ({ route, navigation }: MemberDetailScreenProps) => {
  const { memberId } = route.params || {};
  const queryClient = useQueryClient();
  const [checkInLoading, setCheckInLoading] = useState(false);

  const { data: member, isLoading, error, refetch } = useQuery({
    queryKey: ['member', memberId],
    queryFn: () => membersService.getMemberById(memberId),
    enabled: !!memberId,
  });

  const handleManualCheckIn = async () => {
    if (!member) return;
    setCheckInLoading(true);
    try {
      await attendanceService.manualCheckIn(member.id);
      queryClient.invalidateQueries({ queryKey: ['todayLedger'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      Alert.alert('Check-in Success', `${member.firstName} ${member.lastName} checked in successfully!`);
    } catch (err: any) {
      Alert.alert('Check-in Failed', err.message || 'Unable to check in member.');
    } finally {
      setCheckInLoading(false);
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer scrollable={false}>
        <Header title="Member Details" onBack={() => navigation.goBack()} />
        <LoadingState message="Loading member details..." />
      </ScreenContainer>
    );
  }

  if (error || !member) {
    return (
      <ScreenContainer scrollable={false}>
        <Header title="Member Details" onBack={() => navigation.goBack()} />
        <ErrorState message={(error as Error)?.message || 'Member not found'} onRetry={refetch} />
      </ScreenContainer>
    );
  }

  const initials = `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase();

  return (
    <ScreenContainer scrollable>
      <Header title="Member Profile" onBack={() => navigation.goBack()} />

      {/* HERO MEMBER BANNER */}
      <Card style={styles.heroCard}>
        <View style={styles.heroRow}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.heroText}>
            <View style={styles.nameStatusRow}>
              <Text style={styles.memberName} numberOfLines={1}>{member.firstName} {member.lastName}</Text>
              <StatusBadge status={member.isActive ? 'ACTIVE' : 'EXPIRED'} />
            </View>
            <Text style={styles.memberIdText}>Member ID: {member.memberId}</Text>
            <Text style={styles.planText}>Plan: {member.membershipPlan?.planName || 'Standard'}</Text>
          </View>
        </View>
      </Card>

      {/* RECEPTION QUICK ACTION BUTTONS */}
      <View style={styles.actionRow}>
        <Button
          title="💳 Collect Fee"
          onPress={() => navigation.navigate('CollectPayment', { memberId: member.id, memberName: `${member.firstName} ${member.lastName}` })}
          style={styles.actionBtn}
        />
        <Button
          title="✅ Manual Check-in"
          variant="secondary"
          onPress={handleManualCheckIn}
          loading={checkInLoading}
          style={styles.actionBtn}
        />
      </View>

      {/* PROFILE DETAILS GRID */}
      <Card style={styles.detailsCard}>
        <Text style={styles.sectionHeader}>Personal Information</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone Number:</Text>
          <Text style={styles.infoValue}>{member.phone || 'N/A'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email Address:</Text>
          <Text style={styles.infoValue}>{member.email || 'N/A'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Gender:</Text>
          <Text style={styles.infoValue}>{member.gender || 'N/A'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Emergency Contact:</Text>
          <Text style={styles.infoValue}>{member.emergencyContact || 'N/A'}</Text>
        </View>

        <Text style={[styles.sectionHeader, { marginTop: 16 }]}>Membership Dates</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Join Date:</Text>
          <Text style={styles.infoValue}>{new Date(member.joinDate).toLocaleDateString()}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Expiration Date:</Text>
          <Text style={[styles.infoValue, { color: member.isActive ? Colors.success : Colors.danger, fontWeight: '700' }]}>
            {new Date(member.expiryDate).toLocaleDateString()}
          </Text>
        </View>
      </Card>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: Colors.slate900,
    borderColor: Colors.slate800,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.slate900,
  },
  heroText: {
    flex: 1,
  },
  nameStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  memberName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.surface,
    flex: 1,
    marginRight: 8,
  },
  memberIdText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  planText: {
    fontSize: 12,
    color: Colors.slate400,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  actionBtn: {
    width: '48%',
  },
  detailsCard: {
    backgroundColor: Colors.surface,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.slate900,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.slate100,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.slate500,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.slate900,
  },
});
