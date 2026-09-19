/**
 * obo Mobile — AddMemberModal Component
 * Full registration modal for walk-in members at reception.
 */

import React, { useState } from 'react';
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
import { X, Check } from 'lucide-react-native';
import { Input, Button } from '../components/common';
import { ownerService } from '../api';
import { Colors, Typography, Spacing, Radius } from '../theme';
import { MembershipPlan } from '../types';

export interface AddMemberModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddMemberModal = ({ visible, onClose, onSuccess }: AddMemberModalProps) => {
  const queryClient = useQueryClient();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Card'>('UPI');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const { data: plans = [], isLoading: loadingPlans } = useQuery({
    queryKey: ['membershipPlans'],
    queryFn: () => ownerService.getMembershipPlans(),
    enabled: visible,
  });

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setPhone('');
    setEmail('');
    setGender('Male');
    setSelectedPlanId('');
    setAmountPaid('');
    setPaymentMethod('UPI');
    setNotes('');
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSelectPlan = (plan: MembershipPlan) => {
    setSelectedPlanId(plan.id);
    if (!amountPaid) {
      setAmountPaid(String(plan.price));
    }
  };

  const handleSubmit = async () => {
    const errs: { [key: string]: string } = {};
    if (!firstName.trim()) errs.firstName = 'First name is required';
    if (!lastName.trim()) errs.lastName = 'Last name is required';
    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) errs.phone = 'Valid 10-digit phone number is required';
    if (!selectedPlanId) errs.plan = 'Please select a membership plan';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const selectedPlan = plans.find((p) => p.id === selectedPlanId);
      const paidNum = amountPaid ? parseFloat(amountPaid) : (selectedPlan?.price || 0);

      const created = await ownerService.createMember({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: cleanPhone,
        email: email.trim() || undefined,
        gender,
        membershipPlanId: selectedPlanId,
        joinDate: new Date().toISOString().split('T')[0],
        initialPaymentAmount: paidNum,
        paymentMethod,
        notes: notes.trim() || undefined,
      });

      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });

      Alert.alert(
        'Member Registered',
        `Successfully registered ${created.firstName} ${created.lastName} (ID: ${created.memberId}).`,
        [
          {
            text: 'OK',
            onPress: () => {
              handleClose();
              if (onSuccess) onSuccess();
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Unable to create member.');
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
            <Text style={styles.topTitle}>New Member Registration</Text>
            <Text style={styles.topSubtitle}>Reception walk-in registration</Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <X size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* PERSONAL INFO */}
          <Text style={styles.sectionHeader}>Personal Details</Text>
          <View style={styles.row}>
            <View style={styles.halfCol}>
              <Input
                label="First Name *"
                placeholder="John"
                value={firstName}
                onChangeText={setFirstName}
                error={errors.firstName}
              />
            </View>
            <View style={styles.halfCol}>
              <Input
                label="Last Name *"
                placeholder="Doe"
                value={lastName}
                onChangeText={setLastName}
                error={errors.lastName}
              />
            </View>
          </View>

          <Input
            label="Phone Number (10 Digits) *"
            placeholder="9876543210"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            error={errors.phone}
          />

          <Input
            label="Email Address (Optional)"
            placeholder="john.doe@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* GENDER SELECTOR */}
          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderRow}>
            {(['Male', 'Female', 'Other'] as const).map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.genderPill, gender === g && styles.genderPillActive]}
                onPress={() => setGender(g)}
              >
                <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* MEMBERSHIP PLAN */}
          <Text style={styles.sectionHeader}>Membership Plan *</Text>
          {errors.plan ? <Text style={styles.errorText}>{errors.plan}</Text> : null}

          {loadingPlans ? (
            <Text style={styles.hintText}>Loading available membership plans...</Text>
          ) : plans.length === 0 ? (
            <Text style={styles.hintText}>No active plans found. Please add a plan in settings first.</Text>
          ) : (
            <View style={styles.plansContainer}>
              {plans.map((p) => {
                const isSelected = selectedPlanId === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.planCard, isSelected && styles.planCardActive]}
                    onPress={() => handleSelectPlan(p)}
                  >
                    <View style={styles.planInfo}>
                      <Text style={[styles.planName, isSelected && styles.planNameActive]}>
                        {p.name}
                      </Text>
                      <Text style={styles.planDuration}>
                        {p.durationMonths} {p.durationMonths === 1 ? 'Month' : 'Months'}
                      </Text>
                    </View>
                    <View style={styles.planRight}>
                      <Text style={[styles.planPrice, isSelected && styles.planPriceActive]}>
                        ₹{p.price}
                      </Text>
                      {isSelected ? <Check size={18} color={Colors.primary} /> : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* INITIAL PAYMENT */}
          <Text style={styles.sectionHeader}>Initial Payment</Text>
          <Input
            label="Amount Paid (₹)"
            placeholder="e.g. 1500"
            value={amountPaid}
            onChangeText={setAmountPaid}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Payment Method</Text>
          <View style={styles.genderRow}>
            {(['UPI', 'Cash', 'Card'] as const).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.genderPill, paymentMethod === m && styles.genderPillActive]}
                onPress={() => setPaymentMethod(m)}
              >
                <Text style={[styles.genderText, paymentMethod === m && styles.genderTextActive]}>
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label="Internal Notes"
            placeholder="e.g. Referral by Member #102"
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          {/* SUBMIT BUTTON */}
          <Button
            title="Complete Registration"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={{ marginTop: Spacing.xl, marginBottom: Spacing.xxl }}
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
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfCol: {
    flex: 1,
  },
  label: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  genderRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  genderPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.md,
    backgroundColor: Colors.container,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  genderPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  genderText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  genderTextActive: {
    color: '#FFFFFF',
  },
  errorText: {
    ...Typography.caption,
    color: Colors.danger,
    marginBottom: Spacing.xs,
  },
  hintText: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginVertical: Spacing.sm,
  },
  plansContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  planCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.containerSubtle,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    ...Typography.cardTitle,
    color: Colors.textPrimary,
  },
  planNameActive: {
    fontWeight: '800',
  },
  planDuration: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
  planRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  planPrice: {
    ...Typography.cardTitle,
    color: Colors.textPrimary,
  },
  planPriceActive: {
    fontWeight: '800',
  },
});
