/**
 * obo Mobile — Staff Members Screen
 * Fast member lookup and membership status verification for desk staff.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
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
import { MemberDetailModal } from '../owner/MemberDetailModal';
import { CollectPaymentModal } from '../owner/CollectPaymentModal';
import { Spacing } from '../theme';
import { Member } from '../types';

export const StaffMembersScreen = () => {
  const { session } = useAuth();
  const gymId = session?.gymId;

  const [search, setSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [collectModalVisible, setCollectModalVisible] = useState(false);
  const [paymentTargetMember, setPaymentTargetMember] = useState<Member | null>(null);

  const {
    data,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['staffMembers', gymId, search],
    queryFn: () => ownerService.getMembers({ search: search.trim() || undefined, limit: 30 }),
  });

  const members = data?.members || [];

  const handleMemberPress = (member: Member) => {
    setSelectedMember(member);
    setDetailModalVisible(true);
  };

  const handleCollectPayment = (member: Member) => {
    setPaymentTargetMember(member);
    setCollectModalVisible(true);
  };

  return (
    <ScreenContainer scrollable={false}>
      {/* HEADER */}
      <Header
        title="Member Lookup"
        subtitle="Verify validity, active status, and dues"
      />

      <View style={styles.searchWrap}>
        <SearchInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name, ID, or phone..."
          onClear={() => setSearch('')}
        />
      </View>

      {/* LIST OR STATES */}
      {isLoading ? (
        <LoadingState message="Searching members..." />
      ) : error ? (
        <ErrorState message={(error as Error).message} onRetry={refetch} />
      ) : members.length === 0 ? (
        <EmptyState
          title="No Members Found"
          description={
            search
              ? `No members matching "${search}" found.`
              : 'Enter a name, phone number, or Member ID above to search.'
          }
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

      {/* MEMBER DETAIL MODAL */}
      <MemberDetailModal
        visible={detailModalVisible}
        member={selectedMember}
        onClose={() => {
          setDetailModalVisible(false);
          setSelectedMember(null);
        }}
        onCollectPayment={handleCollectPayment}
      />

      <CollectPaymentModal
        visible={collectModalVisible}
        preselectedMember={paymentTargetMember}
        onClose={() => {
          setCollectModalVisible(false);
          setPaymentTargetMember(null);
        }}
        onSuccess={() => refetch()}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  searchWrap: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
});
