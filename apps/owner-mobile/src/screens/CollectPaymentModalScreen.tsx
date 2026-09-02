import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Colors } from '../theme/colors';
import { paymentsService } from '../services/payments.service';
import { membersService } from '../services/members.service';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { Header } from '../components/ui/Header';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { SearchInput } from '../components/ui/SearchInput';
import { Member } from '../types/member';

interface CollectPaymentModalScreenProps {
  route: any;
  navigation: any;
}

export const CollectPaymentModalScreen = ({ route, navigation }: CollectPaymentModalScreenProps) => {
  const queryClient = useQueryClient();
  const initialMemberId = route.params?.memberId || '';
  const initialMemberName = route.params?.memberName || '';

  const [selectedMemberId, setSelectedMemberId] = useState(initialMemberId);
  const [selectedMemberName, setSelectedMemberName] = useState(initialMemberName);
  const [searchMember, setSearchMember] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Cash' | 'Card' | 'Bank Transfer'>('UPI');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const { data: membersData } = useQuery({
    queryKey: ['membersSearch', searchMember],
    queryFn: () => membersService.getMembers({ search: searchMember.trim() || undefined, limit: 5 }),
    enabled: searchMember.length >= 2,
  });

  const searchResults = membersData?.members || [];

  const handleSubmit = async () => {
    const errs: { [key: string]: string } = {};
    if (!selectedMemberId) errs.member = 'Please select a member to collect fee from';
    if (!amount || parseFloat(amount) <= 0) errs.amount = 'Please enter a valid payment amount greater than ₹0';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const payment = await paymentsService.recordPayment({
        memberId: selectedMemberId,
        amount: parseFloat(amount),
        paymentMethod,
        notes: notes.trim() || undefined,
      });

      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });

      Alert.alert(
        'Payment Recorded!',
        `Receipt #${payment.receiptNumber || 'OK'}: Fee payment of ₹${payment.amount} recorded for ${selectedMemberName || 'member'}.`,
        [
          {
            text: 'Done',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Payment Error', err.message || 'Failed to record payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer scrollable>
      <Header title="Record Fee Collection" subtitle="Payment Ledger Entry" onBack={() => navigation.goBack()} />

      <View style={styles.card}>
        {/* MEMBER SELECTION */}
        <Text style={styles.label}>Select Member *</Text>
        {errors.member ? <Text style={styles.errorText}>{errors.member}</Text> : null}

        {selectedMemberId ? (
          <View style={styles.selectedMemberBox}>
            <View>
              <Text style={styles.selectedName}>{selectedMemberName || 'Selected Member'}</Text>
              <Text style={styles.selectedId}>ID: {selectedMemberId}</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setSelectedMemberId('');
                setSelectedMemberName('');
              }}
              style={styles.changeBtn}
            >
              <Text style={styles.changeText}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <SearchInput
              value={searchMember}
              onChangeText={setSearchMember}
              placeholder="Type member name or ID..."
            />
            {searchResults.length > 0 && (
              <View style={styles.searchResultsBox}>
                {searchResults.map((m: Member) => (
                  <TouchableOpacity
                    key={m.id}
                    style={styles.searchRow}
                    onPress={() => {
                      setSelectedMemberId(m.id);
                      setSelectedMemberName(`${m.firstName} ${m.lastName}`);
                      setSearchMember('');
                      setErrors((prev) => ({ ...prev, member: '' }));
                    }}
                  >
                    <Text style={styles.searchName}>{m.firstName} {m.lastName}</Text>
                    <Text style={styles.searchMeta}>ID: {m.memberId}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        {/* PAYMENT AMOUNT */}
        <Input
          label="Amount Collected (₹) *"
          placeholder="e.g. 1500"
          value={amount}
          onChangeText={(t) => {
            setAmount(t);
            setErrors((prev) => ({ ...prev, amount: '' }));
          }}
          keyboardType="numeric"
          error={errors.amount}
        />

        {/* PAYMENT METHOD */}
        <Text style={styles.label}>Payment Method</Text>
        <View style={styles.radioRow}>
          {(['UPI', 'Cash', 'Card', 'Bank Transfer'] as const).map((method) => (
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

        {/* NOTES */}
        <Input
          label="Notes / Description (Optional)"
          placeholder="e.g. Monthly fee payment via PhonePe"
          value={notes}
          onChangeText={setNotes}
        />

        <Button
          title="Submit Payment Record"
          onPress={handleSubmit}
          loading={loading}
          style={styles.submitBtn}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.slate700,
    marginTop: 6,
    marginBottom: 6,
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    marginBottom: 6,
  },
  selectedMemberBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.slate100,
    marginBottom: 14,
  },
  selectedName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.slate900,
  },
  selectedId: {
    fontSize: 12,
    color: Colors.slate500,
    marginTop: 2,
  },
  changeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.slate900,
    borderRadius: 8,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.surface,
  },
  searchResultsBox: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    marginBottom: 14,
    overflow: 'hidden',
  },
  searchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.slate100,
  },
  searchName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.slate900,
  },
  searchMeta: {
    fontSize: 12,
    color: Colors.slate500,
  },
  radioRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  radioPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.slate100,
    marginRight: 8,
    marginBottom: 8,
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
  submitBtn: {
    marginTop: 14,
  },
});
