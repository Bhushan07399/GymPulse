/**
 * obo Mobile — Owner Payments Screen
 * Payment collection ledger, receipt records, and fee recording.
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
import { Plus, Receipt, Calendar, CreditCard } from 'lucide-react-native';
import { useAuth } from '../store/auth.context';
import { ownerService } from '../api';
import {
  ScreenContainer,
  Header,
  Card,
  StatusBadge,
  LoadingState,
  ErrorState,
  EmptyState,
} from '../components/common';
import { CollectPaymentModal } from './CollectPaymentModal';
import { Colors, Spacing, Typography, Radius } from '../theme';
import { Payment } from '../types';

export const OwnerPaymentsScreen = () => {
  const { session } = useAuth();
  const gymId = session?.gymId;

  const [methodFilter, setMethodFilter] = useState<'ALL' | 'Cash' | 'UPI' | 'Card'>('ALL');
  const [collectModalVisible, setCollectModalVisible] = useState(false);

  const {
    data,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['payments', gymId, methodFilter],
    queryFn: () =>
      ownerService.getPayments({
        paymentMethod: methodFilter !== 'ALL' ? methodFilter : undefined,
      }),
  });

  const payments = data?.payments || [];
  const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <ScreenContainer scrollable={false}>
      {/* HEADER */}
      <Header
        title="Fee Collections"
        subtitle={`${payments.length} transactions recorded`}
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

      {/* TOTAL SUMMARY CARD */}
      <View style={styles.summaryWrap}>
        <Card style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryLabel}>FILTERED TOTAL REVENUE</Text>
            <Text style={styles.summaryValue}>₹{totalAmount.toLocaleString('en-IN')}</Text>
          </View>
          <Receipt size={28} color={Colors.textMuted} />
        </Card>
      </View>

      {/* FILTER PILLS */}
      <View style={styles.filterRow}>
        {(['ALL', 'Cash', 'UPI', 'Card'] as const).map((method) => {
          const isSelected = methodFilter === method;
          return (
            <TouchableOpacity
              key={method}
              style={[styles.filterPill, isSelected && styles.filterPillActive]}
              onPress={() => setMethodFilter(method)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterText, isSelected && styles.filterTextActive]}>
                {method === 'ALL' ? 'All Methods' : method}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* TRANSACTIONS LIST */}
      {isLoading ? (
        <LoadingState message="Loading payment transactions..." />
      ) : error ? (
        <ErrorState message={(error as Error).message} onRetry={refetch} />
      ) : payments.length === 0 ? (
        <EmptyState
          title="No Transactions"
          description={
            methodFilter !== 'ALL'
              ? `No transactions recorded via ${methodFilter}.`
              : 'No payment transactions recorded yet.'
          }
          actionTitle="+ Collect Fee"
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

                  {item.notes ? (
                    <Text style={styles.notesText} numberOfLines={1}>
                      {item.notes}
                    </Text>
                  ) : null}
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
  summaryWrap: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  summaryLabel: {
    ...Typography.badge,
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  summaryValue: {
    ...Typography.pageTitle,
    fontSize: 22,
    color: Colors.textPrimary,
    marginTop: 2,
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
  notesText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },
});
