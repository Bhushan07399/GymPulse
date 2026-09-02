import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Colors } from '../theme/colors';
import { membersService } from '../services/members.service';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { Header } from '../components/ui/Header';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { MembershipPlan } from '../types/member';

interface AddMemberModalScreenProps {
  navigation: any;
}

export const AddMemberModalScreen = ({ navigation }: AddMemberModalScreenProps) => {
  const queryClient = useQueryClient();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Partial' | 'Unpaid'>('Paid');
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Card'>('UPI');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const { data: plans = [] } = useQuery({
    queryKey: ['membershipPlans'],
    queryFn: () => membersService.getMembershipPlans(),
  });

  const handleSubmit = async () => {
    const errs: { [key: string]: string } = {};
    if (!firstName.trim()) errs.firstName = 'First name is required';
    if (!lastName.trim()) errs.lastName = 'Last name is required';
    if (!phone.trim() || phone.length < 10) errs.phone = 'Valid 10-digit phone number is required';
    if (!selectedPlanId) errs.plan = 'Please select a membership plan';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const selectedPlan = plans.find((p) => p.id === selectedPlanId);
      const initialAmount = amountPaid ? parseFloat(amountPaid) : (selectedPlan?.price || 0);

      const created = await membersService.createMember({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        gender,
        membershipPlanId: selectedPlanId,
        joinDate: new Date().toISOString().split('T')[0],
        paymentStatus,
        amountPaid: initialAmount,
        paymentMethod,
      });

      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });

      Alert.alert(
        'Member Created Successfully!',
        `Member ${created.firstName} ${created.lastName} (ID: ${created.memberId}) registered.`,
        [
          {
            text: 'View Member Profile',
            onPress: () => navigation.replace('MemberDetail', { memberId: created.id }),
          },
          {
            text: 'Back to Dashboard',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Unable to register member.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer scrollable>
      <Header title="Quick Member Registration" subtitle="Reception Walk-in Entry" onBack={() => navigation.goBack()} />

      <View style={styles.formCard}>
        <Input
          label="First Name *"
          placeholder="John"
          value={firstName}
          onChangeText={(t) => {
            setFirstName(t);
            setErrors((prev) => ({ ...prev, firstName: '' }));
          }}
          error={errors.firstName}
        />

        <Input
          label="Last Name *"
          placeholder="Doe"
          value={lastName}
          onChangeText={(t) => {
            setLastName(t);
            setErrors((prev) => ({ ...prev, lastName: '' }));
          }}
          error={errors.lastName}
        />

        <Input
          label="Mobile Phone *"
          placeholder="9876543210"
          value={phone}
          onChangeText={(t) => {
            setPhone(t);
            setErrors((prev) => ({ ...prev, phone: '' }));
          }}
          keyboardType="phone-pad"
          error={errors.phone}
        />

        {/* GENDER SELECTION */}
        <Text style={styles.fieldLabel}>Gender</Text>
        <View style={styles.radioRow}>
          {(['Male', 'Female', 'Other'] as const).map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.radioPill, gender === g && styles.radioPillActive]}
              onPress={() => setGender(g)}
              activeOpacity={0.8}
            >
              <Text style={[styles.radioText, gender === g && styles.radioTextActive]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* MEMBERSHIP PLAN SELECTION */}
        <Text style={styles.fieldLabel}>Select Membership Plan *</Text>
        {errors.plan ? <Text style={styles.errorText}>{errors.plan}</Text> : null}
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.plansScroll}>
          {plans.map((plan: MembershipPlan) => {
            const isSelected = selectedPlanId === plan.id;
            return (
              <TouchableOpacity
                key={plan.id}
                style={[styles.planCard, isSelected && styles.planCardActive]}
                onPress={() => {
                  setSelectedPlanId(plan.id);
                  setAmountPaid(plan.price.toString());
                  setErrors((prev) => ({ ...prev, plan: '' }));
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.planTitle, isSelected && styles.planTitleActive]}>{plan.planName}</Text>
                <Text style={[styles.planPrice, isSelected && styles.planPriceActive]}>₹{plan.price}</Text>
                <Text style={[styles.planDuration, isSelected && styles.planDurationActive]}>{plan.durationInDays} days</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* INITIAL PAYMENT STATUS */}
        <Text style={styles.fieldLabel}>Initial Payment Details</Text>

        <View style={styles.radioRow}>
          {(['Paid', 'Partial', 'Unpaid'] as const).map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.radioPill, paymentStatus === status && styles.radioPillActive]}
              onPress={() => setPaymentStatus(status)}
              activeOpacity={0.8}
            >
              <Text style={[styles.radioText, paymentStatus === status && styles.radioTextActive]}>{status}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {paymentStatus !== 'Unpaid' && (
          <>
            <Input
              label="Amount Paid (₹)"
              placeholder="e.g. 1500"
              value={amountPaid}
              onChangeText={setAmountPaid}
              keyboardType="numeric"
            />

            <Text style={styles.fieldLabel}>Payment Method</Text>
            <View style={styles.radioRow}>
              {(['UPI', 'Cash', 'Card'] as const).map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[styles.radioPill, paymentMethod === method && styles.radioPillActive]}
                  onPress={() => setPaymentMethod(method)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.radioText, paymentMethod === method && styles.radioTextActive]}>{method}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <Button
          title="Register Member Now"
          onPress={handleSubmit}
          loading={loading}
          style={styles.submitBtn}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.slate700,
    marginTop: 10,
    marginBottom: 8,
  },
  radioRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  radioPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.slate100,
    marginRight: 10,
  },
  radioPillActive: {
    backgroundColor: Colors.slate900,
  },
  radioText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.slate700,
  },
  radioTextActive: {
    color: Colors.surface,
  },
  plansScroll: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  planCard: {
    width: 130,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.slate50,
    marginRight: 10,
  },
  planCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.slate900,
  },
  planTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.slate900,
    marginBottom: 4,
  },
  planTitleActive: {
    color: Colors.surface,
  },
  planPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.success,
  },
  planPriceActive: {
    color: Colors.primary,
  },
  planDuration: {
    fontSize: 11,
    color: Colors.slate500,
    marginTop: 2,
  },
  planDurationActive: {
    color: Colors.slate400,
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    marginBottom: 8,
  },
  submitBtn: {
    marginTop: 16,
  },
});
