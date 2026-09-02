import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '../theme/colors';
import { membersService } from '../services/members.service';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { Header } from '../components/ui/Header';
import { SearchInput } from '../components/ui/SearchInput';
import { MemberRow } from '../components/ui/MemberRow';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';
import { Member } from '../types/member';

interface MemberListScreenProps {
  navigation: any;
}

export const MemberListScreen = ({ navigation }: MemberListScreenProps) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED'>('ALL');

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['members', search, statusFilter],
    queryFn: () =>
      membersService.getMembers({
        search: search.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      }),
  });

  const members = data?.members || [];

  return (
    <ScreenContainer scrollable={false}>
      <Header
        title="Member Directory"
        subtitle={`${members.length} members loaded`}
        rightElement={
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('AddMember')}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        }
      />

      <SearchInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search member by name, ID, or phone..."
      />

      {/* STATUS FILTER PILLS */}
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

      {isLoading ? (
        <LoadingState message="Loading members directory..." />
      ) : error ? (
        <ErrorState message={(error as Error).message} onRetry={refetch} />
      ) : members.length === 0 ? (
        <EmptyState
          iconText="👥"
          title="No Members Found"
          description={
            search ? `No member matching "${search}"` : 'Your gym does not have any registered members yet.'
          }
          actionTitle="+ Add First Member"
          onAction={() => navigation.navigate('AddMember')}
        />
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: Member }) => (
            <MemberRow
              member={item}
              onPress={() => navigation.navigate('MemberDetail', { memberId: item.id })}
            />
          )}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isRefetching}
          contentContainerStyle={styles.listContent}
        />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  addBtn: {
    backgroundColor: Colors.slate900,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  addBtnText: {
    color: Colors.surface,
    fontSize: 13,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.slate100,
    marginRight: 8,
  },
  filterPillActive: {
    backgroundColor: Colors.slate900,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate600,
  },
  filterTextActive: {
    color: Colors.surface,
  },
  listContent: {
    paddingBottom: 24,
  },
});
