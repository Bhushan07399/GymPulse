/**
 * obo Mobile — Owner Members Screen
 * Full member directory with search, active/expired filter pills, member profiles,
 * registration flow, and fee collection shortcut.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react-native';
import { useAuth } from '../store/auth.context';
import { ownerService } from '../api';
import {
  ScreenContainer,
  Header,
  SearchInput,
  MemberRow,
  LoadingState,
  ErrorState,
  EmptyState,
} from '../components/common';
import { AddMemberModal } from './AddMemberModal';
import { MemberDetailModal } from './MemberDetailModal';
import { CollectPaymentModal } from './CollectPaymentModal';
import { Colors, Spacing, Typography, Radius } from '../theme';
import { Member } from '../types';

export const OwnerMembersScreen = () => {
  const { session } = useAuth();
  const gymId = session?.gymId;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED'>('ALL');

  // Modals state
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [collectPaymentVisible, setCollectPaymentVisible] = useState(false);
  const [paymentTargetMember, setPaymentTargetMember] = useState<Member | null>(null);

  const {
    data,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['members', gymId, search, statusFilter],
    queryFn: () =>
      ownerService.getMembers({
        search: search.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      }),
  });

  const members = data?.members || [];

  const handleMemberPress = (member: Member) => {
    setSelectedMember(member);
    setDetailModalVisible(true);
  };

  const handleOpenCollectPayment = (member: Member) => {
    setPaymentTargetMember(member);
    setCollectPaymentVisible(true);
  };

  return (
    <ScreenContainer scrollable={false}>
      {/* HEADER */}
      <Header
        title="Member Directory"
        subtitle={`${members.length} members shown`}
        rightElement={
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setAddModalVisible(true)}
            activeOpacity={0.8}
          >
            <UserPlus size={16} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        }
      />

      <View style={styles.searchWrap}>
        <SearchInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name, ID, or phone..."
          onClear={() => setSearch('')}
        />
      </View>

      {/* FILTER PILLS */}
      <View style={styles.filterRow}>
        {(['ALL', 'ACTIVE', 'EXPIRED'] as const).map((filter) => {
          const isSelected = statusFilter === filter;
          return (
            <TouchableOpacity
              key={filter}
              style={[styles.filterPill, isSelected && styles.filterPillActive]}
              onPress={() => setStatusFilter(filter)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterText, isSelected && styles.filterTextActive]}>
                {filter === 'ALL' ? 'All Members' : filter === 'ACTIVE' ? 'Active' : 'Expired'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* LIST OR STATES */}
      {isLoading ? (
        <LoadingState message="Loading members directory..." />
      ) : error ? (
        <ErrorState message={(error as Error).message} onRetry={refetch} />
      ) : members.length === 0 ? (
        <EmptyState
          title="No Members Found"
          description={
            search
              ? `No members matching "${search}" found.`
              : 'Your gym does not have any registered members yet.'
          }
          actionTitle="+ Add Member"
          onAction={() => setAddModalVisible(true)}
        />
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MemberRow member={item} onPress={handleMemberPress} />
          )}
          refreshing={isRefetching}
          onRefresh={refetch}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Spacing.xl }}
        />
      )}

      {/* MODALS */}
      <AddMemberModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSuccess={() => refetch()}
      />

      <MemberDetailModal
        visible={detailModalVisible}
        member={selectedMember}
        onClose={() => {
          setDetailModalVisible(false);
          setSelectedMember(null);
        }}
        onCollectPayment={handleOpenCollectPayment}
      />

      <CollectPaymentModal
        visible={collectPaymentVisible}
        preselectedMember={paymentTargetMember}
        onClose={() => {
          setCollectPaymentVisible(false);
          setPaymentTargetMember(null);
        }}
        onSuccess={() => refetch()}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radius.md,
    gap: 4,
  },
  addBtnText: {
    ...Typography.caption,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  searchWrap: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginVertical: Spacing.sm,
  },
  filterPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.container,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
});
