/**
 * obo Mobile — CollectPaymentModal Component
 * Modal for collecting fee payments from members at reception desk.
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X, CheckCircle } from 'lucide-react-native';
import { Input, Button, SearchInput } from '../components/common';
import { ownerService } from '../api';
import { Colors, Typography, Spacing, Radius } from '../theme';
import { Member } from '../types';

export interface CollectPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  preselectedMember?: Member | null;
  onSuccess?: () => void;
}

export const CollectPaymentModal = ({
  visible,
  onClose,
  preselectedMember,
  onSuccess,
}: CollectPaymentModalProps) => {
  const queryClient = useQueryClient();

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [search, setSearch] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Cash' | 'Card' | 'Bank Transfer'>('UPI');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (preselectedMember) {
      setSelectedMember(preselectedMember);
      if (preselectedMember.outstandingAmount && preselectedMember.outstandingAmount > 0) {
        setAmount(String(preselectedMember.outstandingAmount));
      }
    }
  }, [preselectedMember, visible]);

  const { data: searchData } = useQuery({
    queryKey: ['membersSearchPayment', search],
    queryFn: () => ownerService.getMembers({ search: search.trim(), limit: 5 }),
    enabled: visible && !selectedMember && search.trim().length >= 2,
  });

  const memberSearchResults = searchData?.members || [];

  const resetForm = () => {
    setSelectedMember(null);
    setSearch('');
    setAmount('');
    setPaymentMethod('UPI');
    setNotes('');
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    const errs: { [key: string]: string } = {};
    if (!selectedMember) errs.member = 'Please select a member';
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      errs.amount = 'Please enter a valid amount greater than ₹0';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const payment = await ownerService.recordPayment({
        memberId: selectedMember!.id,
        amount: parsedAmount,
        paymentMethod,
        notes: notes.trim() || undefined,
      });

      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });

      Alert.alert(
        'Payment Recorded',
        `Receipt #${payment.receiptNumber}: Collected ₹${payment.amount} from ${selectedMember!.firstName} ${selectedMember!.lastName}.`,
        [
          {
            text: 'Done',
            onPress: () => {
              handleClose();
              if (onSuccess) onSuccess();
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Payment Failed', err.message || 'Unable to record payment.');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={handleClose}>
      <View style={styles.container}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.topTitle}>Collect Fee Payment</Text>
            <Text style={styles.topSubtitle}>Record cash, UPI, or card payment</Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <X size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* MEMBER SELECTION */}
          <Text style={styles.sectionHeader}>Member *</Text>
          {errors.member ? <Text style={styles.errorText}>{errors.member}</Text> : null}

          {selectedMember ? (
            <View style={styles.selectedBox}>
              <View style={styles.selectedInfo}>
                <Text style={styles.selectedName}>
                  {selectedMember.firstName} {selectedMember.lastName}
                </Text>
                <Text style={styles.selectedMeta}>
                  ID: {selectedMember.memberId} • Plan: {selectedMember.membershipPlanName || 'Plan'}
                </Text>
                {selectedMember.outstandingAmount ? (
                  <Text style={styles.selectedDue}>
                    Outstanding Dues: ₹{selectedMember.outstandingAmount}
                  </Text>
                ) : null}
              </View>
              <TouchableOpacity
                style={styles.changeBtn}
                onPress={() => setSelectedMember(null)}
              >
                <Text style={styles.changeText}>Change</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <SearchInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search member by name or phone..."
                onClear={() => setSearch('')}
              />
              {memberSearchResults.length > 0 ? (
                <View style={styles.searchDropdown}>
                  {memberSearchResults.map((m) => (
                    <TouchableOpacity
                      key={m.id}
                      style={styles.searchResultRow}
                      onPress={() => {
                        setSelectedMember(m);
                        if (m.outstandingAmount && m.outstandingAmount > 0) {
                          setAmount(String(m.outstandingAmount));
                        }
                      }}
                    >
                      <View>
                        <Text style={styles.searchResultName}>
                          {m.firstName} {m.lastName}
                        </Text>
                        <Text style={styles.searchResultMeta}>
                          {m.phone} • {m.membershipPlanName || 'Plan'}
                        </Text>
                      </View>
                      <CheckCircle size={18} color={Colors.textMuted} />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : search.trim().length >= 2 ? (
                <Text style={styles.hintText}>No matching members found.</Text>
              ) : null}
            </View>
          )}

          {/* PAYMENT DETAILS */}
          <Text style={styles.sectionHeader}>Payment Details</Text>
          <Input
            label="Amount (₹) *"
            placeholder="e.g. 1500"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            error={errors.amount}
          />

          <Text style={styles.label}>Payment Method</Text>
          <View style={styles.methodGrid}>
            {(['UPI', 'Cash', 'Card', 'Bank Transfer'] as const).map((method) => (
              <TouchableOpacity
                key={method}
                style={[styles.methodPill, paymentMethod === method && styles.methodPillActive]}
                onPress={() => setPaymentMethod(method)}
              >
                <Text style={[styles.methodText, paymentMethod === method && styles.methodTextActive]}>
                  {method}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label="Notes / Transaction ID (Optional)"
            placeholder="e.g. UPI Ref: 123456789"
            value={notes}
            onChangeText={setNotes}
          />

          <Button
            title={`Record Payment${amount ? ` • ₹${amount}` : ''}`}
            onPress={handleSubmit}
            loading={loading}
            disabled={loading || !selectedMember}
            style={{ marginTop: Spacing.xl }}
          />
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 54,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  topTitle: {
    ...Typography.pageTitle,
    fontSize: 18,
    color: Colors.textPrimary,
  },
  topSubtitle: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  sectionHeader: {
    ...Typography.sectionTitle,
    fontSize: 16,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  label: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.danger,
    marginBottom: Spacing.xs,
  },
  hintText: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
  selectedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedInfo: {
    flex: 1,
  },
  selectedName: {
    ...Typography.cardTitle,
    color: Colors.textPrimary,
  },
  selectedMeta: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
  selectedDue: {
    ...Typography.caption,
    color: Colors.danger,
    fontWeight: '700',
    marginTop: 4,
  },
  changeBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    backgroundColor: Colors.container,
    borderRadius: Radius.md,
  },
  changeText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  searchDropdown: {
    marginTop: Spacing.xs,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  searchResultName: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  searchResultMeta: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
  methodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  methodPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.md,
    backgroundColor: Colors.container,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  methodPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  methodText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  methodTextActive: {
    color: '#FFFFFF',
  },
});
