/**
 * obo Mobile — ManualCheckInModal Component
 * Allows receptionist or owner to manually check in a member by ID.
 */

import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { X, UserCheck } from 'lucide-react-native';
import { Input, Button } from '../components/common';
import { ownerService } from '../api';
import { Colors, Typography, Spacing, Radius } from '../theme';

export interface ManualCheckInModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ManualCheckInModal = ({
  visible,
  onClose,
  onSuccess,
}: ManualCheckInModalProps) => {
  const queryClient = useQueryClient();
  const [memberId, setMemberId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    setMemberId('');
    setError('');
    onClose();
  };

  const handleCheckIn = async () => {
    if (!memberId.trim()) {
      setError('Please enter a Member ID or Phone number');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await ownerService.manualCheckIn(memberId.trim());
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });

      Alert.alert('Check-in Recorded', `Member ${res.memberId} checked in successfully.`, [
        {
          text: 'OK',
          onPress: () => {
            handleClose();
            if (onSuccess) onSuccess();
          },
        },
      ]);
    } catch (err: any) {
      setError(err.message || 'Unable to record manual check-in.');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={styles.topRow}>
            <View style={styles.iconCircle}>
              <UserCheck size={20} color={Colors.primary} />
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <X size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>Manual Check-in</Text>
          <Text style={styles.desc}>
            Enter the Member ID or registered phone number to record check-in.
          </Text>

          <Input
            label="Member ID / Phone *"
            placeholder="e.g. GP0001 or 9876543210"
            value={memberId}
            onChangeText={(t) => {
              setMemberId(t);
              if (error) setError('');
            }}
            error={error}
            autoCapitalize="characters"
          />

          <View style={styles.actionRow}>
            <Button
              title="Cancel"
              variant="outline"
              onPress={handleClose}
              style={styles.cancelBtn}
            />
            <Button
              title="Confirm Check-in"
              onPress={handleCheckIn}
              loading={loading}
              disabled={loading || !memberId.trim()}
              style={styles.confirmBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  dialog: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.container,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  title: {
    ...Typography.sectionTitle,
    fontSize: 18,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  desc: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  cancelBtn: {
    flex: 1,
  },
  confirmBtn: {
    flex: 2,
  },
});
