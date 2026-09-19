/**
 * obo Mobile — Staff Payments Screen
 * Desk point-of-sale collection for membership fees and dues.
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
import { Plus, CreditCard } from 'lucide-react-native';
import { useAuth } from '../store/auth.context';
import { ownerService } from '../api';
import {
  ScreenContainer,
  Header,
  LoadingState,
  ErrorState,
  EmptyState,
} from '../components/common';
import { CollectPaymentModal } from '../owner/CollectPaymentModal';
import { Colors, Spacing, Typography, Radius } from '../theme';
import { Payment } from '../types';

export const StaffPaymentsScreen = () => {
  const { session } = useAuth();
  const gymId = session?.gymId;
  const [collectModalVisible, setCollectModalVisible] = useState(false);

  const {
    data,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['staffPayments', gymId],
    queryFn: () => ownerService.getPayments({ limit: 30 }),
  });

  const payments = data?.payments || [];

  return (
    <ScreenContainer scrollable={false}>
      {/* HEADER */}
      <Header
        title="Fee Collections"
        subtitle="Record cash, UPI, or card payments at desk"
        rightElement={
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setCollectModalVisible(true)}
            activeOpacity={0.8}
          >
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Collect</Text>
          </TouchableOpacity>
        }
      />

      {/* RECENT TRANSACTIONS */}
      {isLoading ? (
        <LoadingState message="Loading recent collections..." />
      ) : error ? (
        <ErrorState message={(error as Error).message} onRetry={refetch} />
      ) : payments.length === 0 ? (
        <EmptyState
          title="No Collections"
          description="No recent fee payments have been recorded."
          actionTitle="+ Collect Payment"
          onAction={() => setCollectModalVisible(true)}
        />
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: Payment }) => {
            const formattedDate = item.paymentDate
              ? new Date(item.paymentDate).toLocaleDateString()
              : 'Recent';

            return (
              <View style={styles.paymentRow}>
                <View style={styles.iconBox}>
                  <CreditCard size={18} color={Colors.textSecondary} />
                </View>

                <View style={styles.content}>
                  <View style={styles.topRow}>
                    <Text style={styles.memberName} numberOfLines={1}>
                      {item.memberName || `Member #${item.memberId?.slice(0, 6)}`}
                    </Text>
                    <Text style={styles.amountText}>₹{item.amount}</Text>
                  </View>

                  <View style={styles.metaRow}>
                    <Text style={styles.receiptText}>{item.receiptNumber}</Text>
                    <Text style={styles.dot}>•</Text>
                    <Text style={styles.methodText}>{item.paymentMethod}</Text>
                    <Text style={styles.dot}>•</Text>
                    <Text style={styles.dateText}>{formattedDate}</Text>
                  </View>
                </View>
              </View>
            );
          }}
          refreshing={isRefetching}
          onRefresh={refetch}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Spacing.xl }}
        />
      )}

      {/* COLLECT PAYMENT MODAL */}
      <CollectPaymentModal
        visible={collectModalVisible}
        onClose={() => setCollectModalVisible(false)}
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
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: Colors.container,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  memberName: {
    ...Typography.cardTitle,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  amountText: {
    ...Typography.bodyBold,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  receiptText: {
    ...Typography.caption,
    ...Typography.mono,
    fontSize: 11,
    color: Colors.textMuted,
  },
  methodText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  dateText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  dot: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginHorizontal: 4,
  },
});
